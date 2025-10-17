import { describe, it, expect } from 'vitest'
import { compress } from './compress'

describe('compress()', () => {
  it('should compress data in Node.js environment', () => {
    const input = new TextEncoder().encode('Hello, World! This is a test string that should compress well because it has repetition. repetition. repetition.')
    const compressed = compress(input)
    
    // Compressed data should be a Uint8Array
    expect(compressed).toBeInstanceOf(Uint8Array)
    
    // Compressed data should be smaller than input (for this test string)
    expect(compressed.length).toBeLessThan(input.length)
  })

  it('should handle empty input', () => {
    const input = new Uint8Array(0)
    const compressed = compress(input)
    
    expect(compressed).toBeInstanceOf(Uint8Array)
  })

  it('should handle small input', () => {
    const input = new TextEncoder().encode('Hi')
    const compressed = compress(input)
    
    expect(compressed).toBeInstanceOf(Uint8Array)
    // Small inputs might not compress well, but should still work
    expect(compressed.length).toBeGreaterThan(0)
  })

  it('should handle binary data', () => {
    const input = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    const compressed = compress(input)
    
    expect(compressed).toBeInstanceOf(Uint8Array)
    expect(compressed.length).toBeGreaterThan(0)
  })

  it('should produce consistent output for same input', () => {
    const input = new TextEncoder().encode('Consistent test data')
    const compressed1 = compress(input)
    const compressed2 = compress(input)
    
    expect(compressed1).toEqual(compressed2)
  })

  it('should produce different output for different input', () => {
    const input1 = new TextEncoder().encode('First string')
    const input2 = new TextEncoder().encode('Second string')

    const compressed1 = compress(input1)
    const compressed2 = compress(input2)

    expect(compressed1).not.toEqual(compressed2)
  })
})
