
import { DestroyableObject } from 'some-utils-ts/types'

import { ListenerMap } from '../../utils/collections'
import { formatNumber } from '../../utils/format-number'
import { safeEvaluate } from '../../utils/safe-evaluate'
import { MetaField, OnChangeListener, UserEvent } from '../fields'
import { FieldComponent } from './base'
import { Border } from './border'
import { Slider } from './slider'

import css from './number-input.css'

function remap(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return (value - inMin) / (inMax - inMin) * (outMax - outMin) + outMin
}

function remapInverse(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return (value - outMin) / (outMax - outMin) * (inMax - inMin) + inMin
}

function numbersAreEqual(a: number, b: number, epsilon = 1e-6): boolean {
  return ((Number.isNaN(a) && Number.isNaN(b))
    || Math.abs(a - b) < epsilon)
}

const defaultNumberInputProps = {
  /**
   * Minimum value for the field.
   */
  min: -Infinity,
  /**
   * Maximum value for the field.
   */
  max: Infinity,
  /**
   * "Step" value when "shifting" the value with the mouse or keyboard.
   */
  step: 0,
  /**
   * Round the value to the nearest multiple of this number. If set to 0, no rounding is applied.
   */
  round: 0,
  /**
   * Scale for the modifier keys (Shift and Alt).
   */
  modifierScale: 10,
  /**
   * "Middle" value for the slider, used to define logarithmic scaling.
   */
  middle: NaN,
  /**
   * Extra scale for dragging the value with the mouse.
   */
  dragScale: 1,
  /**
   * Precision for formatting the number (the real number is always stored with full precision).
   */
  precision: 3,
}

export class NumberInput extends FieldComponent {
  static css = css

  meta: MetaField
  input: HTMLInputElement
  inputKey: string

  min: number
  max: number
  middle: number | undefined
  step: number
  round: number
  modifierScale: number
  dragScale: number
  precision: number
  remap: [inMin: number, inMax: number, outMin: number, outMax: number] | null = null

  slider: Slider | null = null
  border: Border | null = null

  #state = {
    value: NaN,
    focused: false,
    listeners: new ListenerMap<'change' | 'enter-focus' | 'exit-focus', OnChangeListener<number>>(),
  }

  get value() { return this.#state.value }

  constructor(meta: MetaField, inputKey: string) {
    super()

    this.meta = meta
    this.inputKey = inputKey

    const { rawProps } = meta

    this.min = safeEvaluate(
      rawProps.min?.[0]
      ?? rawProps.range?.[0]
      ?? rawProps.slider?.[0]
      ?? defaultNumberInputProps.min)

    this.max = safeEvaluate(
      rawProps.max?.[0]
      ?? rawProps.range?.[1]
      ?? rawProps.slider?.[1]
      ?? defaultNumberInputProps.max)

    this.middle = safeEvaluate(
      rawProps.middle?.[0]
      ?? defaultNumberInputProps.middle)

    this.step = safeEvaluate(
      rawProps.step?.[0]
      ?? rawProps.slider?.[2]
      ?? defaultNumberInputProps.step)

    this.round = safeEvaluate(
      rawProps.round?.[0]
      ?? defaultNumberInputProps.round)

    this.modifierScale = safeEvaluate(
      rawProps.modifierScale?.[0]
      ?? rawProps.slider?.[3]
      ?? defaultNumberInputProps.modifierScale)

    this.dragScale = safeEvaluate(
      rawProps.dragScale?.[0]
      ?? defaultNumberInputProps.dragScale)

    this.precision = safeEvaluate(
      rawProps.precision?.[0]
      ?? defaultNumberInputProps.precision)

    this.remap = rawProps.remap?.[0] === 'to-degrees'
      ? [0, Math.PI, 0, 180]
      : null

    this.div.classList.add('number-input')

    this.div.innerHTML = /* html */`
      <input
        id="${inputKey}"
        class="field-input"
        type="text"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
      />
    `

    this.input = this.div.querySelector('input')!

    this.input.onfocus = event => {
      event.preventDefault()
      event.stopPropagation()
      this.setFocused(true)
    }

    this.input.onblur = event => {
      event.preventDefault()
      this.setFocused(false)
    }

    this.input.onchange = () => {
      const userValue = safeEvaluate(this.input.value)
      const value = this.remap
        ? remapInverse(userValue, ...this.remap)
        : userValue
      this.setValue(value, { userEvent: UserEvent.TextInput })
    }

    // Quite tricky:
    // - If the input should have a slider, we create it here.
    if (this.meta.rawProps.slider && Number.isFinite(this.min) && Number.isFinite(this.max)) {
      this.slider = new Slider()
      if (meta.has('slider-fill')) {
        const fill = meta.argsOf('slider-fill')[0] || 'none'
        this.slider.setFill(fill)
      }
      this.slider.onDrag(value => {
        this.setValue(value, { userEvent: UserEvent.Drag })
      })
      this.slider.onDragEnter(() => this.setFocused(true))
      this.slider.onDragExit(() => this.setFocused(false))
      this.div.appendChild(this.slider.div)
    }

    // - If the input should not have a slider, we add a frame instead.
    else {
      this.border = new Border()
      this.div.appendChild(this.border.div)
    }
  }

  onChange(callback: OnChangeListener<number>): DestroyableObject {
    return this.#state.listeners.on('change', callback)
  }

  onFocusEnter(callback: OnChangeListener<number>): DestroyableObject {
    return this.#state.listeners.on('enter-focus', callback)
  }

  onFocusExit(callback: OnChangeListener<number>): DestroyableObject {
    return this.#state.listeners.on('exit-focus', callback)
  }

  shiftValue(scalarBase: number, shift: boolean, alt: boolean): void {
    let { value, step } = this

    if (step === 0)
      step = 1

    step *= scalarBase
    step *= shift ? this.modifierScale
      : alt ? 1 / this.modifierScale
        : 1

    value += step

    this.setValue(value)
  }

  dragShiftValue(scalarBase: number, shift: boolean, alt: boolean): void {
    this.shiftValue(scalarBase * this.dragScale, shift, alt)
  }

  #onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.setValue(this.value)
      this.input.blur()
      this.setFocused(false)
    }

    else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      this.shiftValue(
        event.key === 'ArrowUp' ? 1 : -1,
        event.shiftKey,
        event.altKey,
      )
    }
  }

  setFocused(focused: boolean): this {
    if (this.#state.focused === focused)
      return this

    this.#state.focused = focused

    if (focused) {
      this.input.addEventListener('keydown', this.#onKeyDown)
      this.#state.listeners.call('enter-focus', this.value, {})
    } else {
      this.input.removeEventListener('keydown', this.#onKeyDown)
      this.#state.listeners.call('exit-focus', this.value, {})
    }
    return this
  }

  setValue(value: number, options: { silent?: boolean, userEvent?: UserEvent } = {}): this {
    const { rawProps } = this.meta

    if (rawProps.clamped)
      value = Math.max(this.min, Math.min(this.max, value))

    if (rawProps.integer)
      value = Math.round(value)

    if (this.round > 0)
      value = Math.round(value / this.round) * this.round

    // Memo: 
    // It is because of this check that we avoid infinite loops when setting the 
    // value in nested fields.
    if (numbersAreEqual(value, this.#state.value))
      return this

    this.#state.value = value

    this.slider
      ?.setValue(value, this.min, this.max, this.middle)

    const displayValue = this.remap
      ? remap(value, ...this.remap)
      : value

    this.input.value = formatNumber(displayValue, {
      precision: this.precision,
    })

    if (!options.silent)
      this.#state.listeners.call('change', value, { userEvent: options.userEvent })

    return this
  }
}
