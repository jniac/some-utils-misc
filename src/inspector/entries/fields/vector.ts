import { Euler, Quaternion } from 'three'

import { deepClone } from 'some-utils-ts/object/deep'

import { MetaProperty } from '../../meta-property'
import { NumberInput, Rotate3dWidget } from '../components'
import { Translate3dWidget } from '../components/widget/translate-3d'
import { Field } from './base'
import { MetaField } from './meta-field'

import css from './vector.css.raw'

export class VectorField extends Field<any> {
  static css = css

  vectorKeys: string[]
  numberInputs: Record<string, NumberInput>

  constructor(key: string, defaultValue: any, metaProperty: MetaProperty, metaField: MetaField) {
    super(key, defaultValue, metaProperty, metaField, { useLabel: false })

    if (/^xy/.test(metaField.typeArgs[0])) {
      this.vectorKeys = [...metaField.typeArgs[0]]
    }

    else {
      this.vectorKeys = metaField.typeArgs
    }

    this.numberInputs = {}

    /**
     * Create a clone of the inner value to avoid mutating the original object.
     */
    const clonedValue = deepClone(defaultValue)

    for (const vectorKey of this.vectorKeys) {
      const numberInput = new NumberInput(metaField, `${key}-${vectorKey}`)
      this.numberInputs[vectorKey] = numberInput
      this.inputDiv.appendChild(numberInput.div)
      numberInput.onChange(value => {
        clonedValue[vectorKey] = value
        this.setValue(clonedValue)
      })
    }

    const widgetType = metaField.rawProps.widget?.[0]
    switch (widgetType) {
      case 'rotate-3d': {
        const rotateWidget = new Rotate3dWidget(metaField)
        this.inputDiv.appendChild(rotateWidget.div)
        const q1 = new Quaternion()
        const q2 = new Quaternion()
        const euler = new Euler(0, 0, 0, defaultValue.order)
        rotateWidget.onChange(deltaRotation => {
          q1.setFromEuler(deltaRotation)
          q2.setFromEuler(this.state.value!)
          this.setValue(euler.setFromQuaternion(q1.multiply(q2), defaultValue.order))
        })
        break
      }

      case 'translate-3d': {
        const translateWidget = new Translate3dWidget(metaField)
        this.inputDiv.appendChild(translateWidget.div)
        translateWidget.onChange(deltaTranslation => {
          clonedValue.x += deltaTranslation.x
          clonedValue.y += deltaTranslation.y
          clonedValue.z += deltaTranslation.z
          this.setValue(clonedValue)
        })
        break
      }
    }
  }

  override setValue(value: any, options: { silent?: boolean } = {}): this {
    super.setValue(value, options)
    for (const vectorKey of this.vectorKeys) {
      this.numberInputs[vectorKey].setValue(value[vectorKey], options)
    }
    return this
  }
}
