import { HTMLProps } from 'react'

import { useEffects } from 'some-utils-react/hooks/effects'

import { useThree } from '../three-provider/hooks'

export function FpsMeter(props: HTMLProps<HTMLDivElement>) {
  const three = useThree()
  const { ref } = useEffects<HTMLDivElement>(function* () {
    yield three.ticker.onTick({ timeInterval: 1 / 3 }, () => {
      ref.current.innerText = `${three.averageFps.toFixed(1)} fps`
    })
  }, [])
  return (
    <div ref={ref} {...props}>
      -- fps
    </div>
  )
}
