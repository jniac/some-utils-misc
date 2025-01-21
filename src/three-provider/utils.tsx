import { handleKeyboard } from 'some-utils-dom/handle/keyboard'
import { useEffects } from 'some-utils-react/hooks/effects'
import { allDescendantsOf } from 'some-utils-three/utils/tree'

import { useThree } from '.'

export function ToggleHelper({ hotkey = 'g', show = false }) {
  const three = useThree()
  useEffects(function* () {
    let showHelpers = false

    function updateHelpers() {
      for (const descendant of allDescendantsOf(three.scene)) {
        if (descendant.userData.helper) {
          descendant.visible = showHelpers
        }
      }
    }

    yield handleKeyboard([
      [hotkey, () => {
        showHelpers = !showHelpers
        updateHelpers()
      }],
    ])

    if (show) {
      showHelpers = true
      updateHelpers()
    }
  }, [hotkey])
  return null
}
