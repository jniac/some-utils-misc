import { capitalCase } from 'change-case'

import { InspectorDomEntry } from './base'
import { Border } from './components'

export class Button extends InspectorDomEntry {
  static css = /* css */`  
    .inspector-button > button {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: none;
      border: none;
      color: inherit;
      font: inherit;
      font-size: 12px;
      padding: 0;
      text-align: center;
      cursor: pointer;
      border-radius: var(--input-border-radius, .25em);
      background-color: #ffffff09;
    }
  `

  constructor(label: string, onClick: () => void) {
    super()
    this.div.classList.add('inspector-button')
    this.div.innerHTML = /* html */`
      <button>
        ${capitalCase(label)}
      </button>
    `
    this.div.appendChild(new Border({ opacity: .666 }).div)
    this.div.onclick = onClick
  }
}
