import { TreeNode } from 'some-utils-ts/experimental/layout/flex/TreeNode'

import { handlePointer } from 'some-utils-dom/handle/pointer'
import { dumpDestroyables } from 'some-utils-ts/misc/destroy'
import { Destroyable } from 'some-utils-ts/types'
import css from './hierarchy.css'

type HierarchyNodeState = {
  expanded: boolean
  selected: boolean
}

class HierarchyNode<T = any> extends TreeNode {
  value: T | null = null
  div: HTMLDivElement | null = null

  state: HierarchyNodeState = {
    expanded: true,
    selected: false,
  }
}

function buildTree<T>(
  sourceRoot: T,
  children: (node: T) => Iterable<T>,
  cacheKey = null as string | null,
) {
  const root = new HierarchyNode<T>()
  root.value = sourceRoot

  const stack: HierarchyNode<T>[] = [root]
  while (stack.length > 0) {
    const node = stack.pop()!
    for (const child of children(node.value!)) {
      const childNode = new HierarchyNode<T>()
      childNode.value = child
      node.addChild(childNode)
      stack.push(childNode)
    }
  }

  root.computeTid()

  if (cacheKey) {
    const str = localStorage.getItem(cacheKey)
    if (str) {
      try {
        const states = JSON.parse(str) as Record<string, HierarchyNodeState>
        for (const node of root.flat()) {
          if (node.tid in states) {
            node.state = states[node.tid]
            node.state.selected = false // don't restore selection, as the underlying objects might have changed
          }
        }
      } catch (e) { }
    }
  }

  return root
}

function extractName(node: any) {
  if (typeof node === 'string')
    return node
  if (node.name)
    return node.name
  if (node.constructor && node.constructor.name)
    return `{${node.constructor.name}}`
  return String(node)
}

let styleElement: HTMLStyleElement | null = null
function ensureStyle() {
  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.textContent = css
    document.head.appendChild(styleElement)
  }
}

const hierarchyDefaultOptions = {
  cacheKey: null as string | null,
}

type HierarchyOptions<T = any> = typeof hierarchyDefaultOptions & {
  onSelectionChange?: (nodes: T[]) => void
}

export class HierarchyView<T = any> {
  div = document.createElement('div')

  #private: {
    tree: HierarchyNode<T>
    destroyables: Destroyable[]
    destroy: () => void
    destroyed: boolean
    options: HierarchyOptions<T>
    selection: Set<HierarchyNode<T>>
  }

  constructor(sourceRoot: T, userOptions: Partial<HierarchyOptions<T>> = {}) {
    const options = { ...hierarchyDefaultOptions, ...userOptions }

    this.div.classList.add('HierarchyView')
    const sizeObserver = new ResizeObserver(() => this.#build())
    sizeObserver.observe(this.div)

    const tree = buildTree(
      sourceRoot,
      (node: T) => (node as any)['children'] as T[] ?? [],
      options.cacheKey
    )

    const destroy = () => {
      if (this.#private.destroyed)
        return

      sizeObserver.disconnect()
      dumpDestroyables(this.#private.destroyables)
      this.#private.destroyables = []
      this.#private.selection.clear()
      this.#private.destroyed = true
    }

    this.#private = {
      tree,
      destroy,
      destroyed: false,
      options,
      selection: new Set<HierarchyNode<T>>(),
      destroyables: [],
    }

    this.#private.destroyables.push(
      handlePointer(this.div, {
        onTap: info => {
          const target = info.downTarget as HTMLElement
          const node = tree.find(n => !!n.div && (n.div === target || n.div.contains(target)))
          if (!node)
            throw new Error('Oops, Node not found for div (???)')
          if (info.downTarget.classList.contains('expand-toggle')) {
            this.#handleNodeToggleTap(node, info.tapCount)
          }
          if (info.downTarget.classList.contains('name')) {
            this.#handleNodeNameTap(node, info.originalDownEvent)
          }
        },
      }),
    )

    ensureStyle()
  }

  destroy = () => {
    this.#private.destroy()
  }

  #build() {
    const { tree, destroyed, options } = this.#private

    if (destroyed)
      return

    const displayedNodes = <HierarchyNode<T>[]>[]
    const stack: HierarchyNode<T>[] = [tree]
    while (stack.length > 0) {
      const node = stack.pop()!
      displayedNodes.push(node)
      if (node.state.expanded) {
        for (const child of node.children) {
          stack.push(child)
        }
      }
    }

    this.div.replaceChildren(...displayedNodes.map(node => {
      const div = document.createElement('div')
      div.classList.add('entry')
      div.style.paddingLeft = `${node.depth() * 8}px`
      node.div = div

      const toggle = document.createElement('div')
      toggle.classList.add('expand-toggle')
      if (node.children.length > 0) {
        toggle.classList.add(node.state.expanded ? 'expanded' : 'minimized')
      } else {
        toggle.classList.add('empty')
      }
      div.append(toggle)

      const name = document.createElement('div')
      name.classList.add('name')
      name.textContent = extractName(node.value)
      div.append(name)

      if (node.isRoot() || (node.state.expanded === false && node.hasChild())) {
        const count = document.createElement('div')
        count.classList.add('count')
        count.textContent = `(${node.leavesCount()})`
        div.append(count)
      }

      return div
    }))

    if (options.cacheKey) {
      const states: Record<string, HierarchyNodeState> = {}
      for (const node of tree.flat()) {
        states[node.tid] = node.state
        if (node.state.selected) {
          node.div?.classList.add('selected')
          this.#private.selection.add(node)
        }
      }
      if (this.#private.selection.size > 0) {
        options.onSelectionChange?.([...this.#private.selection].map(n => n.value!))
      }
      localStorage.setItem(options.cacheKey, JSON.stringify(states))
    }
  }

  #handleNodeToggleTap(node: HierarchyNode<T>, tapCount: number) {
    if (tapCount === 1) {
      node.state.expanded = !node.state.expanded
    } else {
      let expand = true
      for (const descendant of node.allDescendants()) {
        if (descendant.hasChild()) {
          expand = descendant.state.expanded === false
          break
        }
      }
      for (const descendant of node.allDescendants()) {
        descendant.state.expanded = expand
      }
    }
    this.#build()
  }

  #handleNodeNameTap(node: HierarchyNode<T>, modifiers: { shiftKey: boolean }) {
    const { selection, options } = this.#private
    const newSelection = new Set<HierarchyNode<T>>()

    if (modifiers.shiftKey) {
      for (const node of selection) {
        newSelection.add(node)
      }

      if (selection.has(node)) {
        newSelection.delete(node)
      } else {
        newSelection.add(node)
      }
    }

    else {
      if (selection.size === 1 && selection.has(node))
        return

      newSelection.add(node)
    }

    for (const node of selection) {
      if (newSelection.has(node) === false) {
        // node is deselected
        node.div?.classList.remove('selected')
        node.state.selected = false
      }
    }
    for (const node of newSelection) {
      if (selection.has(node) === false) {
        // node is selected
        node.state
        node.div?.classList.add('selected')
        node.state.selected = true
      }
    }

    this.#private.selection = newSelection
    options.onSelectionChange?.([...newSelection].map(n => n.value!))
  }
}