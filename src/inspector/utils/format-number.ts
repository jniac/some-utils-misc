/**
 * Formats a number to a string with a specified precision.
 * 
 * Main goal: prevent floating point precision issues by formatting numbers
 * to a fixed number of decimal places (eg: 4.199999999999999 -> 4.2).
 */
export function formatNumber(value: number, options: { precision?: number } = {}): string {
  const { precision = 12 } = options

  if (Number.isNaN(value))
    return 'NaN'

  if (value === Infinity)
    return '+Infinity'

  if (value === -Infinity)
    return '-Infinity'

  // Format the number with the specified precision
  return Number.parseFloat(value.toFixed(precision)).toString()
}
