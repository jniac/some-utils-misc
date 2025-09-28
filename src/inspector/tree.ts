import { Group } from './entries/group'
import { MetaProperty, splitMetaPath } from './meta-property'

/**
 * Represents a node in the field tree.
 */
export class FieldNode {
  name: string
  path = '';
  order?: number

  children = <FieldNode[]>[];
  properties = <MetaProperty[]>[];

  #state = {
    expanded: true,
    visibleProperties: <MetaProperty[]>[],
  };

  get expanded() { return this.#state.expanded }
  set expanded(value: boolean) { this.setExpanded(value) }

  get fullname() { return this.path ? `${this.path}:${this.name}` : this.name }
  get localStorageKey() { return `inspector-group-${this.fullname}` }

  visibleProperties() { return this.#state.visibleProperties[Symbol.iterator]() }
  visiblePropertyCount() { return this.#state.visibleProperties.length }

  constructor(name: string, path: string) {
    this.name = name
    this.path = path
    this.#state.expanded = window.localStorage.getItem(this.localStorageKey) !== 'false'
  }

  updateVisibleProperties(predicate: (property: MetaProperty) => boolean) {
    this.#state.visibleProperties = this.properties.filter(predicate)
  }

  setExpanded(value: boolean) {
    this.#state.expanded = value
    window.localStorage.setItem(this.localStorageKey, String(value))
  }

  requireChild(name: string, order?: number): FieldNode {
    let child = this.children.find(c => c.name === name)
    if (!child) {
      const path = this.path ? `${this.path}/${name}` : name
      child = new FieldNode(name, path)
      child.order = order
      this.children.push(child)
    }
    return child
  }

  *traverse(): Generator<FieldNode> {
    yield this
    for (const child of this.children)
      yield* child.traverse()
  }
}

/**
 * A tree structure representing the fields in the inspector.
 * 
 * It allows for grouping fields under common paths and provides methods to traverse and filter fields.
 */
export class FieldTree {
  allProperties: MetaProperty[]
  tree = new FieldNode('root', '');

  constructor(allProperties: MetaProperty[]) {
    this.allProperties = allProperties

    for (const property of this.allProperties) {
      const tokens = splitMetaPath(property.path)
      let currentGroup = this.tree
      for (const token of tokens) {
        if (!token)
          continue

        currentGroup = currentGroup.requireChild(token, property.order)
      }
      currentGroup.properties.push(property)
    }
  }

  getNodeByPath(path: string): FieldNode | undefined {
    const tokens = splitMetaPath(path)
    let currentNode: FieldNode | undefined = this.tree
    for (const token of tokens) {
      if (!token)
        continue

      currentNode = currentNode.children.find(c => c.name === token)
      if (!currentNode)
        return undefined
    }
    return currentNode
  }

  /**
   * Yields all fields in the tree that match the search criteria.
   * 
   * Note:
   * - The fields are traversed in a "depth-first" manner with sorting based on the order property.
   * - The search is case-insensitive and matches the field name.
   */
  *fields(search: string): Generator<MetaProperty> {
    const searchLower = search.toLowerCase()
    const searchFilter = search
      ? (property: MetaProperty<any>): boolean => property.key.toLowerCase().includes(searchLower)
      : () => true

    const entrySort = (a: FieldNode | MetaProperty<any>, b: FieldNode | MetaProperty<any>): number => {
      const aOrder = a.order ?? 0
      const bOrder = b.order ?? 0
      if (aOrder === bOrder) {
        if (a instanceof Group) {
          // Groups come first
          return b instanceof Group ? 0 : -1
        }
        if (b instanceof Group) {
          // Groups come first
          return 1
        }
        return 0
      }
      return aOrder - bOrder
    }

    for (const node of this.tree.traverse())
      node.updateVisibleProperties(searchFilter)

    const queue: (FieldNode | MetaProperty)[] = [this.tree]
    while (queue.length > 0) {
      const current = queue.shift()!
      if (current instanceof FieldNode) {
        const queue2 = <(FieldNode | MetaProperty)[]>[]

        queue2.push(...current.children)

        if (current.expanded)
          queue2.push(...current.visibleProperties())

        queue2.sort(entrySort)

        // Add a spacer if the current node has a path and is expanded.
        if (current.path && current.expanded) {
          queue2.push(new MetaProperty({
            key: `${current.name}-spacer`,
            type: 'spacer',
            value: '',
            order: current.order,
          }))
        }

        queue.unshift(...queue2)

        if (current.path && current.visiblePropertyCount() > 0) {
          queue.unshift(
            new MetaProperty({
              key: current.name,
              type: 'group',
              value: current.path,
              order: current.order,
            })
          )
        }
      }

      else {
        yield current
      }
    }
  }
}
