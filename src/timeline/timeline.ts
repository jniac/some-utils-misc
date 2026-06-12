import { Node } from './node'
import { NodeType } from './node-type'

export class Timeline extends Node {
  static Node = Node

  heads = [new Node({ isHead: true, name: 'main-head', type: NodeType.absolute })]

  get head() { return this.heads[0] }

  constructor(props: ConstructorParameters<typeof Node>[0] = {}) {
    super({
      name: 'timeline',
      type: NodeType.wrapper,
      ...props,
    })
    for (const head of this.heads) {
      this.add(head)
    }
  }
}
