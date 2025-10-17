import { describe, it, expect } from 'vitest'
import { encodeBase64Url, decodeBase64Url } from './base64url'

describe('base64url encoding/decoding', () => {
  describe('encodeBase64Url()', () => {
    it('should encode data to base64url string', () => {
      const input = new TextEncoder().encode('Hello, World!')
      const encoded = encodeBase64Url(input)
      
      expect(typeof encoded).toBe('string')
      expect(encoded.length).toBeGreaterThan(0)
    })

    it('should produce URL-safe characters', () => {
      const input = new Uint8Array([0xFF, 0xFE, 0xFD, 0xFC, 0xFB])
      const encoded = encodeBase64Url(input)
      
      // Should not contain + or / (replaced with - and _)
      expect(encoded).not.toMatch(/\+/)
      expect(encoded).not.toMatch(/\//)
      
      // Should only contain URL-safe characters
      expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/)
    })

    it('should not include padding', () => {
      const input = new TextEncoder().encode('Hello')
      const encoded = encodeBase64Url(input)
      
      // Should not contain = padding
      expect(encoded).not.toMatch(/=/)
    })

    it('should handle empty input', () => {
      const input = new Uint8Array(0)
      const encoded = encodeBase64Url(input)
      
      expect(encoded).toBe('')
    })

    it('should handle single byte', () => {
      const input = new Uint8Array([65]) // 'A'
      const encoded = encodeBase64Url(input)
      
      expect(encoded).toBe('QQ')
    })

    it('should handle various data sizes', () => {
      // Test different sizes to ensure padding is handled correctly
      for (let i = 1; i <= 10; i++) {
        const input = new Uint8Array(i).fill(i)
        const encoded = encodeBase64Url(input)
        
        expect(encoded).not.toMatch(/=/)
        expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/)
      }
    })

    it('should produce consistent output', () => {
      const input = new TextEncoder().encode('Test data')
      const encoded1 = encodeBase64Url(input)
      const encoded2 = encodeBase64Url(input)
      
      expect(encoded1).toBe(encoded2)
    })
  })

  describe('decodeBase64Url()', () => {
    it('should decode base64url string to original data', () => {
      const original = new TextEncoder().encode('Hello, World!')
      const encoded = encodeBase64Url(original)
      const decoded = decodeBase64Url(encoded)
      
      expect(decoded).toEqual(original)
    })

    it('should handle empty string', () => {
      const decoded = decodeBase64Url('')
      
      expect(decoded).toEqual(new Uint8Array(0))
    })

    it('should handle URL-safe characters', () => {
      // Manually create a base64url string with - and _
      const encoded = 'SGVsbG8tV29ybGRf' // Contains - and _
      const decoded = decodeBase64Url(encoded)
      
      expect(decoded).toBeInstanceOf(Uint8Array)
      expect(decoded.length).toBeGreaterThan(0)
    })

    it('should handle strings without padding', () => {
      const testCases = [
        'QQ',      // 1 byte
        'QUJD',    // 3 bytes
        'QUJDRA',  // 4 bytes
      ]
      
      for (const encoded of testCases) {
        const decoded = decodeBase64Url(encoded)
        expect(decoded).toBeInstanceOf(Uint8Array)
      }
    })

    it('should round-trip various data', () => {
      const testCases = [
        new TextEncoder().encode('Simple text'),
        new TextEncoder().encode('Hello 世界 🌍'),
        new Uint8Array([0, 1, 2, 3, 4, 5]),
        new Uint8Array([255, 254, 253]),
        new Uint8Array(100).fill(42),
      ]

      for (const original of testCases) {
        const encoded = encodeBase64Url(original)
        const decoded = decodeBase64Url(encoded)

        expect(decoded).toEqual(original)
      }
    })

    it('should preserve binary data integrity', () => {
      const original = new Uint8Array(256)
      for (let i = 0; i < 256; i++) {
        original[i] = i
      }
      
      const encoded = encodeBase64Url(original)
      const decoded = decodeBase64Url(encoded)
      
      expect(decoded).toEqual(original)
    })
  })

  describe('round-trip tests', () => {
    it('should maintain data integrity through encode/decode', () => {
      const testData = [
        'Simple ASCII text',
        'Unicode: 你好世界 🚀',
        'Special chars: !@#$%^&*()',
        'Numbers: 0123456789',
        '',
        'A',
        'AB',
        'ABC',
        'ABCD',
      ]
      
      for (const text of testData) {
        const original = new TextEncoder().encode(text)
        const encoded = encodeBase64Url(original)
        const decoded = decodeBase64Url(encoded)
        const result = new TextDecoder().decode(decoded)
        
        expect(result).toBe(text)
      }
    })

    it('should handle large data', () => {
      const largeData = new Uint8Array(10000)
      for (let i = 0; i < largeData.length; i++) {
        largeData[i] = i % 256
      }
      
      const encoded = encodeBase64Url(largeData)
      const decoded = decodeBase64Url(encoded)
      
      expect(decoded).toEqual(largeData)
    })

    it('should be URL-safe', () => {
      const original = new Uint8Array([0xFF, 0xFE, 0xFD, 0xFC, 0xFB, 0xFA])
      const encoded = encodeBase64Url(original)
      
      // Should be safe to use in URL without encoding
      const urlEncoded = encodeURIComponent(encoded)
      expect(urlEncoded).toBe(encoded)
    })
  })
})
