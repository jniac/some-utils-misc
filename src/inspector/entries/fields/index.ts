import { BooleanField } from './boolean'
import { ColorField } from './color'
import { NumberField } from './number'
import { TextField } from './text'
import { UnknownField } from './unknown'
import { VectorField } from './vector'

export * from './base'
export * from './meta-field'

export const allFields = {
  'boolean': BooleanField,
  'color': ColorField,
  'number': NumberField,
  'text': TextField,
  'unknown': UnknownField,
  'vector': VectorField,
}

export const fieldsCssChunks = [
  BooleanField.css,
  ColorField.css,
  NumberField.css,
  TextField.css,
  UnknownField.css,
  VectorField.css,
]
