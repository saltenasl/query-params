import { describe, it, expect } from 'vitest'
import { encodeWithHeader, decodeWithHeader } from './format.js'

describe('2-byte Header Format', () => {
  it('should encode and decode version 1', () => {
    const payload = new Uint8Array([1, 2, 3, 4])
    const encoded = encodeWithHeader(payload, 1, { compressed: false })
    const decoded = decodeWithHeader(encoded)

    expect(decoded.version).toBe(1)
    expect(decoded.compressed).toBe(false)
    expect(decoded.payload).toEqual(payload)
  })

  it('should encode and decode version 1023 (max 10-bit)', () => {
    const payload = new Uint8Array([1, 2, 3])
    const encoded = encodeWithHeader(payload, 1023, { compressed: true })
    const decoded = decodeWithHeader(encoded)

    expect(decoded.version).toBe(1023)
    expect(decoded.compressed).toBe(true)
    expect(decoded.payload).toEqual(payload)
  })

  it('should encode compression flag', () => {
    const payload = new Uint8Array([1])

    const uncompressed = encodeWithHeader(payload, 5, { compressed: false })
    const compressed = encodeWithHeader(payload, 5, { compressed: true })

    const decodedUncompressed = decodeWithHeader(uncompressed)
    const decodedCompressed = decodeWithHeader(compressed)

    expect(decodedUncompressed.version).toBe(5)
    expect(decodedUncompressed.compressed).toBe(false)

    expect(decodedCompressed.version).toBe(5)
    expect(decodedCompressed.compressed).toBe(true)
  })

  it('should encode optimization flags', () => {
    const payload = new Uint8Array([1, 2])

    const encoded = encodeWithHeader(payload, 42, {
      compressed: true,
      stringDictionary: true,
      booleanPacking: true
    })

    const decoded = decodeWithHeader(encoded)

    expect(decoded.version).toBe(42)
    expect(decoded.compressed).toBe(true)
    expect(decoded.stringDictionary).toBe(true)
    expect(decoded.booleanPacking).toBe(true)
  })

  it('should independently toggle each flag', () => {
    const payload = new Uint8Array([1])

    // Just compression
    const encoded1 = encodeWithHeader(payload, 10, {
      compressed: true,
      stringDictionary: false,
      booleanPacking: false
    })
    const decoded1 = decodeWithHeader(encoded1)
    expect(decoded1.compressed).toBe(true)
    expect(decoded1.stringDictionary).toBe(false)
    expect(decoded1.booleanPacking).toBe(false)

    // Just string dictionary
    const encoded2 = encodeWithHeader(payload, 10, {
      compressed: false,
      stringDictionary: true,
      booleanPacking: false
    })
    const decoded2 = decodeWithHeader(encoded2)
    expect(decoded2.compressed).toBe(false)
    expect(decoded2.stringDictionary).toBe(true)
    expect(decoded2.booleanPacking).toBe(false)

    // Just boolean packing
    const encoded3 = encodeWithHeader(payload, 10, {
      compressed: false,
      stringDictionary: false,
      booleanPacking: true
    })
    const decoded3 = decodeWithHeader(encoded3)
    expect(decoded3.compressed).toBe(false)
    expect(decoded3.stringDictionary).toBe(false)
    expect(decoded3.booleanPacking).toBe(true)
  })

  it('should handle version across bit boundary', () => {
    // Version 64 = 0b0001000000 (bit 6 set)
    // This tests the split between byte0 (bits 0-5) and byte1 (bits 6-9)
    const payload = new Uint8Array([1])

    const encoded = encodeWithHeader(payload, 64, { compressed: false })
    const decoded = decodeWithHeader(encoded)

    expect(decoded.version).toBe(64)
  })

  it('should preserve version and flags together', () => {
    const payload = new Uint8Array([5, 6, 7])

    // Test various version + flag combinations
    const testCases = [
      { version: 0, compressed: false, stringDictionary: false, booleanPacking: false },
      { version: 1, compressed: true, stringDictionary: false, booleanPacking: false },
      { version: 63, compressed: false, stringDictionary: true, booleanPacking: false },
      { version: 64, compressed: true, stringDictionary: false, booleanPacking: true },
      { version: 127, compressed: false, stringDictionary: true, booleanPacking: true },
      { version: 512, compressed: true, stringDictionary: true, booleanPacking: false },
      { version: 1023, compressed: true, stringDictionary: true, booleanPacking: true }
    ]

    for (const testCase of testCases) {
      const encoded = encodeWithHeader(payload, testCase.version, testCase)
      const decoded = decodeWithHeader(encoded)

      expect(decoded.version).toBe(testCase.version)
      expect(decoded.compressed).toBe(testCase.compressed)
      expect(decoded.stringDictionary).toBe(testCase.stringDictionary)
      expect(decoded.booleanPacking).toBe(testCase.booleanPacking)
      expect(decoded.payload).toEqual(payload)
    }
  })

  it('should throw for version > 1023', () => {
    const payload = new Uint8Array([1])

    expect(() => {
      encodeWithHeader(payload, 1024, { compressed: false })
    }).toThrow('Version must be 0-1023')

    expect(() => {
      encodeWithHeader(payload, -1, { compressed: false })
    }).toThrow('Version must be 0-1023')
  })

  it('should use exactly 2 bytes for header', () => {
    const payload = new Uint8Array([1, 2, 3])

    const encoded = encodeWithHeader(payload, 123, {
      compressed: true,
      stringDictionary: true,
      booleanPacking: true
    })

    // Header (2 bytes) + payload (3 bytes) = 5 bytes total
    expect(encoded.length).toBe(5)
  })

  it('should be deterministic', () => {
    const payload = new Uint8Array([10, 20, 30])

    const encoded1 = encodeWithHeader(payload, 456, {
      compressed: true,
      stringDictionary: false,
      booleanPacking: true
    })

    const encoded2 = encodeWithHeader(payload, 456, {
      compressed: true,
      stringDictionary: false,
      booleanPacking: true
    })

    // Should produce identical bytes
    expect(Array.from(encoded1)).toEqual(Array.from(encoded2))
  })
})
