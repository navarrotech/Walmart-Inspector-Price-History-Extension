// Copyright © 2025 Navarrotech

import { isArray, isObject } from 'lodash-es'

// Same signature: returns string | number | undefined
export function deepSearchKeyValue(data: unknown, key: string): string | undefined {
  // If it's an array, loop and recurse
  if (isArray(data)) {
    for (const item of data) {
      const result = deepSearchKeyValue(item, key)
      if (result !== undefined) {
        return result
      }
    }
  }
  // If it's a plain object (not null, not array, not other primitives)
  else if (isObject(data)) {
    // Cast to a key→value map
    const obj = data as { [key: string]: unknown }
    // If it directly has the key (and is string or number), return it
    if (
      Object.prototype.hasOwnProperty.call(obj, key)
      && (typeof obj[key] === 'string' || typeof obj[key] === 'number')
    ) {
      if (typeof obj[key] === 'number') {
        return String(obj[key]) // Convert number to string
      }
      return obj[key]
    }
    // Otherwise, recurse through each property
    for (const key of Object.keys(obj)) {
      const result = deepSearchKeyValue(obj[key], key)
      if (result !== undefined) {
        return result
      }
    }
  }
  return undefined
}
