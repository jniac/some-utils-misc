import { handleKeyboard } from 'some-utils-dom/handle/keyboard'
import { useEffects } from 'some-utils-react/hooks/effects'
import { allDescendantsOf } from 'some-utils-three/utils/tree'

import { ThreeBaseContext } from 'packages/some-utils-three/dist/experimental/contexts/types'
import { Destroyable } from 'packages/some-utils-ts/dist/types'
import { Object3D } from 'three'
import { useThree } from './hooks'

export function ToggleFullscreen() {
  useEffects(function* () {
    function toggleFullscreen() {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        document.documentElement.requestFullscreen()
      }
    }

    yield handleKeyboard([
      [{ key: 'f', keyCaseInsensitive: true, modifiers: 'shift' }, toggleFullscreen],
    ])

    yield () => {
      document.removeEventListener('fullscreenchange', toggleFullscreen)
    }
  }, [])
  return null
}

const defaultToggleHelpersParams = {
  hotkey: 'g',
  show: undefined as boolean | undefined,
  hide: undefined as boolean | undefined,
  isHelper: (object: Object3D) => object.userData.helper === true,
}
type ToggleHelpersParams = Partial<typeof defaultToggleHelpersParams>

class ToggleHelperHandler {
  static instances = new Map<ThreeBaseContext, ToggleHelperHandler>

  root: Object3D
  currentShowHelpers: boolean

  safeParams: typeof defaultToggleHelpersParams

  constructor(three: ThreeBaseContext, incomingParams?: ToggleHelpersParams) {
    ToggleHelperHandler.instances.set(three, this)
    this.safeParams = { ...defaultToggleHelpersParams, ...incomingParams }
    this.root = three.scene
    this.currentShowHelpers = incomingParams?.show ?? incomingParams?.hide !== false
    this.updateHelpers()
  }

  *initialize(): Generator<Destroyable> {
    const { hotkey } = this.safeParams
    yield handleKeyboard([
      [{ key: hotkey, keyCaseInsensitive: true }, () => this.toggle()]
    ])
  }

  toggle() {
    this.currentShowHelpers = !this.currentShowHelpers
    this.updateHelpers()
    return this.currentShowHelpers
  }

  updateHelpers() {
    const { isHelper } = this.safeParams
    for (const descendant of allDescendantsOf(this.root)) {
      if (isHelper(descendant)) {
        descendant.visible = this.currentShowHelpers
      }
    }
  }

  set showHelpers(show: boolean | undefined) {
    this.currentShowHelpers = show ?? this.currentShowHelpers
    this.updateHelpers()
  }
}

export function ToggleHelpers(incomingParams?: ToggleHelpersParams) {
  const show =
    incomingParams?.show !== undefined ? incomingParams?.show
      : incomingParams?.hide !== undefined ? !incomingParams?.hide
        : undefined
  useThree(async function* (three) {
    let instance = ToggleHelperHandler.instances.get(three)
    if (!instance) {
      instance = new ToggleHelperHandler(three, incomingParams)
      yield* instance.initialize()
    }
    instance.showHelpers = show
    await three.ticker.waitForSeconds(.2)
    instance.showHelpers = show
  }, [show])
  return null
}
