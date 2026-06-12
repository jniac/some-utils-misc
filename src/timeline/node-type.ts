export enum NodeType {
  /**
   * Default node type, used for blocks of content.
   *
   * It has an offset and size. Block nodes are stacked one after another. Their
   * start and end are calculated based on the position of the previous block.
   *
   * Positioning:
   * - `margin (start|end)`: controls the spacings between nodes, have an effect on the current node and the next one.
   * - `size`: the size of the node.
   * - `weight`: ignored.
   * - `pivot`: ignored.
   * - `offset`: ignored.
   */
  block = 1 << 0,

  /**
   * Absolute node type, used for nodes that are positioned absolutely within the timeline.
   *
   * Positioning:
   * - `margin (start|end)`: ignored.
   * - `size`: the size of the node.
   * - `weight`: ignored.
   * - `offset`: the position of the node relative to the start of the parent node.
   * - `pivot`: determines how the size is taken into account:
   *   - `0`: the size is ignored, the node is positioned at the offset.
   *   - `0.5`: the size is centered around the offset.
   *   - `1`: the size is positioned at the end of the offset.
   */
  absolute = 1 << 1,

  /**
   * Wrapper node type, used for nodes that wrap other nodes. Their length is calculated
   * based on the offset and length of their children.
   *
   * Positioning:
   * - `margin (start|end)`: controls the spacings between nodes, have an effect on the current node and the next one.
   * - `size`: ignored, as the size is calculated based on the children.
   * - `offset`: ignored, as the size is calculated based on the children.
   * - `pivot`: ignored, as the size is calculated based on the children.
   */
  wrapper = 1 << 2,

  /**
   * Portion node type, used for nodes that represent a portion of the parent node.
   *
   * Note:
   * - If the parent node is a "wrapper" node, the portion node will have a size of 0.
   *
   * Positioning:
   * - `size`: ignored.
   * - `margin (start|end)`: controls the spacings between nodes, have an effect on the current node and the next one.
   * - `offset`: ignored.
   * - `pivot`: ignored.
   * - `weight`: the weight of the node, used to calculate the size of the node based on the parent's size and the total weight of all portion nodes.
   */
  portion = 1 << 3,
}

export const RegularNodeMask = NodeType.block | NodeType.wrapper | NodeType.portion

type NodeTypeString = keyof typeof NodeType

export type NodeTypeDeclaration = NodeType | NodeTypeString

export function solveNodeTypeDeclaration(type: NodeTypeDeclaration): NodeType {
  if (typeof type === 'string') {
    const nodeType = NodeType[type as NodeTypeString]
    if (nodeType === undefined)
      throw new Error(`Unknown node type: ${type}`)
    return nodeType
  }
  return type
}
