// Copyright © 2025 Navarrotech

// Typescript
import type { UnmountFunction, PageFunction, ItemReport, FullItemReport } from '../types'

// Utility
import { log, debug, warn, error } from '../loggers'
import { getPathname, getQuery, parseSafe } from '../utility/utility'
import { waitForElementToExist } from '../utility/elements'

// Constants
import { FAILED_PRICE_NUMBER } from '../constants'

/* Purpose:
 * This script will scan Walmart product pages for prices and report them to an API endpoint
 * Web crawling every store page is not feasible, so we will rely on users to report prices
 * Reporting is an OPT-IN feature, users can opt out by using the extension's popup action menu
 */

/* Pages watched:
  * /ip/item-name/item-id - Item page
  * /search ?q=<search> - Search page
  * /cart - Cart page
  * /shop - Shop page
  * /browse - Browse page
  * /cp/ - Category page
  */

/*
  * Notes:
  * We NEVER scan anything on checkout pages
  * We NEVER scan anything on account pages
  * We NEVER scan anything on auth pages like login or signup
  * We NEVER collect personal user information
  * We only scan public information listings like search, cart, item, etc.
  */

(async function walmartInspectorPriceReporterCS() {
  // This function watches for price changes on Walmart product pages
  // It will then report the price to an API endpoint

  // ////////////////////// //
  //          Cache         //
  // ////////////////////// //

  // Keep a list of reported item IDs to avoid duplicates getting reported
  let reportedItemIds: Record<string, boolean> = {}

  // ////////////////////// //
  //         Utility        //
  // ////////////////////// //

  function iterateOverStoreListings() {
    // Iterate over all store listings on the page and report their prices

    const found: ItemReport[] = []
    const items = document.querySelectorAll('[data-item-id]')
    for (const item of Array.from(items)) {
      const scanned = analyzeStoreListingItem(item)

      if (!scanned) {
        continue
      }

      found.push(scanned)
    }

    if (found.length) {
      reportPriceOfItemToDatabase(found)
    }
  }

  function analyzeStoreListingItem(item: Element): ItemReport | undefined {
    // Analyze a store listing HTML item and return its price and ID

    const itemId = item.querySelector('a[link-identifier]')
      ?.getAttribute('link-identifier')
        || item.getAttribute('data-item-id')

    const priceElement = item.querySelector('[data-automation-id="product-price"] > *')

    const price = priceTextToNumber(priceElement?.textContent)
    const itemName = item.querySelector('a span')?.textContent

    if (!itemId || !price || reportedItemIds[itemId]) {
      return undefined
    }

    return {
      itemName,
      itemId,
      price
    }
  }

  function priceTextToNumber(text?: string): number {
    // We need to strip all nondigits from the price (not including a period)

    // Variations seen:
    // Now $0.26
    // $0.26
    // $0.26 / each
    // $0.26 / ea
    // 1.23

    if (!text) {
      return FAILED_PRICE_NUMBER
    }

    const res = Number(text.replace(/[^0-9.]/g, ''))

    if (isNaN(res)) {
      warn('Failed to parse price', text)
      return FAILED_PRICE_NUMBER
    }
    return res
  }

  function getStoreId(): string {
    // Get the store ID from the page
    // We need this because Walmart prices vary per store

    // Method A: Get it from their NEXT_DATA
    const nextDataElement = document.getElementById('__NEXT_DATA__')
    if (nextDataElement) {
      const nextData = parseSafe(nextDataElement.innerHTML)

      const data = nextData?.props?.pageProps?.initialData?.data
      const modules = data?.contentLayout?.modules || []

      for (const module of modules) {
        const storeId = module?.configs?.ad?.storeId
            || module?.configs?.ad?.adsContext?.locationContext?.storeId
            || module?.configs?.ad?.adsContext?.locationContext?.pickupStore
            || module?.configs?.ad?.adsContext?.locationContext?.deliveryStore
        if (storeId) {
          return storeId
        }
      }

      const storeId = data?.contentLayout?.pageMetadata?.location?.storeId
          || data?.contentLayout?.pageMetadata?.location?.pickupStore
          || data?.contentLayout?.pageMetadata?.location?.deliveryStore
          || data?.product?.fulfillmentSummary?.find((product: any) => product?.storeId)?.storeId

      if (storeId) {
        return storeId
      }
    }

    // Method B: Data module data
    const moduleElement = document.querySelector('[data-module-data]')
    if (moduleElement) {
      const moduleData = parseSafe(moduleElement.getAttribute('data-module-data')!)

      const storeId = moduleData?.configs?.ad?.storeId
          || moduleData?.configs?.ad?.adsContext?.locationContext?.storeId
          || moduleData?.configs?.ad?.adsContext?.locationContext?.pickupStore
          || moduleData?.configs?.ad?.adsContext?.locationContext?.deliveryStore
      if (storeId) {
        return storeId
      }
    }
    // Method C: Try to get it from their data-debug
    const debugElement = document.querySelector('[data-debug]')
    if (debugElement) {
      const debugData = parseSafe(debugElement.getAttribute('data-debug')!)
      const storeId = debugData?.adContent?.dbg?.variables?.adsContext?.locationContext?.storeId
      if (storeId) {
        return storeId
      }
    }

    return 'unknown'
  }

  // ////////////////////// //
  //           API          //
  // ////////////////////// //

  async function reportPriceOfItemToDatabase(item: ItemReport | ItemReport[]) {
    const storeId = getStoreId()

    // Yeah I'll admit this is hard to read lol
    const items: FullItemReport[] = (
      Array.isArray(item)
        ? item
        : [ item ]
    )
      .map((item) => ({
        ...item,
        storeId
      }))

    if (!items.length) {
      debug('No items to report')
      return
    }

    // Whitelist management, prevent duplicates from being reported
    for (const item of items) {
      reportedItemIds[item.itemId] = true
    }

    debug('Reporting price of item to database', items)
  }

  // ////////////////////// //
  //       Main Methods     //
  // ////////////////////// //

  async function searchPage() {
    debug('Search page!')

    // Use an interval in case the user scrolls and more items load
    const interval = setInterval(
      () => iterateOverStoreListings(),
      1_000
    )

    // Return a cleanup unmount function
    return async () => {
      clearInterval(interval)
    }
  }

  async function itemPage(pathRegex: RegExpMatchArray) {
    debug('Item page!')
    const priceElement = await waitForElementToExist(
      '[data-seo-id="hero-price"]',
      10_000
    )

    if (priceElement) {
      // Report the primary item listed on the page
      const price = priceTextToNumber(priceElement.textContent || '')
      const itemId = pathRegex[2]
      const itemName = document.title.replace(' - Walmart.com', '')
      await reportPriceOfItemToDatabase({
        itemName,
        itemId,
        price
      })
    }

    // Proceed to report any other items listed on the page (like recommended items)

    return searchPage()
  }

  async function cartPage() {
    debug('Cart page!')

    // In an interval because the cart could be added to over time while it's being viewed
    // OR it could be expanded to "show more items" and we want to scan those too
    const cartInterval = setInterval(() => {
      const list = document.querySelector('[data-testid="product-tile-container"]')

      // Cart could be empty
      if (list) {
        const found: ItemReport[] = []
        for (const child of Array.from(list.childNodes)) {
          // @ts-ignore
          const itemName = child?.querySelector('[link-identifier=itemClick]').text
          // @ts-ignore
          const itemId = child?.querySelector('[data-usitemid]')?.getAttribute('data-usitemid')
          // @ts-ignore
          const priceTxt = child?.querySelector('[data-testid="line-price"]')?.textContent

          const price = priceTextToNumber(priceTxt)

          if (!itemId || !price || reportedItemIds[itemId] || price === FAILED_PRICE_NUMBER) {
            continue
          }

          found.push({
            price,
            itemId,
            itemName
          })
        }

        if (found.length) {
          reportPriceOfItemToDatabase(found)
        }
      }
    }, 2_500)

    const searchInterval = await searchPage()

    return async () => {
      clearInterval(cartInterval)
      await searchInterval()
    }
  }

  const functionPerPage: Record<string, PageFunction> = {
    // Item product page:
    ['^/ip/(.*)/(.*)$']: itemPage,
    // Search results page:
    ['^/cart']: cartPage,
    ['^/search$']: searchPage,
    ['^/shop']: searchPage,
    ['^/cp/']: searchPage,
    ['^/browse']: searchPage
  }

  // ////////////////////// //
  //           Init         //
  // ////////////////////// //

  log('Starting up!')

  // Walmart.com uses SPA so we need to scan the page every time the URL changes
  let previousPathname: string | undefined = undefined
  let previousQuery: string | undefined = undefined
  let blocking: boolean = false
  let onComponentWillUnmount: UnmountFunction | undefined
  setInterval(
    async function pageWatchInterval() {
      if (blocking) {
        return
      }
      const currentPathname = getPathname()
      const currentQuery = getQuery()
      if (currentPathname !== previousPathname || previousQuery !== currentQuery) {
        debug(
          'walmartInspectorMainCS pathname changed',
          currentPathname,
          currentQuery
        )

        previousPathname = currentPathname
        previousQuery = currentQuery

        // We'll run the function that matches the current URL
        let found: boolean = false
        for (const route in functionPerPage) {
          const result = currentPathname.match(route)
          if (result) {
            found = true

            blocking = true
            await onComponentWillUnmount?.()
            onComponentWillUnmount = await functionPerPage[route](result)
            blocking = false
            break
          }
        }

        if (!found) {
          debug('No function found for this page')
        }
      }
    },
    500
  )

  // Extreme cache busting, in case the page gets left open for 24+ hours
  setInterval(
    () => {
      try {
        location?.reload()
      }
      catch (err: unknown | Error) {
        error(err)

        // Attempt a manual cache clear
        reportedItemIds = {}
      }
    },
    1_000 * 60 * 60 * 24 // 24 hours
  )
})()
