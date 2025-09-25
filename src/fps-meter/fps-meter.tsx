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
}

type Props = HTMLProps<HTMLDivElement> & Partial<typeof defaultProps>

/**
 * A simple FPS meter that updates at a specified frequency (3 times per second by default).
 *
 * Works with the 'three' ticker by default, but you can specify a different ticker name if needed.
 */
export function FpsMeter(props: Props) {
  const { frequency, tickerName, ...rest } = { ...defaultProps, ...props }
  const { ref } = useEffects<HTMLDivElement>(function* () {
    const ticker = Ticker.get('three')
    yield ticker.onTick({ timeInterval: 1 / 3 }, () => {
      ref.current.innerText = `${ticker.averageFps.toFixed(1)} fps`
    })
  }, [frequency, tickerName])
  return (
    <div ref={ref} {...rest}>
      -- fps
    </div>
  )
}
