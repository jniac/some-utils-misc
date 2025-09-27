import { capitalCase } from 'change-case'

import { MetaProperty } from '../meta-property'
import { createSvg } from '../svg'
import { FieldNode } from '../tree'
import { InspectorDomEntry } from './base'

export class Group extends InspectorDomEntry {
  static css = /* css */`
    .inspector-group {
      display: flex;
      flex-direction: row;
      gap: 4px;
      cursor: pointer;
    }
  `;

  constructor(property: MetaProperty, node: FieldNode) {
    super()
    this.div.classList.add('inspector-group')
    this.div.innerHTML = /* html */`
      <div class="group-label">
        ${capitalCase(property.key)}
      </div>
      <div style="flex: 1 0 0;"></div>
      <div class="group-info"></div>
    `
    const chevronDown = createSvg(node.expanded ? 'chevronDown' : 'chevronRight', { width: 12, height: 12 })
    this.div.prepend(chevronDown)

    const visiblePropertyCount = node.visiblePropertyCount()
    const propertyCount = node.properties.length
    this.div.querySelector('.group-info')!.innerHTML =
      visiblePropertyCount === propertyCount
        ? `(${propertyCount})`
        : `(${visiblePropertyCount}/${propertyCount})`
  }
}
