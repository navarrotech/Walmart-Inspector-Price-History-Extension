// Copyright © 2025 Navarrotech

// Typescript
import type { Theme, ExtensionStorage } from '../types'

// Utility
import { log, debug } from '../loggers'

(async function walmartManageThemes() {
  log('Starting theme switcher')

  let linkElement: HTMLLinkElement

  function loadTheme(theme: Theme) {
    log('Loading theme', theme)
    linkElement?.remove()

    if (theme === 'default') {
      return
    }

    const fileUrl: string = chrome.runtime.getURL(`dist/themes/${theme}.css`)
    linkElement = document.createElement('link')
    linkElement.id = 'WalmartInspectorTheme'
    linkElement.rel = 'stylesheet'
    linkElement.href = fileUrl
    document?.head.appendChild(linkElement)
    debug('Theme loaded', linkElement)
  }

  // Load initial theme
  const currentTheme = await chrome.storage.sync.get('theme') as ExtensionStorage
  loadTheme(currentTheme.theme)

  // Listen to changes
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.theme) {
      const newValue = changes.theme.newValue as Theme
      loadTheme(newValue)
    }
  })
})()
