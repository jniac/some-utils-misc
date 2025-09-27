import { Euler } from 'three'

import { createSvg } from '../../../svg'
import { MetaField } from '../../fields'
import { InputWidget } from './input'

enum Mode {
  Rotate3d = 'rotate3d',
  RotateZ = 'rotateZ',
}

export class Rotate3dWidget extends InputWidget<Euler, typeof Mode> {
  #parts = {
    rotate3d: createSvg('rotate3d', { width: null, height: null }),
    rotateZ: createSvg('rotateZ', { width: null, height: null }),
  }

  #state = {
    rotation: new Euler(0, 0, 0),
    listeners: new Set<(rotation: Euler) => void>(),
  }

  constructor(meta: MetaField) {
    super()

    this.div.classList.add('rotate-3d-widget')
    this.div.appendChild(this.#parts.rotate3d)
    this.div.appendChild(this.#parts.rotateZ)

    this.init({
      modeEnum: Mode,
      onModeChange: (mode) => {
        this.#parts.rotate3d.classList.toggle('active', mode === Mode.Rotate3d)
        this.#parts.rotateZ.classList.toggle('active', mode === Mode.RotateZ)
      },
      onDragStart: () => {
        return this.#state.rotation.set(0, 0, 0, 'XYZ')
      },
      onDrag: (pointer, delta) => {
        const { rotation } = this.#state

        const modifierScale = meta.numericArgOf('modifierScale', { defaultValue: 10 })
        const scale = .005 * (pointer.shiftKey
          ? modifierScale
          : pointer.altKey
            ? 1 / modifierScale
            : 1)

        if (this.mode === Mode.RotateZ) {
          // Rotate around the Z axis based on the pointer movement
          rotation.z = scale * delta.x
        } else {
          // Rotate around the X and Y axes based on the pointer movement
          rotation.x = scale * delta.y
          rotation.y = scale * delta.x
        }

        for (const listener of this.#state.listeners)
          listener(rotation)

        return rotation
      },
    })

    this.onDestroy(() => {
      this.#parts.rotate3d.remove()
      this.#parts.rotateZ.remove()
    })
  }
}
