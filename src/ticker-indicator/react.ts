import { useEffect } from 'react'
import { TickerIndicator as _TickerIndicator } from '.'

export function TickerIndicator(props: Partial<_TickerIndicator['initialize']>) {
  useEffect(() => {
    const tickerIndicator = new _TickerIndicator().initialize(props)
    return tickerIndicator.destroy
  })
  return null
}
