// Copyright © 2025 Navarrotech

export function waitForElementToExist<Element = HTMLElement>(
  cssSelector: string,
  timeout?: number
): Promise<Element | null> {
  // Wait for an element to exist on the page, then return it
  // Can timeout and return null

  return new Promise((resolve) => {
    let interval: NodeJS.Timeout | null = null

    const timeoutId = timeout
      ? setTimeout(() => {
        resolve(null)
        clearInterval(interval!)
      }, timeout)
      : null

    function search() {
      const element = document.querySelector(cssSelector)
      if (element) {
        clearInterval(interval!)
        clearTimeout(timeoutId!)
        resolve(element as Element)
      }
    }

    interval = setInterval(() => search(), 333)
    search()
  })
}
