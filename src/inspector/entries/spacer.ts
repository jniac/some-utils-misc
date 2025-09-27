import { MetaProperty } from '../meta-property'
import { InspectorDomEntry } from './base'

export class Spacer extends InspectorDomEntry {
  static css = /* css */`
    .inspector-spacer {
      --spacing: 0.5;
      height: calc(var(--entry-height, 24px) * var(--spacing));
      width: 100%;
    }
  `

  constructor(property: MetaProperty) {
    super()
    this.div.classList.add('inspector-spacer')
    if (Number.isFinite(property.defaultValue))
      this.div.style.setProperty('--spacing', property.defaultValue)
  }
}