import { MetaProperty } from '../../meta-property'
import { Border } from '../components'
import { Field } from './base'
import { MetaField } from './meta-field'

export class TextField extends Field<string> {
  static css = ''

  input: HTMLInputElement

  constructor(key: string, defaultValue: string, metaProperty: MetaProperty, metaField: MetaField) {
    super(key, defaultValue, metaProperty, metaField)

    this.inputDiv.innerHTML = `
      <input type="text" class="text-input" />
    `
    this.inputDiv.appendChild(new Border().div)

    this.input = this.inputDiv.querySelector('input')!

    this.input.onfocus = () => this.setFocused(true)
    this.input.onblur = () => this.setFocused(false)
    this.input.oninput = () => this.setValue(this.input.value)
  }

  override setValue(value: string, options: { silent?: boolean } = {}): this {
    super.setValue(value, options)
    this.input.value = value
    return this
  }
}
