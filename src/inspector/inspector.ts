
import { Ticker } from 'some-utils-ts/ticker'
import { DestroyableObject } from 'some-utils-ts/types'

import { entriesCssChunks, InspectorDomEntry, Spacer } from './entries'
import { Button } from './entries/button'
import { componentsCssChunks } from './entries/components'
import { allFields, Field, fieldsCssChunks, MetaField } from './entries/fields'
import { Group } from './entries/group'
import { SearchEntry } from './entries/search'
import { InspectorMetaObject, isRawMetaProperty, isRawMetaPropertyAsArray, MetaProperty, RawMetaProperty } from './meta-property'
import { FieldTree } from './tree'
import { prefixCssSelectors } from './utils/prefix-css-selectors'

import css from './inspector.css'
import closeSvg from './svg/close.svg'

/**
 * Infer fields from an object instance.
 */
function inferFields<T extends object>(instance: T): MetaProperty[] {
  const fields: MetaProperty[] = []
  for (const key of Object.keys(instance)) {
    const value = (instance as any)[key]
    const meta = (instance as any).constructor[key]
    const type = meta?.type ?? typeof value
    const description = meta?.description
    fields.push(new MetaProperty({
      key,
      value: value,
      type,
      description,
    }))
  }
  return fields
}

function tryApplyChange(key: string, value: any, targetArg: object | object[]): boolean {
  const keys = key.split('.')
  const lastKey = keys[keys.length - 1]
  const targets = Array.isArray(targetArg) ? targetArg : [targetArg]
  for (const currentTarget of targets) {
    let current: any = currentTarget
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i]
      if (!(k in current)) {
        break
      }
      current = current[k]
    }
    if (lastKey in current) {
      const target = current[lastKey]
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          target[i] = value[i]
        }
      } else if (typeof value === 'object' && value !== null) {
        for (const [k, v] of Object.entries(value)) {
          target[k] = v
        }
      } else {
        current[lastKey] = value
      }
      return true
    }
  }
  return false
}

export class InspectorView {
  static inferFields = inferFields
  static tryApplyChange = tryApplyChange

  div = document.createElement('div')
  style = document.createElement('style')
  fields = new Map<string, Field>()
  ticker = Ticker.get('Inspector').set({ inactivityWaitDuration: Infinity })

  onCloseRequest?: (() => void)

  #state = {
    useSearch: false,
    search: '',
    properties: <MetaProperty[]>[],
    /**
     * Get the current values of all fields. Provided by the consumer of the inspector.
     */
    updatedValues: () => (<Record<string, any>>{}),
    onChangeListener: new Map<string, ((value: any) => void)[]>(),
    onAnyChangeListener: new Set<(key: string, value: any) => void>(),
    fieldTree: new FieldTree([]),
  }

  static defaultHeader = {
    title: 'Inspector',
    description: <string | undefined>undefined,
    closeButton: false,
  }

  constructor({
    header = <Partial<typeof InspectorView.defaultHeader> | false>false,
    search = false
  } = {}) {
    this.div.className = 'inspector'
    this.div.innerHTML = /* html */`
      <div class="inspector-header"></div>
      <div class="inspector-content"></div>
    `

    if (header) {
      this.#fillHeader(header)
    } else {
      const header = this.div.querySelector<HTMLDivElement>('.inspector-header')!
      header.style.display = 'none'
    }

    this.#initStyle()
    this.#initOverlay()

    this.ticker.onTick({ timeInterval: .1 }, () => {
      this.#updateInspectorPartially(this.#state.updatedValues())
    })

    this.#state.useSearch = search
  }

  setStyle(style: Partial<{ entryWidth: number | null; labelWidth: number | null }>): this {
    if (style.entryWidth !== undefined) {
      if (style.entryWidth === null) {
        this.div.style.removeProperty('--entry-width')
      } else {
        this.div.style.setProperty('--entry-width', `${style.entryWidth}px`)
      }
    }
    if (style.labelWidth !== undefined) {
      if (style.labelWidth === null) {
        this.div.style.removeProperty('--label-width')
      } else {
        this.div.style.setProperty('--label-width', `${style.labelWidth}px`)
      }
    }
    return this
  }

  /**
   * Attach the inspector to a parent HTML element.
   * 
   * Returns a destroyable object that can be used to destroy the inspector.
   */
  attachTo(parent: HTMLElement): DestroyableObject {
    parent.appendChild(this.div)
    return this
  }

  #fillHeader(header: Partial<typeof InspectorView.defaultHeader>) {
    const headerDiv = this.div.querySelector('.inspector-header')!

    headerDiv.innerHTML = /* html */`
      <div class="inspector-title">
        <div>
          ${header.title || '(no title)'}
        </div>
        ${!header.closeButton ? '' : /* html */`
          <div id="inspector-close" class="inspector-close">
            ${closeSvg}
          </div>
        `}
      </div>
      ${!header.description ? '' : /* html */`
        <div class="inspector-description">
          ${header.description}
        </div>
      `}
    `

    if (header.closeButton) {
      headerDiv.querySelector<HTMLDivElement>('#inspector-close')!.onclick = () => {
        this.onCloseRequest?.()
      }
    }
  }

  #destroyed = false
  get destroyed() { return this.#destroyed }
  destroy = () => {
    if (this.#destroyed)
      return

    this.#destroyed = true
    this.style.remove()
    this.div.remove()
    this.ticker.destroy()
  }

  onChange(key: string, callback: (value: any) => void): DestroyableObject {
    if (!this.#state.onChangeListener.has(key))
      this.#state.onChangeListener.set(key, [])

    this.#state.onChangeListener.get(key)!.push(callback)

    const destroy = () => {
      const listeners = this.#state.onChangeListener.get(key)
      if (listeners) {
        const index = listeners.indexOf(callback)
        if (index !== -1) {
          listeners.splice(index, 1)
          if (listeners.length === 0) {
            this.#state.onChangeListener.delete(key)
          }
        }
      }
    }

    return { destroy }
  }

  onAnyChange(callback: (key: string, value: any) => void): DestroyableObject {
    this.#state.onAnyChangeListener.add(callback)

    const destroy = () => {
      this.#state.onAnyChangeListener.delete(callback)
    }

    return { destroy }
  }

  /**
   * Usage:
   * ```ts
   * inspector.registerFields([
   *   {
   *     key: 'position',
   *     description: 'Position of the mesh in 3D space with (1, 2, 0) as default.',
   *     type: 'vector(x, y, z) slider(-5, 5) slider-fill(none) widget(translate-3d)',
   *     value: new Vector3(1, 2, 0),
   *   },
   *   {
   *     key: 'rotation',
   *     type: 'vector(x,y,z) slider(-PI, PI, 1 / 180 * PI) slider-fill(none) remap(to-degrees) precision(1) widget(rotate-3d)',
   *     value: new Euler(0, 0, 0, 'ZYX'),
   *   },
   * ], {
   *   updatedValues: () => {
   *     return {
   *       position: mesh.position,
   *       rotation: mesh.rotation,
   *     }
   *   },
   * })
   * ```
   * 
   * The `updatedValues` function is used to provide the current values of all fields. It is called on every tick, and the returned values are used to update the fields in the inspector. This allows the inspector to stay in sync with external changes to the values.
   */
  registerFields(
    entries: (RawMetaProperty | MetaProperty)[] | InspectorMetaObject,
    params: { updatedValues: () => Record<string, any> },
  ) {
    const parseEntries = (entries: InspectorMetaObject): MetaProperty[] => {
      return Object.entries(entries).map(([key, rawEntry], index) => {
        if (isRawMetaPropertyAsArray(rawEntry)) {
          const [value, meta] = rawEntry
          return new MetaProperty({ ...meta, key, value, order: index })
        }

        if (rawEntry instanceof MetaProperty)
          return rawEntry

        const entry = {
          ...rawEntry,
          key,
          type: (rawEntry as any).type ?? (typeof (rawEntry as any).value),
        }
        if (isRawMetaProperty(entry))
          return new MetaProperty({ ...entry, order: index })

        if (typeof entry === 'function') {
          return new MetaProperty({
            order: index,
            key,
            value: entry,
            type: 'button',
          })
        }

        return new MetaProperty({
          order: index,
          key,
          value: null,
          type: 'unknown',
          description: 'Unknown type',
        })
      })
    }

    this.#state.properties = Array.isArray(entries)
      ? entries.map(entry => new MetaProperty(entry))
      : parseEntries(entries)

    this.#state.updatedValues = params.updatedValues

    this.#state.fieldTree = new FieldTree(this.#state.properties)

    this.#render()
  }

  #clearRenderFields() {
    for (const field of this.fields.values())
      field.destroy()
    this.fields.clear()

    const wrapper = this.div.querySelector('.inspector-fields')!
    if (wrapper)
      wrapper.innerHTML = ''
  }

  #renderFields() {
    // Clear previous fields
    this.#clearRenderFields()

    // Iterate over fields and create Field instances:

    const wrapper = this.div.querySelector('.inspector-fields')!

    // Create a separator function to add visual separation between entries.
    const createdEntries = [] as (Field | Button)[]
    const separator = () => {
      if (createdEntries.length > 0) {
        const div = document.createElement('div')
        div.className = 'field-separator'
        wrapper.appendChild(div)
      }
    }
    const newEntry = (entry: InspectorDomEntry) => {
      wrapper.appendChild(entry.div)
      createdEntries.push(entry)
    }

    const values = this.#state.updatedValues()
    const { fieldTree, search } = this.#state
    for (const metaProperty of fieldTree.fields(search)) {
      separator()

      if (metaProperty.type === 'group') {
        const node = this.#state.fieldTree.getNodeByPath(metaProperty.value)!
        const group = new Group(metaProperty, node)
        group.div.onclick = () => {
          node.expanded = !node.expanded
          this.#renderFields()
        }
        newEntry(group)
        continue
      }

      if (metaProperty.type === 'button') {
        const button = new Button(metaProperty.key, metaProperty.value)
        newEntry(button)
        continue
      }

      if (metaProperty.type === 'spacer') {
        const spacer = new Spacer(metaProperty)
        newEntry(spacer)
        continue
      }

      const metaField = MetaField.infer(metaProperty.type, metaProperty.value)
      const FieldClass = allFields[metaField.type as keyof typeof allFields] as typeof Field

      if (!FieldClass) {
        const field = new allFields.unknown(metaProperty.key, metaProperty.value, metaProperty, metaField)
        newEntry(field)
        continue
      }

      const field = new FieldClass(metaProperty.key, metaProperty.value, metaProperty, metaField)
      field.setValue(
        metaProperty.key in values
          ? values[metaProperty.key]
          : metaProperty.cloneValue())
      field.onChange(value => {
        this.#state.onChangeListener.get(metaProperty.key)?.forEach(callback => callback(value))
        this.#state.onAnyChangeListener.forEach(callback => callback(metaProperty.key, value))
      })
      this.fields.set(metaProperty.key, field)
      newEntry(field)
    }

    // Add a final separator
    separator()

    for (const separator of wrapper.querySelectorAll('.field-separator')) {
      const isBetweenFields =
        !!separator.previousElementSibling?.classList.contains('field') &&
        !!separator.nextElementSibling?.classList.contains('field')
      separator.classList.toggle('between-fields', isBetweenFields)
    }

    if (createdEntries.length === 0) {
      wrapper.innerHTML = '<div class="inspector-entry inspector-empty" style="opacity: 0.5;">No fields to display</div>'
    }
  }

  #clearRender() {
    this.#clearRenderFields()

    const content = this.div.querySelector('.inspector-content')!
    content.innerHTML = ''
  }

  #render() {
    this.#clearRender()

    const content = this.div.querySelector('.inspector-content')!

    if (this.#state.useSearch) {
      const search = new SearchEntry()
      content.appendChild(search.div)
      search.inputElement.value = this.#state.search
      search.inputElement.oninput = () => {
        this.#state.search = search.inputElement.value
        this.#renderFields()
      }
      search.inputElement.onkeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          search.inputElement.value = ''
          this.#state.search = ''
          this.#renderFields()
        }
      }
    }

    const wrapper = document.createElement('div')
    wrapper.className = 'inspector-fields'
    this.div.querySelector('.inspector-content')!.appendChild(wrapper)

    this.#renderFields()
  }

  /**
   * Update the inspector with new values for existing fields, but:
   * - Do not remove existing fields.
   * - Do not create new fields.
   */
  #updateInspectorPartially(values: Record<string, any>) {
    // Update existing fields or create new ones
    for (const [key, value] of Object.entries(values)) {
      const field = this.fields.get(key)
      if (field && field.focused === false) {
        field.setValue(value, { silent: true })
      }
    }
  }

  #initStyle() {
    const fullCss = css
      + entriesCssChunks.join('\n')
      + fieldsCssChunks.join('\n')
      + componentsCssChunks.join('\n')

    this.style.innerHTML = prefixCssSelectors(fullCss, '.inspector')
    this.style.className = 'inspector-style'

    document.head.appendChild(this.style)
  }

  /**
   * Initialize the overlay.
   * 
   * The overlay is used for top level cursor styling (eg. when dragging).
   */
  #initOverlay() {
    const overlay = document.createElement('div')
    overlay.className = 'rotate-widget-overlay'
    overlay.style.position = 'fixed'
    overlay.style.inset = '0'
    overlay.style.zIndex = '1000'
    overlay.style.cursor = 'grabbing'

    this.div.addEventListener('overlay-start', event => {
      const { cursor } = (event as CustomEvent).detail
      overlay.style.cursor = cursor || 'grabbing'
      document.body.appendChild(overlay)
    })

    this.div.addEventListener('overlay-end', () => {
      overlay.remove()
    })
  }
}

/**
 * @deprecated Use `InspectorView` instead.
 */
export const Inspector = InspectorView
