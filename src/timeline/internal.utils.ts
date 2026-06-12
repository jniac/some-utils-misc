import { _state } from './internal'
import { Node } from './node'
import { RegularNodeMask } from './node-type'

export function regularChildCount(node: Node): number {
  let count = 0
  for (const child of node[_state].children) {
    if (child.props.type & RegularNodeMask)
      count++
  }
  return count
}
