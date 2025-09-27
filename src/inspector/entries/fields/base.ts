
import { capitalCase } from 'change-case'

import { isObject } from 'some-utils-ts/object/common'
import { deepClone, deepCopy } from 'some-utils-ts/object/deep'
import { deepEqual } from 'some-utils-ts/object/deep/diff'
import { ObservableCore } from 'some-utils-ts/observables'
import { DestroyableObject } from 'some-utils-ts/types'

import { dedent } from 'some-utils-ts/string/dedent'
import { MetaProperty } from '../../meta-property'
import { createSvg } from '../../svg'
import { InspectorDomEntry } from '../base'
import { MetaField } from './meta-field'

export class Field<T = any> extends InspectorDomEntry implements ObservableCore<T> {
  readonly key: string
  readonly metaProperty: MetaProperty
  readonly metaField: MetaField

  get domId() { return `inspector-field-${this.id}` }
  get domKey() { return `inspector-field-${this.key}` }

  inputDiv: HTMLDivElement
  labelDiv: HTMLDivElement
  labelElement: HTMLElement

  state = {
    defaultValue: <T>undefined,
    value: <T | undefined>undefined,
    valueOld: <T | undefined>undefined,
    focused: false,
    listeners: new Set<(value: T) => void>(),
  }

  get value(): T {
    return this.state.value!
  }

  get focused(): boolean {
    return this.state.focused
  }

  constructor(
    key: string,
    defaultValue: T,
    metaProperty: MetaProperty,
    metaField: MetaField,
    { useLabel = true } = {},
  ) {
    super()

    this.key = key
    this.metaProperty = metaProperty
    this.metaField = metaField
    this.div.classList.add('field', `field-${metaField.type}`)
    this.div.dataset.key = key

    this.state.defaultValue = deepClone(defaultValue)

    const labelHtml = useLabel
      ? `<label class="label" for="${this.domKey}">${capitalCase(key)}</label>`
      : `<legend class="label">${capitalCase(key)}</legend>`
    this.div.innerHTML = /*html*/ `
      <div class="label-wrapper">
        ${labelHtml}
      </div>
      <div class="input-wrapper"></div>
    `
    this.inputDiv = this.div.querySelector('.input-wrapper') as HTMLDivElement
    this.labelDiv = this.div.querySelector('.label-wrapper') as HTMLDivElement
    this.labelElement = this.div.querySelector('label, legend') as HTMLElement

    {
      // WIP
      const infoSvg = createSvg('info', { width: null, height: null })
      const revertSvg = createSvg('undo2', { width: null, height: null })
      infoSvg.onclick = () => {
        alert(`${capitalCase(key)}:\n\n${dedent(metaProperty.description || '(No description provided)')}`)
      }
      revertSvg.onclick = () => {
        this.setValue(this.state.defaultValue)
      }
      this.div.onpointerenter = () => {
        this.labelDiv.appendChild(infoSvg)
        this.labelDiv.appendChild(revertSvg)
      }
      this.div.onpointerleave = () => {
        infoSvg.remove()
        revertSvg.remove()
      }
    }

    this.onDestroy(() => {
      if (this.state) {
        this.div.remove()
        this.div.innerHTML = ''
      }
    })
  }

  setFocused(focused: boolean): this {
    this.state.focused = focused
    this.div.classList.toggle('focused', focused)
    return this
  }

  /**
   * Sets the value of the field. 
   * 
   * Note:
   * - If the value is undefined, it initializes the state with a deep clone of the value.
   * @param value The new value to set.
   * @returns The field instance.
   */
  setValue(value: T, options: { silent?: boolean } = {}): this {
    if (deepEqual(value, this.state.value))
      return this

    if (this.state.value === undefined) {
      this.state.value = deepClone(value)
      this.state.valueOld = deepClone(value)
    }

    if (isObject(this.state.value)) {
      deepCopy(this.state.value as any, this.state.valueOld!)
      deepCopy(value as any, this.state.value as any)
    } else {
      this.state.valueOld = this.state.value
      this.state.value = value
    }

    if (!options.silent)
      for (const listener of this.state.listeners)
        listener(this.state.value!)

    return this
  }

  onChange(callback: (value: T) => void): DestroyableObject {
    this.state.listeners.add(callback)
    return {
      destroy: () => {
        this.state.listeners.delete(callback)
      },
    }
  }
}
