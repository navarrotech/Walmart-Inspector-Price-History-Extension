// Copyright © 2025 Navarrotech

import fs from 'fs'
import path from 'path'

// This file will walk each file in the dist/ folder
// If it's a .js file, it will append a new first line with the current copyright template with //
// If it's a .css file, it will append a new first line with the current css license template with /* */

// ///////////////////////// //
//         Constants         //
// ///////////////////////// //

const distFolder = path.resolve('./dist')
const getCopyright = () => `Copyright © ${new Date().getFullYear()} Navarrotech`

// ///////////////////////// //
//           Utility         //
// ///////////////////////// //
function walkDir(dir: string, callback: (filePath: string) => void) {
  for (const f of fs.readdirSync(dir)) {
    const dirPath = path.join(dir, f)
    const isDirectory = fs.statSync(dirPath).isDirectory()
    if (isDirectory) {
      walkDir(dirPath, callback)
    }
    else {
      callback(dirPath)
    }
  }
}

// ///////////////////////// //
//            Main           //
// ///////////////////////// //

async function main() {
  walkDir(distFolder, (filePath) => {
    const ext = path.extname(filePath)
    if (ext !== '.js' && ext !== '.css') {
      return
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')

    if (ext === '.js') {
      const newContent = `// ${getCopyright()}\n\n` + fileContent
      fs.writeFileSync(filePath, newContent)
    }
    else if (ext === '.css') {
      const newContent = `/* ${getCopyright()} */\n` + fileContent
      fs.writeFileSync(filePath, newContent)
    }
  })

  console.log('Finished adding headers to files')
  process.exit(0)
}

main()
