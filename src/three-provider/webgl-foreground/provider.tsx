import { createContext, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import { useThreeWebGL } from 'some-utils-misc/three-provider'
import { useEffects } from 'some-utils-react/hooks/effects'
import { Message } from 'some-utils-ts/message'
import { ThreeWebGlForeground } from './webgl-foreground'

const context = createContext<ThreeWebGlForeground>(null!)

export function ThreeWebGlForegroundProvider({ children }: { children?: React.ReactNode }) {
  const three = useThreeWebGL()!
  const [ready, setReady] = useState(false)
  const foreground = useMemo(() => new ThreeWebGlForeground(), [three])

  // @ts-ignore (cheat for debug purpose)
  three.foreground = foreground

  useEffects(function* () {
    yield* foreground.initialize(three)
    yield Message.on(ThreeWebGlForeground, message =>
      message.setPayload(foreground))
    setReady(true)
  }, [])

  if (ready === false)
    return null

  return createPortal((
    <context.Provider value={foreground} >
      {children}
    </context.Provider>
  ), foreground.div)
}
