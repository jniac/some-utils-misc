import { parseMetaTokens } from '../../utils/parse-meta-tokens'
import { safeEvaluate } from '../../utils/safe-evaluate'

/**
 * A class representing a meta field in the inspector.
 *
 * Note:
 * - Do not confuse with `MetaProperty` which represents the metadata of a property
 *   (a property may have zero, one or more fields)
 */

export class MetaField {
  static parse(arg: string): MetaField {
    const { type, typeArgs, ...props } = parseMetaTokens(arg)
    return new MetaField(type[0], typeArgs, props)
  }

  static infer(arg: string | undefined, value: any): MetaField {
    return (arg
      ? MetaField.parse(arg)
      : new MetaField(typeof value, [], {})
    )
  }

  type: string
  typeArgs: string[]
  rawProps: Record<string, string[]>

  constructor(type: string, typeArgs: string[], rawProps: Record<string, string[]> = {}) {
    this.type = type
    this.typeArgs = typeArgs
    this.rawProps = rawProps
  }

  has(prop: string): boolean {
    return this.rawProps.hasOwnProperty(prop)
  }

  argsOf(prop: string): string[] {
    return this.rawProps[prop] ?? []
  }

  /**
   * Convenience method to get a numeric argument from the raw properties.
   * If the argument is not present, it returns the provided default value.
   */
  numericArgOf(prop: string, { index = 0, defaultValue = 0 } = {}): number {
    const args = this.argsOf(prop)
    return args[index] !== undefined ? safeEvaluate(args[index]) : defaultValue
  }
}
