'use client'

import { createContext, CSSProperties, useContext, useMemo, useRef } from 'react'
import { Group, Object3D } from 'three/webgpu'

import { useEffects, UseEffectsCallback, UseEffectsDeps, UseEffectsEffect, UseEffectsReturnable, useLayoutEffects } from 'some-utils-react/hooks/effects'
import { useIsClient } from 'some-utils-react/hooks/is-client'
import { VertigoProps } from 'some-utils-three/camera/vertigo'
import { VertigoControlInputString, VertigoControls } from 'some-utils-three/camera/vertigo/controls'
import { TransformDeclaration } from 'some-utils-three/declaration'
import { ThreeBaseContext } from 'some-utils-three/experimental/contexts/types'
import { ThreeWebglContext } from 'some-utils-three/experimental/contexts/webgl'
import { ThreeWebGPUContext } from 'some-utils-three/experimental/contexts/webgpu'
import { allDescendantsOf, setup } from 'some-utils-three/utils/tree'
import { Message } from 'some-utils-ts/message'

const reactThreeContext = createContext<ThreeBaseContext>(null!)

export function useThree(
  effects?: UseEffectsCallback<ThreeWebGPUContext>,
  deps?: UseEffectsDeps,
): ThreeWebGPUContext {
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

export function useGroup(
  name: string,
  effects?: (group: Group, three: ThreeWebGPUContext, state: UseEffectsEffect) => UseEffectsReturnable,
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

const defaultThreeInstanceProps = {
  hidden: false,
}
type ThreeInstanceProps = Partial<typeof defaultThreeInstanceProps> & {
  value: null | Object3D | (new (...args: any[]) => Object3D),
  transform?: TransformDeclaration
}
export function ThreeInstance(incomingProps: ThreeInstanceProps) {
  const props = { ...defaultThreeInstanceProps, ...incomingProps }

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

  return null
}

type ExtendedVertigoProps = VertigoProps & Partial<{
  fixed: boolean
  panInput: VertigoControlInputString
  orbitInput: VertigoControlInputString
  inputConfig: Partial<VertigoControls['inputConfig']>
}>

const defaultProps = {
  type: undefined as undefined | 'webgpu' | 'webgl',
  webgl: undefined as undefined | boolean,
  webgpu: undefined as undefined | boolean,
  className: '',
  assetsPath: '/',
  vertigoControls: false as boolean | ExtendedVertigoProps,
  minActiveDuration: 30,
}

type Props = Partial<typeof defaultProps> & { children?: React.ReactNode }

function ServerProofThreeProvider(incomingProps: Props) {
  const props = { ...defaultProps, ...incomingProps }
  const { children, className, vertigoControls: vertigo } = props

  const type = props.type ?? (props.webgpu ? 'webgpu' : 'webgl')
  const typeRef = useRef(undefined as undefined | 'webgl' | 'webgpu')
  if (typeRef.current && typeRef.current !== type) {
    console.warn('ThreeProvider: the prop "type" is not intended to change after the component is mounted.')
  }
  typeRef.current = type
  const three: ThreeBaseContext = useMemo(() => type === 'webgl'
    ? new ThreeWebglContext()
    : new ThreeWebGPUContext(), [type])

  three.ticker.set({ minActiveDuration: props.minActiveDuration })
  // three.loader.setPath(assetsPath)

  const { ref } = useLayoutEffects<HTMLDivElement>({ debounce: true }, function* (div, effect) {
    yield three.initialize(div.firstElementChild as HTMLDivElement, document.body)
    effect.triggerRender()
    Object.assign(window, { three })
  }, [])

  useEffects(function* () {
    yield Message.on('THREE', m => {
      m.setPayload(three)
    })

    if (vertigo) {
      const controlsProps = typeof vertigo === 'object' ? vertigo : {}
      const controls = new VertigoControls(controlsProps)
        .initialize(ref.current!)

      Object.assign(controls.inputConfig, controlsProps.inputConfig)
      controls.parsePanInputs(controlsProps.panInput ?? '')
      controls.parseOrbitInputs(controlsProps.orbitInput ?? '')

      if (!controlsProps.fixed) {
        controls.start()
      }

      yield controls.destroy

      yield Message.on('VERTIGO_CONTROLS', m => {
        m.setPayload(controls)
      })

      // order: -1 to run before the default "render" tick
      yield three.ticker.onTick({ order: -1 }, tick => {
        controls.update(three.camera, three.aspect, tick.deltaTime)
      })
    }
  }, [vertigo])

  const layer = { position: 'absolute', inset: 0 } as CSSProperties
  return (
    <div ref={ref} className={className} style={layer}>
      <reactThreeContext.Provider value={three}>
        <div style={layer} />
        <div style={layer} className='thru'>
          {three.initialized && children}
        </div>
      </reactThreeContext.Provider>
    </div>
  )
}

export function ThreeProvider(...args: Parameters<typeof ServerProofThreeProvider>) {
  return useIsClient() && (
    <ServerProofThreeProvider {...args[0]} />
  )
}

