
/**
 * Turn a string of meta tokens into an array of objects.
 * 
 * Note:
 * - The first token is always the "type".
 * 
 * "number slider(1, 100) integer clamped middle(10)"
 * ```
 * {
 *   type: ['number'],
 *   slider: ['1', '100'],
 *   integer: [],
 *   clamped: [],
 *   middle: ['10'],
 * }
 * ```
 */
export function parseMetaTokens(input: string) {
  const regex = /([a-zA-Z_][a-zA-Z0-9_-]*)\s*(?:\(([^)]*)\))?/g

  const matches = Array.from(input.matchAll(regex))

  const result: Record<string, string[]> = {}

  matches.forEach(([, token, rawArgs], index) => {
    const args = rawArgs
      ? rawArgs.split(',').map(arg => arg.trim())
      : []
    if (index === 0) {
      result.type = [token] // ✅ first token is always the type
      result.typeArgs = args // store type args separately
    } else {
      result[token] = args
    }
  })

  return result
}
