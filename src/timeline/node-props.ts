import { NodeMeasure, NodeMeasureDeclaration } from './node-measure'
import { NodeLink, NodeReference } from './node-reference'
import { NodeType, NodeTypeDeclaration, solveNodeTypeDeclaration } from './node-type'

export class NodeProps {
  /**
   * The type of the node.
   *
   * @default NodeType.block
   */
  type = NodeType.block;
  /**
   * The size of the node.
   */
  size = new NodeMeasure(0);
  pivot = 0;
  offset = new NodeMeasure(0);
  weight = 1;

  marginStart = 0;
  marginEnd = 0;

  // Children properties:
  paddingStart = 0;
  paddingEnd = 0;
  gap = 0;
  /**
   * The alignment of the children within the node.
   * @default 0
   */
  align = 0;

  nodeReference: NodeReference = NodeLink.parent;

  constructor(arg?: NodePropsArg) {
    setNodeProps(this, arg ?? {})
  }

  set(arg: NodePropsArg = {}): this {
    setNodeProps(this, arg)
    return this
  }
}

const nodePropsDefaults = {
  padding: 0,
  size: <NodeMeasureDeclaration>0,
  offset: <NodeMeasureDeclaration>0,
}

export type NodePropsArg = Partial<
  & Omit<NodeProps, 'type' | 'size' | 'offset'>
  & { type: NodeTypeDeclaration }
  & typeof nodePropsDefaults
>

function setNodeProps(
  target: NodeProps,
  props: NodePropsArg
): NodeProps {
  const {
    type = target.type,
    size = target.size,
    offset = target.offset,
    padding,
    paddingStart = padding ?? target.paddingStart,
    paddingEnd = padding ?? target.paddingEnd,
    ...rest
  } = props
  Object.assign(target, {
    ...rest,
    type: solveNodeTypeDeclaration(type),
    size: NodeMeasure.parse(size),
    offset: NodeMeasure.parse(offset),
  })
  return target
}
