import { allSvgs } from './all'

const create = (() => {
  let factoryDiv = null as HTMLDivElement | null
  return (svgStr: string) => {
    if (!factoryDiv) {
      factoryDiv = document.createElement('div')
      factoryDiv.style.display = 'none'
      document.body.appendChild(factoryDiv)
    }
    factoryDiv.innerHTML = svgStr
    const svg = factoryDiv.firstElementChild as SVGSVGElement
    if (!svg)
      throw new Error('SVG element not found in the provided SVG string')
    return svg
  }
})()

const defaultProps = {
  width: null as number | null,
  height: null as number | null,
}

export function createSvg(
  name: keyof typeof allSvgs,
  props: Partial<typeof defaultProps> = {},
): SVGSVGElement {
  const svgStr = allSvgs[name]

  if (!svgStr)
    throw new Error(`SVG with name "${name}" not found`)

  const svg = create(svgStr)

  const { width, height } = { ...defaultProps, ...props }

  if (width === null)
    svg.removeAttribute('width')
  else
    svg.setAttribute('width', String(width))

  if (height === null)
    svg.removeAttribute('height')
  else
    svg.setAttribute('height', String(height))

  return svg
}