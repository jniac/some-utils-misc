import { MetaProperty } from '../../meta-property'
import { Field } from './base'
import { MetaField } from './meta-field'

import css from './color.css.raw'

export class ColorField extends Field<string> {
  static css = css

  input: HTMLInputElement

  constructor(key: string, defaultValue: string, metaProperty: MetaProperty, metaField: MetaField) {
    super(key, defaultValue, metaProperty, metaField)

    this.inputDiv.innerHTML = `
      <input type="color" class="color-input" />
      <div class="color-preview"></div>
    `

    this.input = this.inputDiv.querySelector('input')!

    this.input.onfocus = () => this.setFocused(true)
    this.input.onblur = () => this.setFocused(false)
    this.input.oninput = () => this.setValue(this.input.value)
  }

  override setValue(value: string, options: { silent?: boolean } = {}): this {
    super.setValue(value, options)
    this.input.value = value
    this.div.style.setProperty('--color-preview', value)
    return this
  }
}
