export class MultiMap<Key, Value> {
  #map = new Map<Key, Set<Value>>()

  add(key: Key, value: Value): void {
    let set = this.#map.get(key)

    if (!set) {
      set = new Set<Value>()
      this.#map.set(key, set)
    }

    set.add(value)
  }

  /**
   * Deletes a value from a key.
   * Returns:
   * - 1 if the value was removed
   * - 0 if nothing was removed
   */
  delete(key: Key, value: Value): number {
    const set = this.#map.get(key)
    if (!set) return 0

    const existed = set.delete(value)

    // Clean up empty sets (important)
    if (set.size === 0) {
      this.#map.delete(key)
    }

    return existed ? 1 : 0
  }

  clear(): void {
    this.#map.clear()
  }

  // --- Optional but VERY useful helpers ---

  get(key: Key): Iterable<Value> {
    return this.#map.get(key) ?? []
  }

  has(key: Key, value: Value): boolean {
    return this.#map.get(key)?.has(value) ?? false
  }

  deleteKey(key: Key): boolean {
    return this.#map.delete(key)
  }

  keys(): IterableIterator<Key> {
    return this.#map.keys()
  }

  values(): IterableIterator<Set<Value>> {
    return this.#map.values()
  }

  entries(): IterableIterator<[Key, Set<Value>]> {
    return this.#map.entries()
  }

  get size(): number {
    return this.#map.size
  }
}

export class ListenerMap<Event extends string, Value> extends MultiMap<Event, (value: Value) => void> {
  on(event: Event, listener: (value: Value) => void): { destroy: () => void } {
    this.add(event, listener)
    return {
      destroy: () => {
        this.delete(event, listener)
      }
    }
  }

  call(event: Event, value: Value): void {
    for (const listener of this.get(event))
      listener(value)
  }
}