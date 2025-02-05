"use strict";
(() => {
  // src/popup.ts
  var VERSION_ELEMENT = document.getElementById("version");
  var THEME_PICKER_ELEMENT = document.getElementById("theme-picker");
  var TOGGLE_GRAPHS_ELEMENT = document.getElementById("toggle-history-graphs");
  chrome.storage.sync.get(
    {
      enableHistoryGraphs: true,
      theme: "dark"
    },
    function onGetFeatures(result) {
      VERSION_ELEMENT.textContent = "Version: " + chrome.runtime.getManifest().version;
      THEME_PICKER_ELEMENT.value = result.theme;
      TOGGLE_GRAPHS_ELEMENT.checked = result.enableHistoryGraphs;
    }
  );
  THEME_PICKER_ELEMENT.addEventListener(
    "change",
    function onThemeChange(event) {
      chrome.storage.sync.set({
        theme: event.target.value
      });
    }
  );
  TOGGLE_GRAPHS_ELEMENT.addEventListener(
    "change",
    function onHistoryGraphsChange(event) {
      chrome.storage.sync.set({
        enableHistoryGraphs: event.target.checked
      });
    }
  );
})();
