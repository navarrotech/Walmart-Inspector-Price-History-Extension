// Copyright © 2025 Navarrotech

import { NAME } from './constants'

// Named loggers
export function log(...messages: any[]) {
  console.log(NAME + ' :: ', ...messages)
}
export function debug(...messages: any[]) {
  console.debug(NAME + ' :: ', ...messages)
}
export function warn(...messages: any[]) {
  console.warn(NAME + ' :: ', ...messages)
}
export function error(...messages: any[]) {
  console.error(NAME + ' :: ', ...messages)
}
