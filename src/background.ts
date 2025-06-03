// Copyright © 2025 Navarrotech

// Typescript
import type { Pub } from './types'

// Constants & Misc
import { error } from './loggers'
import { API_URL } from './constants'

chrome.runtime.onMessage.addListener(
  async function(message: Pub): Promise<void> {
    if (!message?.topic) {
      return
    }

    if (message.topic === 'process-prices-data') {
      await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'Application/JSON'
        },
        body: JSON.stringify({
          version: 1,
          reports: message.payload
        })
      })
      return
    }
    error('Unknown message topic:', message.topic)
  }
)
