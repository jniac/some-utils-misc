import { useEffects, UseEffectsCallback, UseEffectsDeps } from 'some-utils-react/hooks/effects'
import { Message } from 'some-utils-ts/message'

import { ThreeWebGlForeground } from './webgl-foreground'

export function useThreeWebGlForeground(
  effects?: UseEffectsCallback<ThreeWebGlForeground>,
  deps?: UseEffectsDeps,
) {
  const { payload: foreground } = Message.send<ThreeWebGlForeground>(ThreeWebGlForeground)

  if (!foreground)
    throw new Error('No ThreeWebGlForeground instance found. Make sure to use ThreeWebGlForegroundProvider.')

  useEffects(async function* (_, effect) {
    if (effects) {
      const fx = effects as UseEffectsCallback<ThreeWebGlForeground>
      const it = fx(foreground, effect)
      if (it && typeof it.next === 'function') {
        do {
          const { value, done } = await it.next()
          if (done) break
          yield value
        } while (true)
      }
    }
  }, deps ?? 'always')

  return foreground
}
