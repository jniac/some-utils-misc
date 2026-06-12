import { _state, _update } from './internal'
import { regularChildCount } from './internal.utils'
import { Node } from './node'
import { NodeMeasure, NodeMeasureType } from './node-measure'
import { solveNodeReference } from './node-reference'
import { NodeType } from './node-type'

// function absoluteChildCount(node: Node): number {
//   let count = 0
//   for (const child of node[NodeState].children) {
//     if (child.props.type === NodeType.absolute)
//       count++
//   }
//   return count
// }

class NodeComputeState {
  size = 0
  remainingSizeForChildren = 0
  node: Node
  constructor(node: Node) {
    this.node = node
  }
}

function computeMeasure(node: Node, measure: NodeMeasure) {
  const { value, type } = measure
  switch (type) {
    case NodeMeasureType.unit:
      return value
    case NodeMeasureType.relative: {
      const reference = solveNodeReference(node.props.nodeReference, node)
      if (reference === null)
        return 0
      return reference.size * value
    }
  }
}

function computeAbsolute(parentState: NodeComputeState, node: Node) {
  const offset = computeMeasure(node, node.props.offset)
  const size = computeMeasure(node, node.props.size)
  const start = parentState.node.start + offset - size * node.props.pivot
  const end = start + size
  node[_update](start, end)
}

export function compute(root: Node) {
  const nodeStates = new Map<Node, NodeComputeState>()

  const all = [] as NodeComputeState[]
  const wrappers = [] as NodeComputeState[]
  const absolutes = [] as NodeComputeState[]

  const queue = [root]
  while (queue.length > 0) {
    const node = queue.shift()!

    const state = new NodeComputeState(node)
    nodeStates.set(node, state)
    all.push(state)

    switch (node.props.type) {
      case NodeType.wrapper: {
        wrappers.push(state)
        state.size = Number.NaN
        break
      }
      case NodeType.portion: {
        state.size = 0
      }
      case NodeType.absolute: {
        absolutes.push(state)
        break
      }
      default: {
        state.size = node.props.size.value
        break
      }
    }
    queue.push(...node.children())
  }

  // Solve the wrapper nodes from bottom -> top, so that the children are already computed.
  for (let i = wrappers.length - 1; i >= 0; i--) {
    const wrapper = wrappers[i]
    const { props } = wrapper.node
    const { children } = wrapper.node[_state]

    // Calculate the size of the wrapper based on the children.

    // Start with the padding and gap.
    let size = props.paddingStart + props.paddingEnd
      + Math.max(0, regularChildCount(wrapper.node) - 1) * props.gap
    for (const child of children) {
      if (child.props.type === NodeType.absolute) {
        // Absolute children do not contribute to the size of the wrapper.
        continue
      }
      // Add the size of each child, including its margins.
      const childState = nodeStates.get(child)!
      size += childState.size + child.props.marginStart + child.props.marginEnd
    }
    wrapper.size = size
  }

  // Solve the "portions" nodes (top -> bottom).
  for (const state of all) {
    const { node, size } = state
    let totalWeight = 0
    for (const child of node.children()) {
      if (child.props.type === NodeType.portion) {
        totalWeight += child.props.weight
      }
    }
    let remainingSize = size
    remainingSize -= node.props.paddingStart + node.props.paddingEnd
    remainingSize -= Math.max(0, regularChildCount(node) - 1) * node.props.gap
    for (const child of node.children()) {
      if (child.props.type === NodeType.absolute) {
        // Absolute children do not contribute to the size of the wrapper.
        continue
      }
      const childState = nodeStates.get(child)!
      remainingSize -= child.props.marginStart + child.props.marginEnd + childState.size
    }
    remainingSize = Math.max(0, remainingSize)
    if (totalWeight > 0) {
      for (const child of node.children()) {
        if (child.props.type === NodeType.portion) {
          const childState = nodeStates.get(child)!
          childState.size = remainingSize * (child.props.weight / totalWeight)
        }
      }
      state.remainingSizeForChildren = 0
    }

    else {
      // If there are no portion children, we store the remaining size in the state for later use.
      state.remainingSizeForChildren = remainingSize
    }
  }

  const rootStart = 0
  const rootEnd = all[0].size
  root[_update](rootStart, rootEnd)

  for (let i = 0, max = all.length; i < max; i++) {
    const state = all[i]
    const { node, remainingSizeForChildren } = state
    let position = node.start
      + node.props.paddingStart
      + remainingSizeForChildren * node.props.align
    for (const child of node.children()) {
      if (child.props.type === NodeType.absolute)
        continue

      const childState = nodeStates.get(child)!
      const start = position + child.props.marginStart
      const end = start + childState.size
      child[_update](start, end)
      position = end + child.props.marginEnd + node.props.gap
    }
  }

  // Solve the absolute nodes after all other nodes have been computed.
  for (let i = 0, max = all.length; i < max; i++) {
    const parentState = all[i]
    for (const child of parentState.node.children()) {
      if (child.props.type === NodeType.absolute) {
        computeAbsolute(parentState, child)
      }
    }
  }
}
