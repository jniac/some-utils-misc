import { Node } from './node'
import { NodeType } from './node-type'

type Point = { x: number; y: number }

const settings = {
  horizontalScale: 1,
  childrenGap: 80,
  color: 'currentColor',
  headColor: undefined as string | undefined,
}

let horizontalScale = settings.horizontalScale
let childrenGap = settings.childrenGap
let color = settings.color
let headColor = settings.headColor ?? settings.color
let currentY = 0

function nodeYOffset(node: Node): number {
  switch (node.props.type) {
    case NodeType.absolute:
      return 0
    default:
      return 24
  }
}

function nodeColor(node: Node): string {
  if (node.isHead) {
    return headColor
  }
  return color
}

function hs(value: number): number {
  return value * horizontalScale
}

function childrenSeparator(root: Node): string {
  const y = currentY - childrenGap / 2
  const dashArray = `${12} ${6}`
  return `<line x1="${hs(root.start)}" y1="${y}" x2="${hs(root.end)}" y2="${y}" stroke="${color}" stroke-dasharray="${dashArray}" opacity=".5" />`
}

function rhombusPathData(x: number, y: number, size: number): string {
  const halfSize = size / 2
  return `M ${x - halfSize},${y} L ${x},${y - halfSize} L ${x + halfSize},${y} L ${x},${y + halfSize} Z`
}

function nodeSegment(node: Node): string {
  const y = currentY + nodeYOffset(node)
  const t = NodeType[node.props.type].slice(0, 1).toLowerCase()
  const c = nodeColor(node)
  return `
    <path d="${rhombusPathData(hs(node.center), y, 5)}" fill="${c}" />
    <line x1="${hs(node.start)}" y1="${y - 8}" x2="${hs(node.start)}" y2="${y + 8}" stroke="${c}" stroke-width="1" />
    <line x1="${hs(node.end)}" y1="${y - 8}" x2="${hs(node.end)}" y2="${y + 8}" stroke="${c}" stroke-width="1" />
    ${node.size > 0
      ? `
        <line x1="${hs(node.start)}" y1="${y}" x2="${hs(node.end)}" y2="${y}" stroke="${c}" stroke-width="16" opacity=".1" />
        <line x1="${hs(node.start)}" y1="${y}" x2="${hs(node.end)}" y2="${y}" stroke="${c}" stroke-width="1" />
      `
      : ``
    }
    <text x="${hs(node.center)}" y="${y - 14}" text-anchor="middle" font-size="10" fill="${c}">${node.name} (${t})</text>
  `
}

function bezierPathData(p0: Point, p1: Point, p2: Point, p3: Point): string {
  return `M ${p0.x},${p0.y} C ${p1.x},${p1.y}, ${p2.x},${p2.y}, ${p3.x},${p3.y}`
}

export type ToInnerSvgStringOptions = Partial<typeof settings>

export function toGraphSvgString(root: Node, options?: ToInnerSvgStringOptions) {
  const safeOptions = { ...settings, ...options }
  horizontalScale = safeOptions.horizontalScale
  childrenGap = safeOptions.childrenGap
  color = safeOptions.color
  headColor = safeOptions.headColor ?? settings.color

  currentY = 24

  const chunks = [nodeSegment(root)]
  let children = [...root.children()]
  let nextChildren: Node[] = []
  while (children.length > 0) {
    currentY += childrenGap

    chunks.push(childrenSeparator(root))

    for (const child of children) {
      const { center } = child
      const parentY = currentY - childrenGap + nodeYOffset(child.parent!)
      const childY = currentY + nodeYOffset(child)
      const p0 = { x: hs(child.parent!.center), y: parentY }
      const p1 = { x: hs(child.parent!.center), y: parentY + childrenGap / 2 }
      const p2 = { x: hs(center), y: childY - childrenGap / 2 }
      const p3 = { x: hs(center), y: childY }
      chunks.push(
        nodeSegment(child),
        `<path d="${bezierPathData(p0, p1, p2, p3)}" fill="none" stroke="${nodeColor(child)}" stroke-width="1" />`,
      )
      nextChildren.push(...child.children())
    }

    children = nextChildren
    nextChildren = []
  }

  return {
    height: currentY + 24,
    string: chunks.join('\n'),
  }
}

