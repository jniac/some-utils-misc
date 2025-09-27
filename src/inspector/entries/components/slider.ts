import { interpolateWithMidPoint, inverseInterpolateWithMidPoint } from 'some-utils-ts/math/misc/mid-curve'
import { DestroyableInstance } from 'some-utils-ts/misc/destroy'
import { DestroyableObject } from 'some-utils-ts/types'

import { FieldComponent } from './base'

import css from './slider.css.raw'

export class Slider extends FieldComponent {
  static css = css

  #state = {
    min: 0,
    max: 0,
    middle: NaN,
    dragMode: false,
    destroyable: new DestroyableInstance(),
    listeners: new Set<(alpha: number) => void>(),
  }

  constructor() {
    super()
    this.div.className = 'slider'
    this.div.innerHTML = /* html */`
      <div class="fill"></div>
      <div class="head"></div>
    `
    this.#initDrag()
  }

  destroy = () => {
    if (this.#state.destroyable.alive) {
      this.#state.destroyable.destroy()
      this.#state.listeners.clear()
      this.div.remove()
      this.div.innerHTML = ''
    }
  }

  setFill(fill: string): this {
    this.div.classList.add(`slider-fill-${fill}`)
    return this
  }

  setValue(value: number, min: number, max: number, middle: number | undefined): this {
    this.#state.min = min
    this.#state.max = max
    this.#state.middle = middle ?? NaN
    const alpha = Number.isNaN(middle)
      ? (value - min) / (max - min)
      : inverseInterpolateWithMidPoint(min, max, middle as number, value)
    this.div.style.setProperty('--slider-alpha', String(alpha))
    return this
  }

  onDrag(listener: (value: number) => void): DestroyableObject {
    this.#state.listeners.add(listener)
    return {
      destroy: () => {
        this.#state.listeners.delete(listener)
      }
    }
  }

  enterDragMode() {
    if (this.#state.dragMode)
      return

    this.#state.dragMode = true
    this.div.classList.add('drag-mode')
  }

  exitDragMode() {
    if (!this.#state.dragMode)
      return

    this.#state.dragMode = false
    this.div.classList.remove('drag-mode')
  }

  #initDrag() {
    const update = (clientX: number) => {
      const rect = this.div.getBoundingClientRect()

      const alpha = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))

      const { min, max, middle } = this.#state

      const value = Number.isNaN(middle)
        ? alpha * (max - min) + min
        : interpolateWithMidPoint(min, max, middle, alpha)

      for (const listener of this.#state.listeners)
        listener(value)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift')
        this.enterDragMode()
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift')
        this.exitDragMode()
    }

    const onPointerDown = (downEvent: PointerEvent) => {
      if (downEvent.button !== 0)
        return

      downEvent.preventDefault()
      downEvent.stopPropagation()

      const onPointerMove = (moveEvent: PointerEvent) => {
        moveEvent.preventDefault()
        moveEvent.stopPropagation()
        update(moveEvent.clientX)
      }

      const onPointerUp = () => {
        document.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerup', onPointerUp)
      }

      document.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerup', onPointerUp)

      update(downEvent.clientX)
    }


    this.div.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)

    this.#state.destroyable.onDestroy(() => {
      this.div.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
    })
  }
}
