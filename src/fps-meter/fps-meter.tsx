'use client'

import { HTMLProps } from 'react'

import { useEffects } from 'some-utils-react/hooks/effects'
import { Ticker } from 'some-utils-ts/ticker'

const defaultProps = {
  /**
   * Number of times per second to update the FPS meter.
   */
  frequency: 3,
  /**
   * Name of the ticker to use for the FPS meter.
   */
  tickerName: 'three',
  /**
   * Number of decimal places to display in the FPS meter.
   */
  precision: 1
}

type Props = HTMLProps<HTMLDivElement> & Partial<typeof defaultProps>

/**
 * A simple FPS meter that updates at a specified frequency (3 times per second by default).
 *
 * Works with the 'three' ticker by default, but you can specify a different ticker name if needed.
 */
export function FpsMeter(props: Props) {
  const { frequency, tickerName, precision, ...rest } = { ...defaultProps, ...props }
  const { ref } = useEffects<HTMLDivElement>(function* () {
    const ticker = Ticker.get('three')
    yield ticker.onTick({ timeInterval: 1 / 3 }, () => {
      ref.current.innerText = `${ticker.averageFps.toFixed(precision)} fps`
    })
  }, [frequency, tickerName, precision])
  return (
    <div ref={ref} {...rest}>
      -- fps
    </div>
  )
}
