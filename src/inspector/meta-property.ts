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

export type RawMetaPropertyBase = {
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

export type RawMetaProperty<T = any> = RawMetaPropertyBase & {
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
  value: T
}

export type RawMetaPropertyAsArray<T> = [value: T, meta: RawMetaPropertyBase]

export class MetaProperty<T = any> implements RawMetaProperty<T> {
  static button(key: string, callback: () => void): MetaProperty {
    return new MetaProperty({
      key,
      value: callback,
      type: `button`,
    })
  }

  static spacer(size = 0.5): MetaProperty {
    return new MetaProperty({
      key: 'spacer',
      value: size,
      type: 'spacer',
    })
  }

  value: T

  key: string
  path?: string
  order?: number

  type: string
  description?: string

  constructor(props: RawMetaProperty<T>) {
    const {
      value,
      key,
      path,
      order,
      type,
      description,
    } = props

    this.value = value

    this.key = key
    this.path = path
    this.order = order

    this.type = type
    this.description = description
  }

  /**
   * Returns a clone of the default value.
   */
  cloneValue(): T {
    if (isObject(this.value)) {
      if ('clone' in this.value)
        return (this.value as any).clone()

      if (this.value.constructor === Object)
        return { ...this.value }

      throw new Error(`Cannot clone value of type ${typeof this.value}`)
    }

    return this.value
  }
}

function isRawMetaPropertyBase(value: any): value is RawMetaPropertyBase {
  return isObject(value)
    && 'type' in value
    && typeof value.type === 'string'
}

export function isRawMetaProperty<T>(value: any): value is RawMetaProperty<T> {
  return isRawMetaPropertyBase(value)
    && 'key' in value
    && 'value' in value
    && 'type' in value
}

export function isRawMetaPropertyAsArray<T>(value: any): value is RawMetaPropertyAsArray<T> {
  return Array.isArray(value)
    && value.length === 2
    && isRawMetaPropertyBase(value[1])
}

export type InspectorMetaEntry<T = any> =
  | Omit<RawMetaProperty<T>, 'key' | 'type'> // Allow omitting key and type, as they can be inferred from the object context / or the value itself
  | RawMetaPropertyAsArray<T>
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
