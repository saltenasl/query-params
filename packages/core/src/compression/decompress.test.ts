import { describe, it, expect } from 'vitest'
import { compress } from './compress'
import { decompress } from './decompress'
import { CompressionError } from '../errors'

describe('decompress()', () => {
  it('should decompress data compressed by compress()', () => {
    const original = new TextEncoder().encode('Hello, World! This is a test.')
    const compressed = compress(original)
    const decompressed = decompress(compressed)
    
    expect(decompressed).toEqual(original)
  })

  it('should handle empty compressed data', () => {
    const original = new Uint8Array(0)
    const compressed = compress(original)
    const decompressed = decompress(compressed)
    
    expect(decompressed).toEqual(original)
  })

  it('should handle small compressed data', () => {
    const original = new TextEncoder().encode('Hi')
    const compressed = compress(original)
    const decompressed = decompress(compressed)
    
    expect(decompressed).toEqual(original)
  })

  it('should handle large compressed data', () => {
    const largeString = 'Lorem ipsum dolor sit amet. '.repeat(1000)
    const original = new TextEncoder().encode(largeString)
    const compressed = compress(original)
    const decompressed = decompress(compressed)
    
    expect(decompressed).toEqual(original)
  })

  it('should handle binary data round-trip', () => {
    const original = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 255, 254, 253])
    const compressed = compress(original)
    const decompressed = decompress(compressed)
    
    expect(decompressed).toEqual(original)
  })

  it('should handle unicode text', () => {
    const original = new TextEncoder().encode('Hello 世界 🌍 Привет')
    const compressed = compress(original)
    const decompressed = decompress(compressed)
    
    expect(decompressed).toEqual(original)
    
    // Verify the text is still correct
    const text = new TextDecoder().decode(decompressed)
    expect(text).toBe('Hello 世界 🌍 Привет')
  })

  it('should throw CompressionError for invalid compressed data', () => {
    const invalidData = new Uint8Array([1, 2, 3, 4, 5])
    
    expect(() => decompress(invalidData)).toThrow(CompressionError)
    expect(() => decompress(invalidData)).toThrow('Decompression failed')
  })

  it('should throw CompressionError for corrupted data', () => {
    const original = new TextEncoder().encode('Test data')
    const compressed = compress(original)
    
    // Corrupt the data by modifying it
    const corrupted = new Uint8Array(compressed)
    corrupted[0] = 255
    corrupted[1] = 255
    
    expect(() => decompress(corrupted)).toThrow(CompressionError)
  })

  it('should preserve data integrity through multiple round-trips', () => {
    const original = new TextEncoder().encode('Round-trip test data')

    // First round-trip
    let compressed = compress(original)
    let decompressed = decompress(compressed)
    expect(decompressed).toEqual(original)

    // Second round-trip
    compressed = compress(decompressed)
    decompressed = decompress(compressed)
    expect(decompressed).toEqual(original)
  })
})
