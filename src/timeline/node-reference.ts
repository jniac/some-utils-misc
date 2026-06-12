import { Node } from './node'

export enum NodeLink {
  self,
  parent,
  first,
  last,
  next,
  previous,
  root,
}

export type NodeReference = Node | NodeLink | NodeLink[]

function solveNodeLinkReference(value: NodeLink, node: Node): Node | null {
  switch (value) {
    case NodeLink.self:
      return node
    case NodeLink.parent:
      return node.parent
    case NodeLink.first:
      return node.getChild(0)
    case NodeLink.last:
      return node.getChild(node.childCount() - 1)
    case NodeLink.next: {
      if (!node.parent)
        return null
      return node.parent.getChild(node.getIndexInParent() + 1)
    }
    case NodeLink.previous: {
      if (!node.parent)
        return null
      return node.parent.getChild(node.getIndexInParent() - 1)
    }
    case NodeLink.root:
      return node.root
  }
}

export function solveNodeReference(value: NodeReference, node: Node): Node | null {
  if (value instanceof Node)
    return value

  const path = Array.isArray(value) ? value : [value]
  let current: Node | null = node
  for (const link of path) {
    current = solveNodeLinkReference(link, current)
    if (current === null)
      return null
  }
  return current
}
