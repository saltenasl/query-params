/**
 * Dictionary compression for repeated strings
 *
 * This is deterministic - the order of strings in the dictionary is based on:
 * 1. Order of appearance in the data (DFS traversal)
 * 2. Schema field order (guarantees consistency)
 *
 * Same schema + same data = same encoding on FE and BE
 */

export interface StringDictionary {
  /** Map from string to index */
  stringToIndex: Map<string, number>
  /** Array of unique strings (index -> string) */
  strings: string[]
}

/**
 * Build a dictionary from data by traversing in deterministic order
 * Uses depth-first search following object key order
 */
export function buildStringDictionary(data: unknown, minLength = 3): StringDictionary {
  const stringToIndex = new Map<string, number>()
  const strings: string[] = []
  const seen = new Set<unknown>()

  function traverse(value: unknown): void {
    // Prevent circular references
    if (value && typeof value === 'object') {
      if (seen.has(value)) return
      seen.add(value)
    }

    if (typeof value === 'string') {
      // Only dictionary-encode strings >= minLength
      // Short strings (1-2 chars) are more efficient as-is
      if (value.length >= minLength && !stringToIndex.has(value)) {
        const index = strings.length
        stringToIndex.set(value, index)
        strings.push(value)
      }
    } else if (Array.isArray(value)) {
      // Traverse array in order
      for (const item of value) {
        traverse(item)
      }
    } else if (value && typeof value === 'object') {
      // Traverse object in key order (deterministic)
      const keys = Object.keys(value).sort()
      for (const key of keys) {
        traverse(key) // Key itself might be a string we want to encode
        traverse((value as Record<string, unknown>)[key])
      }
    }
  }

  traverse(data)

  return { stringToIndex, strings }
}

/**
 * Replace strings in data with dictionary indices
 * Returns modified data structure where strings are replaced with references
 */
export function applyStringDictionary(
  data: unknown,
  dictionary: StringDictionary,
  minLength = 3
): unknown {
  const seen = new Set<unknown>()

  function replace(value: unknown): unknown {
    // Prevent circular references
    if (value && typeof value === 'object') {
      if (seen.has(value)) return value
      seen.add(value)
    }

    if (typeof value === 'string') {
      if (value.length >= minLength && dictionary.stringToIndex.has(value)) {
        // Replace with reference: { __ref: index }
        return { __ref: dictionary.stringToIndex.get(value) }
      }
      return value
    } else if (Array.isArray(value)) {
      return value.map(item => replace(item))
    } else if (value && typeof value === 'object') {
      const result: Record<string, unknown> = {}
      for (const [key, val] of Object.entries(value)) {
        result[key] = replace(val)
      }
      return result
    }

    return value
  }

  return replace(data)
}

/**
 * Restore strings from dictionary indices
 */
export function restoreStringDictionary(
  data: unknown,
  strings: string[]
): unknown {
  const seen = new Set<unknown>()

  function restore(value: unknown): unknown {
    // Prevent circular references
    if (value && typeof value === 'object') {
      if (seen.has(value)) return value
      seen.add(value)
    }

    // Check if this is a string reference
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      '__ref' in value &&
      typeof (value as { __ref: unknown }).__ref === 'number'
    ) {
      const index = (value as { __ref: number }).__ref
      if (index >= 0 && index < strings.length) {
        return strings[index]
      }
      throw new Error(`Invalid string reference: ${index}`)
    }

    if (Array.isArray(value)) {
      return value.map(item => restore(item))
    } else if (value && typeof value === 'object') {
      const result: Record<string, unknown> = {}
      for (const [key, val] of Object.entries(value)) {
        result[key] = restore(val)
      }
      return result
    }

    return value
  }

  return restore(data)
}

/**
 * Calculate if dictionary compression would save space
 */
export function shouldUseDictionary(
  data: unknown,
  dictionary: StringDictionary,
  minLength = 3
): boolean {
  // Calculate original size (sum of all string lengths >= minLength)
  let originalSize = 0
  let referenceCount = 0

  function countStrings(value: unknown): void {
    if (typeof value === 'string' && value.length >= minLength) {
      originalSize += value.length
      if (dictionary.stringToIndex.has(value)) {
        referenceCount++
      }
    } else if (Array.isArray(value)) {
      value.forEach(countStrings)
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(countStrings)
    }
  }

  countStrings(data)

  // Dictionary overhead:
  // - Dictionary header: ~2 bytes
  // - Each unique string: length + 1 (varint for length)
  // - Each reference: ~2 bytes (average)
  const dictionarySize = dictionary.strings.reduce((sum, s) => sum + s.length + 1, 0)
  const referencesSize = referenceCount * 2
  const overhead = 2

  const compressedSize = dictionarySize + referencesSize + overhead

  // Only use dictionary if we save at least 10% of original size
  return compressedSize < originalSize * 0.9
}
