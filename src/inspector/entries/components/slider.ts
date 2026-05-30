import { interpolateWithMidPoint, inverseInterpolateWithMidPoint } from 'some-utils-ts/math/misc/mid-curve'
import { DestroyableInstance } from 'some-utils-ts/misc/destroy'
import { DestroyableObject } from 'some-utils-ts/types'

import { ListenerMap } from '../../utils/collections'
import { OnChangeListener, UserEvent } from '../fields'
import { FieldComponent } from './base'

import css from './slider.css'

export class Slider extends FieldComponent {
  static css = css

  #state = {
    min: 0,
    max: 0,
    alpha: 0,
    middle: NaN,
    dragMode: false,
    destroyable: new DestroyableInstance(),
    listeners: new ListenerMap<'drag' | 'drag-enter' | 'drag-exit', OnChangeListener<number>>(),
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
    this.#state.listeners.add('drag', listener)
    return {
      destroy: () => {
        this.#state.listeners.delete('drag', listener)
      }
    }
  }

  onDragEnter(listener: (value: number) => void): DestroyableObject {
    return this.#state.listeners.on('drag-enter', listener)
  }

  onDragExit(listener: (value: number) => void): DestroyableObject {
    return this.#state.listeners.on('drag-exit', listener)
  }

  #value(): number {
    const { min, max, middle, alpha } = this.#state
    return Number.isNaN(middle)
      ? alpha * (max - min) + min
      : interpolateWithMidPoint(min, max, middle, alpha)
  }

  #enterDragMode() {
    if (this.#state.dragMode)
      return

    this.#state.dragMode = true
    this.div.classList.add('drag-mode')

    this.#state.listeners.call('drag-enter', this.#value(), { userEvent: UserEvent.Drag })
  }

  #exitDragMode() {
    if (!this.#state.dragMode)
      return

    this.#state.dragMode = false
    this.div.classList.remove('drag-mode')

    this.#state.listeners.call('drag-exit', this.#value(), { userEvent: UserEvent.Drag })
  }

  #initDrag() {
    const update = (clientX: number) => {
      const rect = this.div.getBoundingClientRect()

      this.#state.alpha = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))

      this.#state.listeners.call('drag', this.#value(), { userEvent: UserEvent.Drag })
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift')
        this.#enterDragMode()
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift')
        this.#exitDragMode()
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
        this.#exitDragMode()
      }

      document.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerup', onPointerUp)
      this.#enterDragMode()

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
