import { MetaProperty } from '../../meta-property'
import { Field } from './base'
import { MetaField } from './meta-field'

export class UnknownField extends Field<null> {
  static css = ''
  constructor(key: string, defaultValue: null, metaProperty: MetaProperty, metaField: MetaField) {
    super(key, defaultValue, metaProperty, metaField)

    this.inputDiv.innerHTML = /* html */`
      <div class="unknown-field">
        <span style="opacity: 0.5; font-style: italic;">Unknown field type: ${metaField.type}</span>
      </div>
    `
  }
}
