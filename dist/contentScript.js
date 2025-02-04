"use strict";
(() => {
  // src/contentScript.ts
  (async function WalmartInspector(document2) {
    const NAME = "walmartInspectorMainCS";
    const FAILED_PRICE_NUMBER = -1;
    function log(...messages) {
      console.log(NAME + " :: ", ...messages);
    }
    function debug(...messages) {
      console.debug(NAME + " :: ", ...messages);
    }
    function warn(...messages) {
      console.warn(NAME + " :: ", ...messages);
    }
    function error(...messages) {
      console.error(NAME + " :: ", ...messages);
    }
    function parseSafe(text) {
      try {
        return JSON.parse(text);
      } catch {
        return void 0;
      }
    }
    function getPathname() {
      return (document2.location || window.location)?.pathname;
    }
    function getQuery() {
      return (document2.location || window.location)?.search;
    }
    function waitForElementToExist(cssSelector, timeout) {
      return new Promise((resolve) => {
        let interval = null;
        const timeoutId = timeout ? setTimeout(() => {
          resolve(null);
          clearInterval(interval);
        }, timeout) : null;
        function search() {
          const element = document2.querySelector(cssSelector);
          if (element) {
            clearInterval(interval);
            clearTimeout(timeoutId);
            resolve(element);
          }
        }
        interval = setInterval(() => search(), 333);
        search();
      });
    }
    (async function walmartInspectorPriceReporterCS() {
      let reportedItemIds = {};
      function iterateOverStoreListings() {
        const found = [];
        const items = document2.querySelectorAll("[data-item-id]");
        for (const item of Array.from(items)) {
          const scanned = analyzeStoreListingItem(item);
          if (!scanned) {
            continue;
          }
          found.push(scanned);
        }
        if (found.length) {
          reportPriceOfItemToDatabase(found);
        }
      }
      function analyzeStoreListingItem(item) {
        const itemId = item.querySelector("a[link-identifier]")?.getAttribute("link-identifier") || item.getAttribute("data-item-id");
        const priceElement = item.querySelector('[data-automation-id="product-price"] > *');
        const price = priceTextToNumber(priceElement?.textContent);
        const itemName = item.querySelector("a span")?.textContent;
        if (!itemId || !price || reportedItemIds[itemId]) {
          return void 0;
        }
        return {
          itemName,
          itemId,
          price
        };
      }
      function priceTextToNumber(text) {
        if (!text) {
          return FAILED_PRICE_NUMBER;
        }
        const res = Number(text.replace(/[^0-9.]/g, ""));
        if (isNaN(res)) {
          warn("Failed to parse price", text);
          return FAILED_PRICE_NUMBER;
        }
        return res;
      }
      function getStoreId() {
        const nextDataElement = document2.getElementById("__NEXT_DATA__");
        if (nextDataElement) {
          const nextData = parseSafe(nextDataElement.innerHTML);
          const data = nextData?.props?.pageProps?.initialData?.data;
          const modules = data?.contentLayout?.modules || [];
          for (const module of modules) {
            const storeId2 = module?.configs?.ad?.storeId || module?.configs?.ad?.adsContext?.locationContext?.storeId || module?.configs?.ad?.adsContext?.locationContext?.pickupStore || module?.configs?.ad?.adsContext?.locationContext?.deliveryStore;
            if (storeId2) {
              return storeId2;
            }
          }
          const storeId = data?.contentLayout?.pageMetadata?.location?.storeId || data?.contentLayout?.pageMetadata?.location?.pickupStore || data?.contentLayout?.pageMetadata?.location?.deliveryStore || data?.product?.fulfillmentSummary?.find((product) => product?.storeId)?.storeId;
          if (storeId) {
            return storeId;
          }
        }
        const moduleElement = document2.querySelector("[data-module-data]");
        if (moduleElement) {
          const moduleData = parseSafe(moduleElement.getAttribute("data-module-data"));
          const storeId = moduleData?.configs?.ad?.storeId || moduleData?.configs?.ad?.adsContext?.locationContext?.storeId || moduleData?.configs?.ad?.adsContext?.locationContext?.pickupStore || moduleData?.configs?.ad?.adsContext?.locationContext?.deliveryStore;
          if (storeId) {
            return storeId;
          }
        }
        const debugElement = document2.querySelector("[data-debug]");
        if (debugElement) {
          const debugData = parseSafe(debugElement.getAttribute("data-debug"));
          const storeId = debugData?.adContent?.dbg?.variables?.adsContext?.locationContext?.storeId;
          if (storeId) {
            return storeId;
          }
        }
        return "unknown";
      }
      async function reportPriceOfItemToDatabase(item) {
        const storeId = getStoreId();
        const items = (Array.isArray(item) ? item : [item]).map((item2) => ({
          ...item2,
          storeId
        }));
        if (!items.length) {
          debug("No items to report");
          return;
        }
        for (const item2 of items) {
          reportedItemIds[item2.itemId] = true;
        }
        debug("Reporting price of item to database", items);
      }
      async function searchPage() {
        debug("Search page!");
        const interval = setInterval(
          () => iterateOverStoreListings(),
          1e3
        );
        return async () => {
          clearInterval(interval);
        };
      }
      async function itemPage(pathRegex) {
        debug("Item page!");
        const priceElement = await waitForElementToExist(
          '[data-seo-id="hero-price"]',
          1e4
        );
        if (priceElement) {
          const price = priceTextToNumber(priceElement.textContent || "");
          const itemId = pathRegex[2];
          const itemName = document2.title.replace(" - Walmart.com", "");
          await reportPriceOfItemToDatabase({
            itemName,
            itemId,
            price
          });
        }
        return searchPage();
      }
      async function cartPage() {
        debug("Cart page!");
        const cartInterval = setInterval(() => {
          const list = document2.querySelector('[data-testid="product-tile-container"]');
          if (list) {
            const found = [];
            for (const child of Array.from(list.childNodes)) {
              const itemName = child?.querySelector("[link-identifier=itemClick]").text;
              const itemId = child?.querySelector("[data-usitemid]")?.getAttribute("data-usitemid");
              const priceTxt = child?.querySelector('[data-testid="line-price"]')?.textContent;
              const price = priceTextToNumber(priceTxt);
              if (!itemId || !price || reportedItemIds[itemId] || price === FAILED_PRICE_NUMBER) {
                continue;
              }
              found.push({
                price,
                itemId,
                itemName
              });
            }
            if (found.length) {
              reportPriceOfItemToDatabase(found);
            }
          }
        }, 2500);
        const searchInterval = await searchPage();
        return async () => {
          clearInterval(cartInterval);
          await searchInterval();
        };
      }
      const functionPerPage = {
        // Item product page:
        ["^/ip/(.*)/(.*)$"]: itemPage,
        // Search results page:
        ["^/cart"]: cartPage,
        ["^/search$"]: searchPage,
        ["^/shop"]: searchPage,
        ["^/cp/"]: searchPage,
        ["^/browse"]: searchPage
      };
      log("Starting up!");
      let previousPathname = void 0;
      let previousQuery = void 0;
      let blocking = false;
      let onComponentWillUnmount;
      setInterval(
        async function pageWatchInterval() {
          if (blocking) {
            return;
          }
          const currentPathname = getPathname();
          const currentQuery = getQuery();
          if (currentPathname !== previousPathname || previousQuery !== currentQuery) {
            debug(
              "walmartInspectorMainCS pathname changed",
              currentPathname,
              currentQuery
            );
            previousPathname = currentPathname;
            previousQuery = currentQuery;
            let found = false;
            for (const route in functionPerPage) {
              const result = currentPathname.match(route);
              if (result) {
                found = true;
                blocking = true;
                await onComponentWillUnmount?.();
                onComponentWillUnmount = await functionPerPage[route](result);
                blocking = false;
                break;
              }
            }
            if (!found) {
              debug("No function found for this page");
            }
          }
        },
        500
      );
      setInterval(
        () => {
          try {
            location?.reload();
          } catch (err) {
            error(err);
            reportedItemIds = {};
          }
        },
        1e3 * 60 * 60 * 24
        // 24 hours
      );
    })();
    (async function walmartInspectorGraphCS() {
    })();
    (async function walmartManageThemes() {
      log("Starting theme switcher");
      let linkElement;
      function loadTheme(theme) {
        log("Loading theme", theme);
        if (theme === "default") {
          linkElement?.remove();
          return;
        }
        const fileUrl = chrome.runtime.getURL(`dist/themes/${theme}.css`);
        linkElement = document2.createElement("link");
        linkElement.id = "WalmartInspectorTheme";
        linkElement.rel = "stylesheet";
        linkElement.href = fileUrl;
        document2?.head.appendChild(linkElement);
        debug("Theme loaded", linkElement);
      }
      const currentTheme = await chrome.storage.sync.get("theme");
      loadTheme(currentTheme.theme);
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "sync" && changes.theme) {
          const newValue = changes.theme.newValue;
          loadTheme(newValue);
        }
      });
    })();
  })(document);
})();
