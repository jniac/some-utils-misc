'use client'

import { CSSProperties, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Object3D } from 'three'

import { handleAnyUserInteraction } from 'some-utils-dom/handle/any-user-interaction'
import { useEffects, useLayoutEffects } from 'some-utils-react/hooks/effects'
import { useIsClient } from 'some-utils-react/hooks/is-client'
import { VertigoProps } from 'some-utils-three/camera/vertigo'
import { VertigoControlInputString, VertigoControls } from 'some-utils-three/camera/vertigo/controls'
import { TransformDeclaration } from 'some-utils-three/declaration'
import { ThreeBaseContext } from 'some-utils-three/experimental/contexts/types'
import { ThreeWebGLContext } from 'some-utils-three/experimental/contexts/webgl'
import { ThreeWebGPUContext } from 'some-utils-three/experimental/contexts/webgpu'
import { allDescendantsOf, setup } from 'some-utils-three/utils/tree'
import { Message } from 'some-utils-ts/message'

import { reactThreeContext } from './context'
import { useThree } from './hooks'

const defaultThreeInstanceProps = {
  hidden: false,
}
type ThreeInstanceProps = Partial<typeof defaultThreeInstanceProps> & {
  value: null | Object3D | (new () => Object3D) | (new (...args: any[]) => Object3D),
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
    ? new ThreeWebGLContext()
    : new ThreeWebGPUContext(), [type])

  three.ticker.set({ minActiveDuration: props.minActiveDuration })
  // three.loader.setPath(assetsPath)

  const { ref } = useLayoutEffects<HTMLDivElement>({ debounce: true }, function* (div, effect) {
    yield three.initialize(div.firstElementChild as HTMLDivElement, document.body)
    effect.triggerRender()
    Object.assign(window, { three, THREE })
  }, [])

  useEffects(function* () {
    yield Message.on('THREE', m => {
      m.setPayload(three)
    })

    yield handleAnyUserInteraction(three.ticker.requestActivation)

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

