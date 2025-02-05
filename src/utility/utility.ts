// Copyright © 2025 Navarrotech

// Attempt to parse JSON, return undefined if it fails, instead of throwing an error
export function parseSafe<Type = Record<string, any>>(text: string): Type | undefined {
  try {
    return JSON.parse(text) as Type
  }
  catch {
    return undefined
  }
}

// Returns the pathname of the current URL
export function getPathname() {
  return (document.location || window.location)?.pathname
}

// Returns the query of the current URL
export function getQuery() {
  return (document.location || window.location)?.search
}
