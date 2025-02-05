// Copyright © 2025 Navarrotech

// NOT USED IN PRODUCTION
// Purely for dev, put this into the content script temporarily, and it will
// live hot reload the theme from the dist folder to the extension

// Requires VSCode "Live Server" extension to be running,
// which will serve the active working directory at http://127.0.0.1:5500

// Combine this with the CLI command (change theme name at the end as needed):
// nodemon --watch src --ext sass,scss --exec "make build-css-target -e theme=dark"

(async function syncThemeDev() {
  // <-- Change this to the theme name you want to sync / dev with -->
  const THEME = 'dark'

  const styleElement = document.createElement('style')
  styleElement.id = 'theme'
  document.head.appendChild(styleElement)

  let blocking = false
  let lastText = ''
  async function get() {
    if (blocking) {
      return
    }
    try {
      blocking = true
      const response = await fetch(`http://127.0.0.1:5500/dist/themes/${THEME}.css`)
      if (response.status !== 200) {
        throw new Error('Failed to fetch theme file')
      }
      const text = await response.text()

      if (lastText !== text) {
        console.log('CSS updated')
        styleElement.innerHTML = text
        lastText = text
      }
    }
    catch {
      // Do nothing
    }
    finally {
      blocking = false
    }
  }

  await get()

  setInterval(() => {
    get()
  }, 500)
})()
