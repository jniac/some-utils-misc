import { Vector3 } from 'three'

import { createSvg } from '../../../svg'
import { MetaField } from '../../fields'
import { InputWidget } from './input'

enum Mode {
  Pan = 'pan',
  Dolly = 'dolly',
}

export class Translate3dWidget extends InputWidget<Vector3, typeof Mode> {
  #parts = {
    moveXY: createSvg('moveXY', { width: null, height: null }),
    moveZ: createSvg('moveVertical', { width: null, height: null }),
  }

  #state = {
    move: new Vector3(0, 0, 0),
    listeners: new Set<(move: Vector3) => void>(),
  }

  constructor(meta: MetaField) {
    super()

    this.div.classList.add('translate-3d-widget')
    this.div.appendChild(this.#parts.moveXY)
    this.div.appendChild(this.#parts.moveZ)

    this.init({
      modeEnum: Mode,
      onModeChange: (mode) => {
        this.#parts.moveXY.classList.toggle('active', mode === Mode.Pan)
        this.#parts.moveZ.classList.toggle('active', mode === Mode.Dolly)
      },
      onDragStart: () => {
        return this.#state.move.set(0, 0, 0)
      },
      onDrag: (pointer, delta) => {
        const { move } = this.#state

        const modifierScale = meta.numericArgOf('modifierScale', { defaultValue: 10 })
        const scale = .005 * (pointer.shiftKey
          ? modifierScale
          : pointer.altKey
            ? 1 / modifierScale
            : 1)

        if (this.mode === Mode.Dolly) {
          // Rotate around the Z axis based on the pointer movement
          move.z = scale * -delta.y
        } else {
          // Rotate around the X and Y axes based on the pointer movement
          move.x = scale * delta.x
          move.y = scale * -delta.y // Invert Y axis for typical 3D controls
        }

        for (const listener of this.#state.listeners)
          listener(move)

        return move
      },
    })

    this.onDestroy(() => {
      this.#parts.moveXY.remove()
      this.#parts.moveZ.remove()
    })
  }
}
