import { describe, expect, test } from 'vitest'
import { Timeline } from './timeline'

describe('Timeline Tests', () => {
  test('basic', () => {
    {
      const timeline = new Timeline()
      timeline.add({ name: 'test-node', size: 100, type: 'block' })

      expect(timeline.childCount()).toBe(2) // 1 head + 1 test-node
      expect(timeline.regularChildCount()).toBe(1)

      timeline.compute()

      expect(timeline.size).toBe(100)
    }

    {
      const timeline = new Timeline({ gap: 10 })
      timeline.add({ name: 'test-node', size: 100, type: 'block' })
      timeline.add({ name: 'test-node-2', size: 200, type: 'block' })

      expect(timeline.childCount()).toBe(3) // 1 head + 2 test-nodes
      expect(timeline.regularChildCount()).toBe(2)

      timeline.compute()

      expect(timeline.size).toBe(310)

      const [head, node1, node2] = timeline.children()
      expect(node1.start).toBe(0)
      expect(node1.end).toBe(100)
      expect(node2.start).toBe(110)
      expect(node2.end).toBe(310)
    }
  })
})

