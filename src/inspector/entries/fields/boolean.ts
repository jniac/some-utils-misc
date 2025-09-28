import { MetaProperty } from '../../meta-property'
import { CheckBoxWidget } from '../components/widget/checkbox'
import { Field } from './base'
import { MetaField } from './meta-field'

import css from './boolean.css'

export class BooleanField extends Field<boolean> {
  static css = css

  input: HTMLInputElement

  checkbox: CheckBoxWidget

  constructor(key: string, defaultValue: boolean, metaProperty: MetaProperty, metaField: MetaField) {
    super(key, defaultValue, metaProperty, metaField)

    this.inputDiv.innerHTML = `
      <input type="checkbox" />
    `

    this.input = this.inputDiv.querySelector('input')!

    this.input.onfocus = () => this.setFocused(true)
    this.input.onblur = () => this.setFocused(false)
    this.input.onchange = () => {
      this.setValue(this.input.checked)
      checkbox.setValue(this.input.checked, { silent: true })
    }

    const checkbox = new CheckBoxWidget(metaField)
    checkbox.setValue(defaultValue, { silent: true })
    checkbox.div.style.pointerEvents = 'none'
    this.inputDiv.appendChild(checkbox.div)

    this.checkbox = checkbox

    this.onDestroy(() => {
      this.checkbox.destroy()
      this.div.innerHTML = ''
    })
  }

  override setValue(value: boolean, options: { silent?: boolean } = {}): this {
    super.setValue(value, options)
    this.input.checked = value
    this.checkbox.setValue(value, { silent: true })
    return this
  }
}
