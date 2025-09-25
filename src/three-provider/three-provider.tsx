'use client'

import { CSSProperties, useMemo, useRef } from 'react'
import * as THREE from 'three'

import { handleAnyUserInteraction } from 'some-utils-dom/handle/any-user-interaction'
import { handleKeyboard, KeyboardFilterDeclaration } from 'some-utils-dom/handle/keyboard'
import { useEffects, useLayoutEffects } from 'some-utils-react/hooks/effects'
import { useIsClient } from 'some-utils-react/hooks/is-client'
import { VertigoProps } from 'some-utils-three/camera/vertigo'
import { VertigoControlInputString, VertigoControls } from 'some-utils-three/camera/vertigo/controls'
import { PlaneDeclaration } from 'some-utils-three/declaration'
import { ThreePointerEvent } from 'some-utils-three/experimental/contexts/pointer'
import { ThreeBaseContext, TickPhase } from 'some-utils-three/experimental/contexts/types'
import { ThreeWebGLContext } from 'some-utils-three/experimental/contexts/webgl'
import { ThreeWebGPUContext } from 'some-utils-three/experimental/contexts/webgpu'
import { Message } from 'some-utils-ts/message'

import { reactThreeContext } from './context'
import { useInstance } from './hooks'

export function ThreeInstance<T extends THREE.Object3D>(incomingProps: Parameters<typeof useInstance<T>>[0]) {
  useInstance(incomingProps)
  return null
}

type ExtendedVertigoProps = VertigoProps & Partial<{
  fixed: boolean
  panInput: VertigoControlInputString
  orbitInput: VertigoControlInputString
  inputConfig: Partial<VertigoControls['inputConfig']>
  focusPlane: PlaneDeclaration
  /**
   * If true, the controls will be attached to the canvas element instead of the wrapper div.
   */
  eventTarget: 'canvas' | 'wrapper'
}>

const defaultProps = {
  type: undefined as undefined | 'webgpu' | 'webgl',
  webgl: undefined as undefined | boolean,
  webgpu: undefined as undefined | boolean,
  className: '',
  assetsPath: '/',
  vertigoControls: false as boolean | ExtendedVertigoProps,
  minActiveDuration: 30,
  fullscreenKey: null as KeyboardFilterDeclaration | null,
}

type Props = Partial<typeof defaultProps> & { children?: React.ReactNode }

function ServerProofThreeProvider(incomingProps: Props) {
  const props = { ...defaultProps, ...incomingProps }
  const { children, className, vertigoControls: vertigoControlsProps } = props

  // Type handling for webgl and webgpu
  const type = props.type ?? (props.webgpu ? 'webgpu' : 'webgl')
  const typeRef = useRef(undefined as undefined | 'webgl' | 'webgpu')
  if (typeRef.current && typeRef.current !== type)
    console.warn('ThreeProvider: the prop "type" is not intended to change after the component is mounted.')
  typeRef.current = type
  const three: ThreeBaseContext = useMemo(() => type === 'webgl'
    ? new ThreeWebGLContext()
    : new ThreeWebGPUContext(), [type])

  three.ticker.set({ minActiveDuration: props.minActiveDuration })
  // three.loader.setPath(assetsPath)

  const { ref } = useLayoutEffects<HTMLDivElement>({ debounce: true }, function* (div, effect) {
    const canvasWrapper = div.querySelector('#three-wrapper-canvas') as HTMLDivElement

    yield three.initialize(canvasWrapper, document.body)

    three.pointer.setEventIgnore(ThreePointerEvent.Type.Tap, event => {
      const { downTarget } = event
      const isCanvas = canvasWrapper === downTarget || canvasWrapper.contains(downTarget)
      return isCanvas === false
    })

    effect.triggerRender()

    Object.assign(window, { three, THREE })
  }, [])

  useEffects(function* () {
    yield Message.on('THREE', m => {
      m.setPayload(three)
    })

    yield handleAnyUserInteraction(three.ticker.requestActivation)

    if (props.fullscreenKey) {
      yield handleKeyboard([
        [props.fullscreenKey, () => {
          if (document.fullscreenElement) {
            document.exitFullscreen()
          } else {
            document.documentElement.requestFullscreen()
          }
        }]
      ])
    }

    if (vertigoControlsProps) {
      const controlsProps = typeof vertigoControlsProps === 'object' ? vertigoControlsProps : {}
      const controls = new VertigoControls(controlsProps)
        .initialize(
          controlsProps.eventTarget === 'canvas'
            ? three.domElement
            : ref.current!)

      Object.assign(controls.inputConfig, controlsProps.inputConfig)
      controls.parsePanInputs(controlsProps.panInput ?? '')
      controls.parseOrbitInputs(controlsProps.orbitInput ?? '')
      controls.focusPlane = controlsProps.focusPlane ?? null
      three.scene.add(controls.group)

      if (!controlsProps.fixed) {
        controls.start()
      }

      yield controls.destroy

      const onVertigoControlsMessage = (m: Message<any>): void => {
        switch (m.type) {
          case 'SET': {
            controls.vertigo.set(m.payload)
            break
          }
          default: {
            m.setPayload(controls)
            break
          }
        }
      }
      yield Message.on('VERTIGO_CONTROLS', onVertigoControlsMessage) // for backwards compatibility
      yield Message.on(VertigoControls, onVertigoControlsMessage)

      // order: -1 to run before the default "render" tick
      yield three.ticker.onTick({ name: 'VertigoControls', phase: TickPhase.BeforeRender, order: -1 }, tick => {
        controls.update(three.camera, three.aspect, tick.deltaTime)
      })
    }
  }, [vertigoControlsProps])

  const layer = { position: 'absolute', inset: 0 } as CSSProperties
  return (
    <div ref={ref} className={className} style={layer}>
      <reactThreeContext.Provider value={three}>
        <div id='three-wrapper-canvas' style={layer} />
        <div id='three-wrapper-hud' style={layer} className='thru'>
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

