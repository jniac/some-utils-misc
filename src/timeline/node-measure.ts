
export enum NodeMeasureType {
  /**
   * Unit measure type, used for absolute values that are not relative to any other node.
   */
  unit,
  /**
   * Relative measure type, used for values that are relative to some other node.
   * 
   * Note:
   * - To solve the actual value the "other" node should be specified and generally
   *   corresponds to the `nodeReference` property of the node. 
   */
  relative,
}

export type NodeMeasureDeclaration = NodeMeasure | number | [number, NodeMeasureType] | `${number}%`

function parse(value: NodeMeasureDeclaration, out = new NodeMeasure()): NodeMeasure {
  if (value instanceof NodeMeasure)
    return out.copy(value)

  if (typeof value === 'number')
    return out.set(value, NodeMeasureType.unit)

  if (Array.isArray(value)) {
    const [num, type] = value
    return out.set(num, type)
  }

  if (typeof value === 'string') {
    const num = parseFloat(value.replace('%', ''))
    const relative = value.endsWith('%')
    return out.set(num * (relative ? .01 : 1), relative ? NodeMeasureType.relative : NodeMeasureType.unit)
  }

  throw new TypeError(`Invalid NodeMeasureDeclaration: ${value}`)
}

export class NodeMeasure {
  static parse = parse

  value: number
  type: NodeMeasureType

  constructor(value: number = 0, type = NodeMeasureType.unit) {
    this.value = value
    this.type = type
  }

  copy(other: NodeMeasure): this {
    this.value = other.value
    this.type = other.type
    return this
  }

  set(value: number, type = this.type): this {
    this.value = value
    this.type = type
    return this
  }

  parse(value: NodeMeasureDeclaration): this {
    parse(value, this)
    return this
  }
}
