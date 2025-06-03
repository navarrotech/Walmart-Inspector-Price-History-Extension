"use strict";
(() => {
  // src/constants.ts
  var NAME = "Walmart Inspector";
  var API_URL = "https://walmart.thegreatjalapeno.com/reports";

  // src/loggers.ts
  function error(...messages) {
    console.error(NAME + " :: ", ...messages);
  }

  // src/background.ts
  chrome.runtime.onMessage.addListener(
    async function(message) {
      if (!message?.topic) {
        return;
      }
      if (message.topic === "process-prices-data") {
        await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "Application/JSON"
          },
          body: JSON.stringify({
            version: 1,
            reports: message.payload
          })
        });
        return;
      }
      error("Unknown message topic:", message.topic);
    }
  );
})();
