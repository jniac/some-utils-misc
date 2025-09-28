import { FieldComponent } from './base'

import css from './border.css.ts'

export class Border extends FieldComponent {
  static css = css

  constructor({ opacity = 1 } = {}) {
    super()

    this.div.className = 'input-border'
    this.div.style.opacity = `${opacity}`
  }
}
