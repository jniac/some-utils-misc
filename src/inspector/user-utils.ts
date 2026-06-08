
export const positionMeta = `
  vector(x,y,z)
  precision(2)
  widget(translate-3d)
`

export const rotationMeta = `
  vector(x,y,z)
  slider(-PI, PI, 1 / 180 * PI)
  slider-fill(none)
  remap(to-degrees)
  precision(1)
  widget(rotate-3d)
`
