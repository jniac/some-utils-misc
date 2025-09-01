import { Plane } from 'three'

import { TickPhase } from 'some-utils-three/experimental/contexts/types'
import { ThreeWebGLContext } from 'some-utils-three/experimental/contexts/webgl'

const layered = (element: HTMLElement) => {
  element.style.setProperty('position', 'absolute')
  element.style.setProperty('top', '0px')
  element.style.setProperty('left', '0px')
  element.style.setProperty('width', '100%')
  element.style.setProperty('height', '100%')
  return element
}

export class ThreeWebGlForeground {
  enabled = true;
  three2 = new ThreeWebGLContext();
  div = document.createElement('div');
  clipPlane = new Plane();

  onBeforeRender = () => { };

  *initialize(three: ThreeWebGLContext) {
    const { three2, clipPlane } = this

    this.div.id = 'three-webgl-foreground'
    layered(this.div)
    three.domContainer.appendChild(this.div)

    yield three2.initialize(three.domContainer)
    layered(three2.domElement)

    three2.camera.matrixAutoUpdate = false // The camera matrices will be a strict copy of three.camera
    three2.setScene(three.scene)
    three2.renderer.clippingPlanes = [clipPlane]
    three2.skipTickUpdate = true
    three2.pointer.enabled = false

    yield three.ticker.onTick({ phase: TickPhase.AfterRender }, tick => {
      three2.renderer.domElement.style.setProperty('display', this.enabled ? 'block' : 'none')
      const isOverForeground = this.enabled && three2.pointerPixelColor().a > 0
      three2.renderer.domElement.style.setProperty('pointer-events', isOverForeground ? 'auto' : 'none')

      if (this.enabled) {
        this.onBeforeRender()

        // Camera update
        three2.camera.matrix.copy(three.camera.matrix)
        three2.camera.matrixWorld.copy(three.camera.matrixWorld)
        three2.camera.matrixWorldInverse.copy(three.camera.matrixWorldInverse)
        three2.camera.projectionMatrix.copy(three.camera.projectionMatrix)
        three2.camera.projectionMatrixInverse.copy(three.camera.projectionMatrixInverse)
        three2.renderFrame(tick)
      }
    })
  }
}
