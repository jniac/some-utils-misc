import { isObject } from 'some-utils-ts/object/common'

/**
 * Splits a path string into its individual tokens.
 */
export function splitMetaPath(path?: string): string[] {
  if (!path)
    return []
  const pathSeparator = /\s*[\.\:\/]\s*/
  return path
    .split(pathSeparator)
    .map(token => token.trim())
}

export type RawMetaProperty<T = any> = {
  /**
 * Key of the property. Meant to be unique within the context of the object.
 * 
 * This is used to infer the display name in the inspector (e.g., `meshScale` becomes "Mesh Scale").
 */
  key: string

  /**
   * Default value of the property.
   * 
   * This is used to initialize the property in the inspector and can be overridden by user input or other means.
   */
  defaultValue: T

  /**
   * Type of the property, defined using a simple DSL (Domain-Specific Language).
   * 
   * eg:
   * - `'number integer range(0, 100)'`
   * - `'vector(xyz) slider(0, 10, 0.1) precision(2)'`.
   */
  type: string

  /**
   * Human-readable description for the property, shown in the inspector.
   */
  description?: string

  /**
   * Order of the property in the inspector.
   * 
   * This is used to determine the order of properties in the inspector.
   * 
   * By default, the order is determined by the order of properties in the object at registration time.
   */
  order?: number

  /**
   * Path to the property in the object.
   * 
   * This is used to group properties under a common path in the inspector.
   * 
   * For example, `ball/ballOffset` would be grouped under "Ball" in the inspector.
   */
  path?: string
}

export class MetaProperty<T = any> implements RawMetaProperty<T> {
  static button(key: string, callback: () => void): MetaProperty {
    return new MetaProperty({
      key,
      defaultValue: callback,
      type: `button`,
    })
  }

  static spacer(size = 0.5): MetaProperty {
    return new MetaProperty({
      key: 'spacer',
      defaultValue: size,
      type: 'spacer',
    })
  }

  defaultValue: T

  key: string
  path?: string
  order?: number

  type: string
  description?: string

  constructor(props: RawMetaProperty<T>) {
    const {
      defaultValue,
      key,
      path,
      order,
      type: metaType,
      description,
    } = props

    this.defaultValue = defaultValue

    this.key = key
    this.path = path
    this.order = order

    this.type = metaType
    this.description = description
  }

  /**
   * Returns a clone of the default value.
   */
  cloneValue(): T {
    if (isObject(this.defaultValue)) {
      if ('clone' in this.defaultValue)
        return (this.defaultValue as any).clone()

      if (this.defaultValue.constructor === Object)
        return { ...this.defaultValue }

      throw new Error(`Cannot clone value of type ${typeof this.defaultValue}`)
    }

    return this.defaultValue
  }
}

export function isRawMetaProperty<T>(value: any): value is RawMetaProperty<T> {
  return (
    value
    && typeof value === 'object'
    && 'key' in value
    && 'defaultValue' in value
    && 'metaType' in value
  )
}

export type InspectorMetaEntry<T = any> =
  | RawMetaProperty<T>
  | (() => void)


/**
 * Represents a collection of inspector entries.
 */
export type InspectorMetaObject = Record<string, InspectorMetaEntry>

/**
 * Represents a collection of inspector entries with string keys.
 */
export type InspectorFlatMetaObject<T> = {
  [K in keyof T]: T[K] extends RawMetaProperty<infer V> ? V : never
}

/**
 * Represents a serialized object for the inspector.
 * 
 * This is used to serialize the properties of an object for the inspector.
 */
export type InspectorSerializedMetaObject<T> = {
  [K in keyof T]: T[K] extends { toArray: (...args: any[]) => infer R } ? R : T[K]
}

