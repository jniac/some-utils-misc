import { Border } from './border'
import { NumberInput } from './number-input'
import { Slider } from './slider'
import { CheckBoxWidget } from './widget/checkbox'
import { InputWidget } from './widget/input'
import { Rotate3dWidget } from './widget/rotate-3d'

export {
  Border,
  CheckBoxWidget,
  NumberInput,
  Rotate3dWidget,
  Slider
}

export const componentsCssChunks = [
  Border.css,
  CheckBoxWidget.css,
  NumberInput.css,
  InputWidget.css,
  Slider.css,
]
