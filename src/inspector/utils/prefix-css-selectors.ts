/**
 * Prefix CSS selectors in a given CSS string with a specified prefix.
 * 
 * This is useful for namespacing styles in a modular CSS architecture.
 * 
 * Note:
 * - Prefixing is done only for selectors that DO NOT already start with the prefix.
 */
export function prefixCssSelectors(rawCss: string, prefix: string): string {
  return rawCss.replace(/([^{\n]+)(\{)/g, (match, selectors: string, brace: string) => {
    const prefixedSelectors = selectors
      .split(',')
      .map(selector => {
        if (selector.trim().startsWith(prefix))
          return `${selector.trim()} ` // Already prefixed, return as is

        return `${prefix} ${selector.trim()} `
      })
      .join(', ')
    return `${prefixedSelectors}${brace}`
  })
}
