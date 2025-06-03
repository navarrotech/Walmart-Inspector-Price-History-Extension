// Copyright © 2025 Navarrotech

export type Theme =
  | 'default'
  | 'dark'
  | 'bubblegum'
  | 'spark'

export type ExtensionStorage = {
  theme: Theme
  enableHistoryGraphs: boolean
}

export type UnmountFunction = () => Promise<void>
export type PageFunction = (match: RegExpMatchArray) => Promise<UnmountFunction>
export type ItemReport = {
  itemName?: string
  itemId: string
  price: number
}
export type FullItemReport = ItemReport & {
  storeId: string
}

// ////////////////// //
//     Chrome IPC     //
// ////////////////// //

export type Topics =
  'process-prices-data'

export type Pub<Topic extends Topics = Topics> = {
  topic: Topic
  payload:
    Topic extends 'process-prices-data'
    ? FullItemReport[]
    : never
}
