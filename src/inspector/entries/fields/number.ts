import { MetaProperty } from '../../meta-property'
import { NumberInput } from '../components'
import { Field } from './base'
import { MetaField } from './meta-field'

export class NumberField extends Field<number> {
  static css = ''

  numberInput: NumberInput

  constructor(key: string, defaultValue: number, metaProperty: MetaProperty, metaField: MetaField) {
    super(key, defaultValue, metaProperty, metaField)

    this.numberInput = new NumberInput(metaField, key)
    this.inputDiv.appendChild(this.numberInput.div)
    this.numberInput.onChange(value => {
      this.setValue(value)
    })

    this.#initDrag()
  }

  #initDrag() {
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0)
        return

      event.preventDefault()
      event.stopPropagation()

      this.setFocused(true)

      const pointer = {
        x: event.clientX,
        y: event.clientY,
      }

      const onPointerMove = (moveEvent: PointerEvent) => {
        moveEvent.preventDefault()
        moveEvent.stopPropagation()

        const deltaX = moveEvent.clientX - pointer.x

        pointer.x = moveEvent.clientX
        pointer.y = moveEvent.clientY

        const sign = Math.sign(deltaX)
        const magn = Math.abs(deltaX / 50)

        this.numberInput.dragShiftValue(sign * magn, moveEvent.shiftKey, moveEvent.altKey)
      }

      const onPointerUp = () => {
        document.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerup', onPointerUp)

        this.setFocused(false)
      }

      document.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerup', onPointerUp)
    }

    this.labelElement.classList.add('field-label-drag')
    this.labelElement.addEventListener('pointerdown', onPointerDown)
  }

  override setValue(value: number, options: { silent?: boolean } = {}): this {
    super.setValue(value, options)
    this.numberInput.setValue(value, options)
    return this
  }
}
