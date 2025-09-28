
import { DestroyableObject } from 'some-utils-ts/types'
import { createSvg } from '../../../svg'
import { MetaField } from '../../fields'
import { FieldComponent } from '../base'

import css from './checkbox.css.ts'

export class CheckBoxWidget extends FieldComponent {
  static css = css

  #parts = {
    square: createSvg('square', { width: null, height: null }),
    squareCheck: createSvg('squareCheck', { width: null, height: null }),
  }

  #state = {
    value: false,
    listeners: new Set<(value: boolean) => void>(),
  }

  constructor(meta: MetaField) {
    super()

    this.div.classList.add('checkbox-widget')
    this.div.appendChild(this.#parts.square)

    this.div.onclick = () => {
      this.setValue(!this.#state.value)
    }

    this.onDestroy(() => {
      this.#parts.square.remove()
      this.#parts.squareCheck.remove()
      this.div.innerHTML = ''
    })

    this.#update()
  }

  #update() {
    this.div.firstElementChild?.remove()
    this.div.appendChild(this.#state.value ? this.#parts.squareCheck : this.#parts.square)
  }

  setValue(value: boolean, options: { silent?: boolean } = {}): this {
    this.#state.value = value
    this.#update()
    if (!options.silent) {
      for (const listener of this.#state.listeners)
        listener(value)
    }
    return this
  }

  onChange(listener: (value: boolean) => void): DestroyableObject {
    this.#state.listeners.add(listener)
    return {
      destroy: () => {
        this.#state.listeners.delete(listener)
      },
    }
  }
}
