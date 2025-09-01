import { Message } from 'some-utils-ts/message'

import { ThreeWebGlForeground } from './webgl-foreground'

export function useThreeWebGlForeground() {
  const { payload } = Message.send<ThreeWebGlForeground>(ThreeWebGlForeground)

  if (payload)
    return payload

  throw new Error('No ThreeWebGlForeground instance found. Make sure to use ThreeWebGlForegroundProvider.')
}
