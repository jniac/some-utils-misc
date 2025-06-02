import { Ticker } from 'some-utils-ts/ticker'
import { Destroyable } from 'some-utils-ts/types'

export class TickerIndicator {
  static #activeInstances = [] as TickerIndicator[];

  #destroyables = [] as Destroyable[];

  parts = (() => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '-32 -32 64 64')
    svg.setAttribute('width', '18')
    svg.setAttribute('height', '18')
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
    svg.setAttribute('class', 'ticker-indicator')
    svg.setAttribute('aria-hidden', 'true')
    svg.setAttribute('role', 'img')
    svg.setAttribute('focusable', 'false')
    svg.innerHTML = `
      <rect x="-24" y="-6" width="48" height="12" fill="currentColor" />
    `

    svg.style.position = 'fixed'
    svg.style.bottom = '0'
    svg.style.right = '0'
    svg.style.zIndex = '9999'
    svg.style.pointerEvents = 'none'

    const rect = svg.querySelector('rect')!

    return {
      svg,
      rect,
    }
  })();

  initialize({ destroyPreviousInstances = true } = {}): this {
    if (destroyPreviousInstances) {
      for (const instance of TickerIndicator.#activeInstances)
        instance.destroy()
      TickerIndicator.#activeInstances.length = 0
    }

    TickerIndicator.#activeInstances.push(this)

    const { svg, rect } = this.parts
    document.body.appendChild(svg)

    this.#destroyables.push(Ticker.get('three').onTick(tick => {
      rect.style.transform = `rotate(${(tick.time * 360) % 360}deg)`
    }))

    return this
  }

  /**
   * Destroys the ticker indicator instance, removing it from the DOM and cleaning
   * up resources.
   *
   * Note: This is method is actually bound to the instance, so it can be called
   * directly without needing to use `bind` or arrow functions.
   */
  destroy = () => {
    for (const destroyable of this.#destroyables) {
      if (typeof destroyable === 'function') {
        destroyable()
      } else {
        destroyable.destroy?.()
      }
    }
    this.#destroyables.length = 0
    const { svg } = this.parts
    svg.remove()
  };
}
