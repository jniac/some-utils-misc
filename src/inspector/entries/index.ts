import { InspectorDomEntry } from './base'
import { Button } from './button'
import { Group } from './group'
import { SearchEntry } from './search'
import { Spacer } from './spacer'

export {
  Button,
  Group,
  SearchEntry,
  Spacer
}

export type {
  InspectorDomEntry
}

export const entriesCssChunks = [
  InspectorDomEntry.css,

  Button.css,
  Group.css,
  SearchEntry.css,
  Spacer.css,
]
