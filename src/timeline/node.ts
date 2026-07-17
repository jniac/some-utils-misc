import { inverseLerp } from 'some-utils-ts/math/basic'
import { _state, _update } from './internal'
import { compute } from './internal.compute'
import { regularChildCount } from './internal.utils'
import { NodeProps, NodePropsArg } from './node-props'
import { NodeType } from './node-type'
import { toGraphSvgString, ToInnerSvgStringOptions } from './svg'

type NodeConstructorArg = Partial<NodePropsArg & {
  isHead?: boolean
  name?: string
}>

export class Node {
  static #nextId = 0

  id = Node.#nextId++
  name: string

  props = new NodeProps();

  [_state] = {
    start: 0,
    end: 0,

    startOld: NaN,
    endOld: NaN,

    root: <Node>this,
    parent: <Node | null>null,
    children: <Node[]>[],

    isHead: false,
  }

  get isHead() { return this[_state].isHead }
  get start() { return this[_state].start }
  get end() { return this[_state].end }
  get root() { return this[_state].root }
  get parent() { return this[_state].parent }

  /**
   * The "real" size of the node, which is the difference between `end` and `start`.
   * 
   * Note:
   * - This is not the same as `props.size`, which is the size of the node as defined by its properties.
   */
  get size() {
    return this[_state].end - this[_state].start
  }

  /**
   * Convenient accessor to the center of the node, which is the average of `start` and `end`.
   */
  get center() {
    return (this[_state].start + this[_state].end) / 2
  }

  /**
   * The offset of the node, which is the value of the `offset` property (from `NodeProps`).
   * 
   * Note:
   * - This is useful for absolute nodes, where the offset is the position of the node
   *   relative to its parent.
   * - When setting the offset, it will throw an error if the node is not absolute,
   */
  get offset() { return this.props.offset.value }
  set offset(value: number) { this.setOffset(value, { throwIfNotAbsolute: true }) }

  constructor({ name, isHead, ...props }: NodeConstructorArg = {}) {
    this.name = name ?? `node-${Node.#nextId}`
    this[_state].isHead = isHead ?? false
    this.props.set(props)
  }

  [_update](start: number, end: number): this {
    const state = this[_state]
    state.startOld = state.start
    state.endOld = state.end
    state.start = start
    state.end = end
    return this
  }

  getStartLastDelta(): number {
    return this[_state].start - this[_state].startOld
  }

  getEndLastDelta(): number {
    return this[_state].end - this[_state].endOld
  }

  /**
   * Returns true if the node has changed since the last update.
   * @param threshold - The minimum change required to consider the node changed.
   */
  hasChanged(threshold = 1e-6): boolean {
    return (
      Math.abs(this.getStartLastDelta()) > threshold ||
      Math.abs(this.getEndLastDelta()) > threshold
    )
  }

  /**
   * Checks if the given position is within the bounds of the node.
   */
  contains(position: number): boolean {
    return position >= this.start && position <= this.end
  }

  /**
   * Computes the inverse linear interpolation of the node's start and end positions.
   * 
   * If the start and end are equal, it returns 0 if the position is less than to 
   * the start, and 1 if greater or equal.
   */
  inverseLerp(position: number): number {
    const { start, end } = this
    if (start === end) {
      return position < start ? 0 : 1
    }
    return inverseLerp(start, end, position)
  }

  children() { return this[_state].children[Symbol.iterator]() }

  childCount() { return this[_state].children.length }

  /**
   * Returns the number of regular children of the node.
   * 
   * Memo:
   * - Regular children are those that are not absolute nodes.
   */
  regularChildCount() {
    return regularChildCount(this)
  }

  getIndexInParent(): number {
    return this.parent ? this.parent[_state].children.indexOf(this) : -1
  }

  getChild(index: number): Node | null {
    return this[_state].children[index] ?? null
  }

  *ascendants({ includeSelf = true } = {}): Generator<Node> {
    if (includeSelf)
      yield this
    let node = this.parent
    while (node) {
      yield node
      node = node.parent
    }
  }

  *descendants({
    includeSelf = true,
    method = <'depth-first' | 'breadth-first'>'depth-first',
  } = {}): Generator<Node> {
    if (includeSelf)
      yield this

    const queue = includeSelf ? [this] : [...this[_state].children]

    if (method === 'breadth-first') {
      while (queue.length > 0) {
        const node = queue.shift()!
        queue.push(...node[_state].children)
        yield node
      }
    } else {
      while (queue.length > 0) {
        const node = queue.shift()!
        queue.unshift(...node[_state].children)
        yield node
      }
    }
  }

  *queryAll(arg: string | RegExp | ((node: Node) => boolean), {
    includeSelf = false,
    method = <'depth-first' | 'breadth-first'>'depth-first',
  } = {}): Generator<Node> {
    const predicate = typeof arg === 'function'
      ? arg
      : typeof arg === 'string'
        ? (node: Node) => node.name === arg
        : (node: Node) => node.name.match(arg)

    for (const node of this.descendants({ includeSelf, method }))
      if (predicate(node))
        yield node
  }

  queryFirst(...args: Parameters<Node['queryAll']>): Node | null {
    const iterator = this.queryAll(...args)
    const first = iterator.next()
    if (first.done)
      return null
    return first.value
  }

  depth() {
    let depth = 0
    let node = this.parent
    while (node) {
      depth++
      node = node.parent
    }
    return depth
  }

  removeFromParent(): this {
    if (this.parent) {
      const index = this.parent[_state].children.indexOf(this)
      if (index === -1) {
        console.log(this)
        console.log(this.parent)
        throw new Error('Node not found in parent children (???)')
      }
      this.parent[_state].children.splice(index, 1)
      this[_state].parent = null
      this[_state].root = this
    }
    return this
  }

  add(...nodeArgs: NodeConstructorArg[]): this {
    for (const arg of nodeArgs) {
      const node = arg instanceof Node ? arg : new Node(arg)
      node.removeFromParent()
      node[_state].parent = this
      node[_state].root = this[_state].root
      this[_state].children.push(node)
    }
    return this
  }

  compute(): this {
    compute(this)
    return this
  }

  getOffset(): number {
    return this.props.offset.value
  }

  /**
   * Shorthand for setting the offset of the node. Useful for absolute nodes.
   * 
   * Note:
   * - If the node is not absolute, it will throw an error by default.
   * - You can disable this behavior by passing `{ throwIfNotAbsolute: false }`.
   */
  setOffset(value: number, { throwIfNotAbsolute = true } = {}): this {
    if (throwIfNotAbsolute && this.props.type !== NodeType.absolute)
      throw new Error('Cannot set offset on a non-absolute node')

    this.props.offset.set(value)
    return this
  }

  incrementOffset(delta: number, { throwIfNotAbsolute = true } = {}): this {
    if (throwIfNotAbsolute && this.props.type !== NodeType.absolute)
      throw new Error('Cannot increment offset on a non-absolute node')

    this.props.offset.set(this.props.offset.value + delta)
    return this
  }

  toInnerSvgString(arg?: ToInnerSvgStringOptions): string {
    return toGraphSvgString(this, arg).string
  }
}
