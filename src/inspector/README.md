## Note

Mini DSL (Domain Specific Language) for inspector fields:

Types:
- `string`
- `number`
- `vector(x,y,z)`
  - subkeys are listed between parentheses

Modifiers:
- `remap(inMin, inMax, outMin, outMax)`
  - remap input range to output range
  - `remap(to-degrees)` or `remap(to-radians)` for common conversions
- `widget(rotate)`
- `slider(min, max, step)`
- `modifierScale(scale)`
  - scale the value by a factor when a modifier is pressed (shift -> scale, alt -> 1/scale)

## Dependencies
- `some-utils-ts` for utilities like `DestroyableObject`
- `mathjs` for mathematical operations
