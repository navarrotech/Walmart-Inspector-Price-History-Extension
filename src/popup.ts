// Copyright © 2025 Navarrotech

import type * as Types from './types'

// ////////////////////// //
//        Constants       //
// ////////////////////// //

const VERSION_ELEMENT = document.getElementById('version') as HTMLParagraphElement
const THEME_PICKER_ELEMENT = document.getElementById('theme-picker') as HTMLSelectElement
const TOGGLE_GRAPHS_ELEMENT = document.getElementById('toggle-history-graphs') as HTMLInputElement

// ////////////////////// //
//           Main         //
// ////////////////////// //

// Initialization
chrome.storage.sync.get(
  {
    enableHistoryGraphs: true,
    theme: 'dark'
  } as Types.ExtensionStorage,
  function onGetFeatures(result: Types.ExtensionStorage) {
    VERSION_ELEMENT.textContent = 'Version: ' + chrome.runtime.getManifest().version
    THEME_PICKER_ELEMENT.value = result.theme
    TOGGLE_GRAPHS_ELEMENT.checked = result.enableHistoryGraphs
  }
)

// Theme picker event listener
THEME_PICKER_ELEMENT.addEventListener(
  'change',
  function onThemeChange(event) {
    chrome.storage.sync.set({
      theme: (event.target as HTMLSelectElement).value
    } as Types.ExtensionStorage)
  }
)

// Toggle graphs event listener
TOGGLE_GRAPHS_ELEMENT.addEventListener(
  'change',
  function onHistoryGraphsChange(event) {
    chrome.storage.sync.set({
      enableHistoryGraphs: (event.target as HTMLInputElement).checked
    } as Types.ExtensionStorage)
  }
)
