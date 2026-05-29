import { TreeNode } from 'some-utils-ts/experimental/layout/flex/TreeNode'

import css from './hierarchy.css'

type HierarchyNodeState = {
  expanded: boolean
  selected: boolean
}

class HierarchyNode<T = any> extends TreeNode {
  value: T | null = null
  div: HTMLDivElement = null!
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
      sizeObserver.disconnect()
      this.#private.destroyed = true
    }

    this.#private = {
      tree,
      destroy,
      destroyed: false,
      options,
      selection: new Set<HierarchyNode<T>>(),
    }

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
        toggle.addEventListener('click', () => {
          node.state.expanded = !node.state.expanded
          this.#build()
        })
      } else {
        toggle.classList.add('empty')
      }
      div.append(toggle)

      const name = document.createElement('div')
      name.textContent = extractName(node.value)
      div.append(name)

      if (node.state.expanded === false) {
        const count = document.createElement('div')
        count.classList.add('count')
        count.textContent = `(${node.leavesCount()})`
        div.append(count)
      }

      div.onclick = event => {
        if (event.target === toggle)
          return

        const { selection } = this.#private
        const newSelection = new Set<HierarchyNode<T>>()

        if (event.shiftKey) {
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
            node.div.classList.remove('selected')
            node.state.selected = false
          }
        }
        for (const node of newSelection) {
          if (selection.has(node) === false) {
            // node is selected
            node.state
            node.div.classList.add('selected')
            node.state.selected = true
          }
        }

        this.#private.selection = newSelection
        options.onSelectionChange?.([...newSelection].map(n => n.value!))

        event.preventDefault()
      }

      return div
    }))

    if (options.cacheKey) {
      const states: Record<string, HierarchyNodeState> = {}
      for (const node of tree.flat()) {
        states[node.tid] = node.state
        if (node.state.selected) {
          node.div.classList.add('selected')
          this.#private.selection.add(node)
        }
      }
      if (this.#private.selection.size > 0) {
        options.onSelectionChange?.([...this.#private.selection].map(n => n.value!))
      }
      localStorage.setItem(options.cacheKey, JSON.stringify(states))
    }
  }
}