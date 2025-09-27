import { evaluate } from 'mathjs'

/**
 * Safely evaluates (mathjs) a value and returns a number.
 * 
 * The value can be:
 * - already a number
 * - a string that can be evaluated to a number, including expressions:
 *   - "2 + 2"
 *   - "sqrt(16)"
 *   - "2 * PI"
 * - undefined or null, which will return 0
 */
export function safeEvaluate(value: any): number {
  if (value === undefined || value === null)
    return 0

  switch (typeof value) {
    case 'number':
      return value

    case 'string':
      const parsed = evaluate(value)
      return Number.isNaN(parsed) ? 0 : parsed

    default:
      return 0
  }
}
