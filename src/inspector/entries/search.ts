import { InspectorDomEntry } from './base'

export class SearchEntry extends InspectorDomEntry {
  static css = /* css */`
    .inspector-search {
      margin-bottom: 12px;
    }
  `

  inputElement: HTMLInputElement

  constructor() {
    super()
    this.div.classList.add('inspector-search')
    this.div.innerHTML = /* html */`
      <input type='text' placeholder='Search fields...' />
    `
    this.inputElement = this.div.querySelector('input')!
  }
}
