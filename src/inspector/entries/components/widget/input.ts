
import { DestroyableObject } from 'some-utils-ts/types'

import { FieldComponent } from '../base'

import css from './input.css.ts'

type Pointer = { x: number; y: number; shiftKey: boolean; altKey: boolean; ctrlKey: boolean; metaKey: boolean }
type EnumLike = { [key: string]: string | number }
type DragCallback<Value> = (pointer: Pointer, delta: { x: number; y: number }) => Value

export class InputWidget<Value, ModeEnum extends EnumLike> extends FieldComponent {
  static css = css

  #state = {
    onDragStart: null as null | DragCallback<Value>,
    onDrag: null as null | DragCallback<Value>,
    modeEnum: null as ModeEnum | null,
    mode: null as ModeEnum[keyof ModeEnum] | null,
    onModeChange: null as ((mode: ModeEnum[keyof ModeEnum]) => void) | null,
    listeners: new Set<(value: Value) => void>(),
  }

  get mode(): ModeEnum[keyof ModeEnum] {
    return this.#state.mode!
  }

  constructor() {
    super()
    this.div.classList.add('input-widget')
    this.div.innerHTML = `<div class="background"></div>`
  }

  protected init(props: {
    modeEnum?: ModeEnum | null
    onDragStart?: DragCallback<Value>
    onDrag?: DragCallback<Value>
    onModeChange?: (mode: ModeEnum[keyof ModeEnum]) => void
  }) {
    const {
      modeEnum = null,
      onDragStart,
      onDrag,
      onModeChange,
    } = props

    this.#state.modeEnum = modeEnum
    this.#state.onModeChange = onModeChange ?? null
    this.#state.onDragStart = onDragStart ?? null
    this.#state.onDrag = onDrag ?? null

    if (this.#state.onDragStart && this.#state.onDrag) {
      this.#initDrag()
    }

    if (modeEnum) {
      this.#initMode()
    }
  }

  onChange(listener: (value: Value) => void): DestroyableObject {
    this.#state.listeners.add(listener)
    return {
      destroy: () => {
        this.#state.listeners.delete(listener)
      },
    }
  }

  #initDrag() {
    this.div.oncontextmenu = (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
    }
    this.div.onpointerdown = (event: PointerEvent) => {
      event.preventDefault()
      event.stopPropagation()

      const { shiftKey, ctrlKey, metaKey, altKey } = event
      const pointer = {
        x: event.clientX,
        y: event.clientY,
        shiftKey,
        altKey,
        ctrlKey,
        metaKey,
      }

      const value = this.#state.onDragStart!(pointer, { x: 0, y: 0 })
      for (const listener of this.#state.listeners)
        listener(value)

      const onPointerMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - pointer.x
        const dy = moveEvent.clientY - pointer.y
        pointer.x = moveEvent.clientX
        pointer.y = moveEvent.clientY
        pointer.shiftKey = moveEvent.shiftKey
        pointer.altKey = moveEvent.altKey
        pointer.ctrlKey = moveEvent.ctrlKey
        pointer.metaKey = moveEvent.metaKey

        const value = this.#state.onDrag!(pointer, { x: dx, y: dy })

        for (const listener of this.#state.listeners)
          listener(value)
      }

      const onPointerUp = () => {
        this.div.dispatchEvent(new CustomEvent('overlay-end', { bubbles: true }))
        document.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerup', onPointerUp)
      }

      this.div.dispatchEvent(new CustomEvent('overlay-start', { bubbles: true, detail: { cursor: 'grabbing' } }))
      document.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerup', onPointerUp)
    }
  }

  #initMode() {
    const onPointerDown = (event: PointerEvent): void => {
      const now = window.performance.now()

      const onPointerUp = (upEvent: PointerEvent) => {
        const duration = window.performance.now() - now
        if (duration < 200) {
          this.setNextMode()
        }
      }

      document.addEventListener('pointerup', onPointerUp, { once: true })
    }

    this.div.addEventListener('pointerdown', onPointerDown)

    this.onDestroy(() => {
      this.div.removeEventListener('pointerdown', onPointerDown)
    })

    this.setFirstMode()
  }

  setMode(mode: ModeEnum[keyof ModeEnum]) {
    if (this.#state.mode === mode)
      return

    this.#state.mode = mode
    this.#state.onModeChange?.(mode)
  }

  setFirstMode() {
    if (!this.#state.modeEnum)
      return

    const modes = Object.values(this.#state.modeEnum) as (ModeEnum[keyof ModeEnum])[]
    this.setMode(modes[0])
  }

  setNextMode() {
    if (!this.#state.modeEnum)
      return

    const modes = Object.values(this.#state.modeEnum) as (ModeEnum[keyof ModeEnum])[]
    const currentIndex = modes.indexOf(this.#state.mode!)
    const nextIndex = (currentIndex + 1) % modes.length
    this.setMode(modes[nextIndex])
  }
}
