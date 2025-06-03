"use strict";
(() => {
  // src/constants.ts
  var NAME = "Walmart Inspector";
  var FAILED_PRICE_NUMBER = -1;

  // src/env.ts
  var NODE_ENV = "development";
  var isDev = NODE_ENV === "development";

  // src/loggers.ts
  function log(...messages) {
    console.log(NAME + " :: ", ...messages);
  }
  function debug(...messages) {
    if (!isDev) {
      return;
    }
    console.debug(NAME + " :: ", ...messages);
  }
  function warn(...messages) {
    console.warn(NAME + " :: ", ...messages);
  }
  function error(...messages) {
    console.error(NAME + " :: ", ...messages);
  }

  // src/utility/utility.ts
  function parseSafe(text) {
    try {
      return JSON.parse(text);
    } catch {
      return void 0;
    }
  }
  function getPathname() {
    return (document.location || window.location)?.pathname;
  }
  function getQuery() {
    return (document.location || window.location)?.search;
  }

  // src/utility/elements.ts
  function waitForElementToExist(cssSelector, timeout) {
    return new Promise((resolve) => {
      let interval = null;
      const timeoutId = timeout ? setTimeout(() => {
        resolve(null);
        clearInterval(interval);
      }, timeout) : null;
      function search() {
        const element = document.querySelector(cssSelector);
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

  // node_modules/lodash-es/isArray.js
  var isArray = Array.isArray;
  var isArray_default = isArray;

  // node_modules/lodash-es/isObject.js
  function isObject(value) {
    var type = typeof value;
    return value != null && (type == "object" || type == "function");
  }
  var isObject_default = isObject;

  // src/utility/search.ts
  function deepSearchKeyValue(data, key) {
    if (isArray_default(data)) {
      for (const item of data) {
        const result = deepSearchKeyValue(item, key);
        if (result !== void 0) {
          return result;
        }
      }
    } else if (isObject_default(data)) {
      const obj = data;
      if (Object.prototype.hasOwnProperty.call(obj, key) && (typeof obj[key] === "string" || typeof obj[key] === "number")) {
        if (typeof obj[key] === "number") {
          return String(obj[key]);
        }
        return obj[key];
      }
      for (const key2 of Object.keys(obj)) {
        const result = deepSearchKeyValue(obj[key2], key2);
        if (result !== void 0) {
          return result;
        }
      }
    }
    return void 0;
  }

  // src/contentScript/priceReporter.ts
  (async function walmartInspectorPriceReporterCS() {
    let reportedItemIds = {};
    function iterateOverStoreListings() {
      const found = [];
      const items = document.querySelectorAll("[data-item-id]");
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
      let price = FAILED_PRICE_NUMBER;
      let priceElement = item.querySelector('[data-automation-id="product-price"] > span');
      if (priceElement) {
        price = priceTextToNumber(priceElement?.textContent);
      }
      if (!priceElement || price === FAILED_PRICE_NUMBER) {
        priceElement = item.querySelector('[data-automation-id="product-price"] > *:first-child');
        price = priceTextToNumber(priceElement?.textContent) / 100;
      }
      if (!priceElement || price === FAILED_PRICE_NUMBER) {
        priceElement = item.querySelector('[data-automation-id="product-price"] > *');
        price = priceTextToNumber(priceElement?.textContent);
      }
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
      let nextDataVar = null;
      try {
        nextDataVar = __NEXT_DATA__;
        if (nextDataVar?.tagName === "SCRIPT") {
          nextDataVar = parseSafe(nextDataVar.innerHTML);
        }
      } catch {
        log("No __NEXT_DATA__ found");
        nextDataVar = null;
      }
      const nextDataElement = document.getElementById("__NEXT_DATA__");
      if (nextDataElement || nextDataVar) {
        const nextData = nextDataVar || parseSafe(nextDataElement.innerHTML);
        debug("Found next data", nextData);
        const initialData = nextData?.props?.pageProps?.initialData;
        const data = initialData?.data;
        const modules = data?.contentLayout?.modules || [];
        if (nextData?.pageProps?.initialTempoData?.data?.contentLayout?.pageMetadata?.location?.storeId) {
          return nextData.pageProps.initialTempoData.data.contentLayout.pageMetadata.location.storeId;
        }
        if (initialData?.moduleDataByZone?.topZone2?.configs?.ad?.storeId) {
          return initialData?.moduleDataByZone?.topZone2?.configs?.ad?.storeId;
        }
        if (data?.moduleDataByZone?.topZone2?.configs?.ad?.storeId) {
          return data?.moduleDataByZone?.topZone2?.configs?.ad?.storeId;
        }
        if (data?.contentLayout?.pageMetadata?.location?.storeId) {
          return data?.contentLayout?.pageMetadata?.location?.storeId;
        }
        for (const mod of modules) {
          const storeId2 = mod?.configs?.ad?.storeId || mod?.configs?.ad?.adsContext?.locationContext?.storeId || mod?.configs?.ad?.adsContext?.locationContext?.pickupStore || mod?.configs?.ad?.adsContext?.locationContext?.deliveryStore;
          if (storeId2) {
            return storeId2;
          }
        }
        const storeId = data?.contentLayout?.pageMetadata?.location?.storeId || data?.contentLayout?.pageMetadata?.location?.pickupStore || data?.contentLayout?.pageMetadata?.location?.deliveryStore || data?.product?.fulfillmentSummary?.find((product) => product?.storeId)?.storeId;
        if (storeId) {
          return storeId;
        }
        const deepSearched = deepSearchKeyValue(nextData, "storeId");
        if (deepSearched) {
          debug("Found store ID via deep search", deepSearched);
          return deepSearched;
        }
      }
      const moduleElement = document.querySelector("[data-module-data]");
      if (moduleElement) {
        const moduleData = parseSafe(moduleElement.getAttribute("data-module-data"));
        const storeId = moduleData?.configs?.ad?.storeId || moduleData?.configs?.ad?.adsContext?.locationContext?.storeId || moduleData?.configs?.ad?.adsContext?.locationContext?.pickupStore || moduleData?.configs?.ad?.adsContext?.locationContext?.deliveryStore;
        if (storeId) {
          return storeId;
        }
      }
      const debugElement = document.querySelector("[data-debug]");
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
      if (storeId === "unknown") {
        log("Could not find store ID, skipping report");
        return;
      }
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
      const payload = {
        topic: "process-prices-data",
        payload: items
      };
      chrome.runtime.sendMessage(payload);
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
        const itemName = document.title.replace(" - Walmart.com", "");
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
        const list = document.querySelector('[data-testid="product-tile-container"]');
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

  // src/contentScript/themeManager.ts
  (async function walmartManageThemes() {
    log("Starting theme switcher");
    let linkElement;
    function loadTheme(theme) {
      log("Loading theme", theme);
      linkElement?.remove();
      if (theme === "default") {
        return;
      }
      const fileUrl = chrome.runtime.getURL(`dist/themes/${theme}.css`);
      linkElement = document.createElement("link");
      linkElement.id = "WalmartInspectorTheme";
      linkElement.rel = "stylesheet";
      linkElement.href = fileUrl;
      document?.head.appendChild(linkElement);
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
})();
/*! Bundled license information:

lodash-es/lodash.js:
  (**
   * @license
   * Lodash (Custom Build) <https://lodash.com/>
   * Build: `lodash modularize exports="es" -o ./`
   * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
   * Released under MIT license <https://lodash.com/license>
   * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
   * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   *)
*/
