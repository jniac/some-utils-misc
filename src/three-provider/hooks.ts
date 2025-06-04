import { useContext, useMemo } from 'react'
import { Group, Object3D } from 'three'

import { useEffects, UseEffectsCallback, UseEffectsDeps, UseEffectsEffect, UseEffectsReturnable } from 'some-utils-react/hooks/effects'
import { TransformDeclaration } from 'some-utils-three/declaration'
import { ThreeBaseContext, ThreeContextType } from 'some-utils-three/experimental/contexts/types'
import { ThreeWebGLContext } from 'some-utils-three/experimental/contexts/webgl'
import { ThreeWebGPUContext } from 'some-utils-three/experimental/contexts/webgpu'
import { allDescendantsOf, setup } from 'some-utils-three/utils/tree'
import { OneOrMany } from 'some-utils-ts/types'

import { reactThreeContext } from './context'

export function useThree(
  effects?: UseEffectsCallback<ThreeBaseContext>,
  deps?: UseEffectsDeps,
): ThreeBaseContext {
  const three = useContext(reactThreeContext)

  useEffects(async function* (_, state) {
    if (effects) {
      const it = effects(three, state)
      if (it && typeof it.next === 'function') {
        do {
          const { value, done } = await it.next()
          if (done) break
          yield value
        } while (state.mounted)
      }
    }
  }, deps ?? 'always')

  return three
}

/**
 * If a ThreeWebGLContext is available, use it, otherwise return null and ignore 
 * the effects.
 */
export function useThreeWebGL(
  effects?: UseEffectsCallback<ThreeWebGLContext>,
  deps?: UseEffectsDeps,
): ThreeWebGLContext | null {
  const three = useThree(async function* (three, effect) {
    if (three.type === ThreeContextType.WebGL && effects) {
      const fx = effects as UseEffectsCallback<ThreeBaseContext>
      const it = fx(three, effect)
      if (it && typeof it.next === 'function') {
        do {
          const { value, done } = await it.next()
          if (done) break
          yield value
        } while (true)
      }
    }
  }, deps) as ThreeWebGLContext
  if (three.type === ThreeContextType.WebGL) {
    return three
  }
  return null
}

/**
 * If a "webgpu" context is available, use it, otherwise return null and ignore 
 * the effects.
 */
export function useThreeWebGPU(
  effects?: UseEffectsCallback<ThreeWebGPUContext>,
  deps?: UseEffectsDeps,
): ThreeWebGPUContext | null {
  const three = useThree(async function* (three, effect) {
    if (three.type === ThreeContextType.WebGPU && effects) {
      const fx = effects as UseEffectsCallback<ThreeBaseContext>
      const it = fx(three, effect)
      if (it && typeof it.next === 'function') {
        do {
          const { value, done } = await it.next()
          if (done) break
          yield value
        } while (true)
      }
    }
  }, deps) as ThreeWebGPUContext
  if (three.type === ThreeContextType.WebGPU) {
    return three
  }
  return null
}

export function useGroup(
  name: string,
  effects?: (group: Group, three: ThreeBaseContext, state: UseEffectsEffect) => UseEffectsReturnable,
  deps?: UseEffectsDeps,
): Group {
  const group = useMemo(() => new Group(), [])
  group.name = name

  useThree(async function* (three, state) {
    three.scene.add(group)
    yield () => {
      group.clear()
      group.removeFromParent()
    }

    if (effects) {
      const it = effects(group, three, state)
      if (it && typeof it.next === 'function') {
        do {
          const { value, done } = await it.next()
          if (done) break
          yield value
        } while (state.mounted)
      }
    }
  }, deps)

  return group
}

const defaultInstanceProps = {
  hidden: false,
}

type InstanceProps = Partial<typeof defaultInstanceProps> & {
  value: OneOrMany<null | Object3D | (new () => Object3D) | (new (...args: any[]) => Object3D)>,
  transform?: TransformDeclaration
}

export function useInstance(props: InstanceProps) {
  useThree(async function* (three) {
    const {
      value,
      hidden,
    } = props

    if (!value)
      return

    const instance: any = typeof value === 'function' ? new value() : value
    setup(instance, {
      parent: three.scene,
      ...props.transform,
    })

    if (hidden) {
      instance.visible = false
    }

    for (const object of allDescendantsOf(instance, { includeSelf: true })) {
      if ('onInitialize' in object) {
        const result = (object as any).onInitialize(three)
        if (result && typeof result.next === 'function') {
          do {
            const { value, done } = await result.next()
            if (done) break
            yield value
          } while (true)
        }
      }
    }

    yield () => {
      instance.removeFromParent()
      for (const object of allDescendantsOf(instance, { includeSelf: true })) {
        if ('onDestroy' in object) {
          (object as any).onDestroy?.()
        }
      }
    }
  }, 'always')
}
