import { describe, it, expect } from 'vitest'
import {
  buildStringDictionary,
  applyStringDictionary,
  restoreStringDictionary,
  shouldUseDictionary
} from './string-dictionary.js'

describe('String Dictionary Compression', () => {
  it('should build dictionary in deterministic order', () => {
    const data = {
      name: 'electronics',
      category: 'electronics',
      tags: ['electronics', 'computers', 'electronics']
    }

    // Build dictionary multiple times
    const dict1 = buildStringDictionary(data)
    const dict2 = buildStringDictionary(data)
    const dict3 = buildStringDictionary(data)

    // Should produce same dictionary every time
    expect(dict1.strings).toEqual(dict2.strings)
    expect(dict2.strings).toEqual(dict3.strings)
    expect(dict1.strings).toEqual(['category', 'electronics', 'name', 'tags', 'computers'])
  })

  it('should compress repeated strings', () => {
    const data = {
      search: 'laptop',
      categories: ['electronics', 'computers'],
      tags: ['electronics', 'computers', 'electronics']
    }

    const dictionary = buildStringDictionary(data)
    const compressed = applyStringDictionary(data, dictionary)

    // 'electronics' appears 3 times, 'computers' appears 2 times
    expect(dictionary.strings).toContain('electronics')
    expect(dictionary.strings).toContain('computers')

    // Compressed data should have references
    const compressedStr = JSON.stringify(compressed)
    expect(compressedStr).toContain('__ref')
  })

  it('should restore original data', () => {
    const original = {
      search: 'laptop',
      categories: ['electronics', 'computers'],
      tags: ['electronics', 'computers', 'electronics'],
      brand: 'Dell'
    }

    const dictionary = buildStringDictionary(original)
    const compressed = applyStringDictionary(original, dictionary)
    const restored = restoreStringDictionary(compressed, dictionary.strings)

    expect(restored).toEqual(original)
  })

  it('should not compress short strings', () => {
    const data = {
      a: 'ab',
      b: 'ab',
      c: 'ab'
    }

    const dictionary = buildStringDictionary(data, 3)
    // 'ab' is only 2 chars, below minLength=3
    expect(dictionary.strings).not.toContain('ab')
  })

  it('should be deterministic across multiple runs', () => {
    const data = {
      user: {
        name: 'John',
        email: 'john@example.com'
      },
      filters: ['active', 'verified', 'active'],
      status: 'active'
    }

    const results = []
    for (let i = 0; i < 10; i++) {
      const dict = buildStringDictionary(data)
      const compressed = applyStringDictionary(data, dict)
      results.push(JSON.stringify(compressed))
    }

    // All 10 runs should produce identical output
    const first = results[0]
    for (const result of results) {
      expect(result).toBe(first)
    }
  })

  it('should correctly calculate savings', () => {
    // Case 1: Many repeated strings - should use dictionary
    const data1 = {
      items: [
        { type: 'electronics', name: 'electronics' },
        { type: 'electronics', name: 'electronics' },
        { type: 'electronics', name: 'electronics' }
      ]
    }
    const dict1 = buildStringDictionary(data1)
    expect(shouldUseDictionary(data1, dict1)).toBe(true)

    // Case 2: Few unique strings with no repetition - should not use dictionary
    const data2 = {
      a: 'unique1',
      b: 'unique2',
      c: 'unique3'
    }
    const dict2 = buildStringDictionary(data2)
    expect(shouldUseDictionary(data2, dict2)).toBe(false)
  })

  it('should handle nested objects deterministically', () => {
    const data = {
      level1: {
        level2: {
          value: 'repeated',
          other: 'repeated'
        }
      },
      array: ['repeated', 'unique', 'repeated']
    }

    const dict1 = buildStringDictionary(data)
    const dict2 = buildStringDictionary(data)

    expect(dict1.strings).toEqual(dict2.strings)

    const compressed = applyStringDictionary(data, dict1)
    const restored = restoreStringDictionary(compressed, dict1.strings)

    expect(restored).toEqual(data)
  })

  it('should handle empty objects and arrays', () => {
    const data = {
      empty: {},
      emptyArray: [],
      value: 'test'
    }

    const dict = buildStringDictionary(data)
    const compressed = applyStringDictionary(data, dict)
    const restored = restoreStringDictionary(compressed, dict.strings)

    expect(restored).toEqual(data)
  })
})
