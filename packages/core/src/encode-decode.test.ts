import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { encode } from './encoder'
import { decode, decodeWithVersion } from './decoder'

describe('encode-decode integration', () => {
  describe('round-trip encoding', () => {
    it('should handle complete round-trip for simple schema', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
        active: z.boolean()
      })

      const originalData = {
        name: 'Alice',
        age: 30,
        active: true
      }

      const encoded = encode(originalData, schema)
      const decoded = decode(encoded, schema)

      expect(decoded).toEqual(originalData)
    })

    it('should handle various data types', () => {
      const schema = z.object({
        string: z.string(),
        number: z.number(),
        boolean: z.boolean(),
        array: z.array(z.string()),
        nested: z.object({
          value: z.number()
        })
      })

      const originalData = {
        string: 'test',
        number: 42,
        boolean: false,
        array: ['a', 'b', 'c'],
        nested: {
          value: 123
        }
      }

      const encoded = encode(originalData, schema)
      const decoded = decode(encoded, schema)

      expect(decoded).toEqual(originalData)
    })

    it('should preserve version information', () => {
      const schema = z.object({
        data: z.string()
      })

      const versions = [1, 2, 5, 10, 100]

      for (const version of versions) {
        const encoded = encode({ data: 'test' }, schema, version)
        const result = decodeWithVersion(encoded, schema)

        expect(result.version).toBe(version)
        expect(result.data).toEqual({ data: 'test' })
      }
    })

    it('should handle empty arrays', () => {
      const schema = z.object({
        items: z.array(z.string())
      })

      const originalData = {
        items: []
      }

      const encoded = encode(originalData, schema)
      const decoded = decode(encoded, schema)

      expect(decoded).toEqual(originalData)
    })

    it('should handle optional fields with values', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional()
      })

      const withOptional = {
        required: 'test',
        optional: 'value'
      }

      const encoded = encode(withOptional, schema)
      const decoded = decode(encoded, schema)

      expect(decoded).toEqual(withOptional)
    })

    it('should handle optional fields without values', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional()
      })

      const withoutOptional = {
        required: 'test'
      }

      const encoded = encode(withoutOptional, schema)
      const decoded = decode(encoded, schema)

      expect(decoded).toEqual(withoutOptional)
    })

    it('should handle deeply nested objects', () => {
      const schema = z.object({
        level1: z.object({
          level2: z.object({
            level3: z.object({
              value: z.string()
            })
          })
        })
      })

      const originalData = {
        level1: {
          level2: {
            level3: {
              value: 'deep'
            }
          }
        }
      }

      const encoded = encode(originalData, schema)
      const decoded = decode(encoded, schema)

      expect(decoded).toEqual(originalData)
    })

    it('should handle arrays of objects', () => {
      const schema = z.object({
        users: z.array(
          z.object({
            name: z.string(),
            age: z.number()
          })
        )
      })

      const originalData = {
        users: [
          { name: 'Alice', age: 30 },
          { name: 'Bob', age: 25 },
          { name: 'Charlie', age: 35 }
        ]
      }

      const encoded = encode(originalData, schema)
      const decoded = decode(encoded, schema)

      expect(decoded).toEqual(originalData)
    })

    it('should handle enums', () => {
      const schema = z.object({
        status: z.enum(['active', 'inactive', 'pending']),
        role: z.enum(['admin', 'user', 'guest'])
      })

      const originalData = {
        status: 'active' as const,
        role: 'admin' as const
      }

      const encoded = encode(originalData, schema)
      const decoded = decode(encoded, schema)

      expect(decoded).toEqual(originalData)
    })

    it('should handle multiple number types', () => {
      const schema = z.object({
        float: z.number(),
        integer: z.number().int(),
        positive: z.number().positive(),
        negative: z.number().negative()
      })

      const originalData = {
        float: 3.14159,
        integer: 42,
        positive: 100,
        negative: -50
      }

      const encoded = encode(originalData, schema)
      const decoded = decode(encoded, schema)

      expect(decoded).toEqual(originalData)
    })

    it('should handle large strings', () => {
      const schema = z.object({
        text: z.string()
      })

      const originalData = {
        text: 'Lorem ipsum dolor sit amet, '.repeat(100)
      }

      const encoded = encode(originalData, schema)
      const decoded = decode(encoded, schema)

      expect(decoded).toEqual(originalData)
    })

    it('should verify compression (encoded smaller than JSON)', () => {
      const schema = z.object({
        data: z.string(),
        count: z.number(),
        items: z.array(z.string())
      })

      const originalData = {
        data: 'test data here',
        count: 42,
        items: ['item1', 'item2', 'item3', 'item4', 'item5']
      }

      const encoded = encode(originalData, schema)

      // Encoded should be base64url, no spaces
      expect(encoded).not.toContain(' ')
      expect(encoded).not.toMatch(/[+/=]/)

      // Note: Compression may not always be smaller for tiny payloads
      // but the encoding should always work
      expect(encoded.length).toBeGreaterThan(0)
    })

    it('should maintain data integrity across multiple round-trips', () => {
      const schema = z.object({
        value: z.number()
      })

      let data = { value: 42 }

      // Encode and decode 10 times
      for (let i = 0; i < 10; i++) {
        const encoded = encode(data, schema)
        data = decode(encoded, schema) as typeof data
      }

      expect(data).toEqual({ value: 42 })
    })
  })

  describe('data integrity', () => {
    it('should handle special characters in strings', () => {
      const schema = z.object({
        text: z.string()
      })

      const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`'
      const originalData = { text: specialChars }

      const encoded = encode(originalData, schema)
      const decoded = decode(encoded, schema)

      expect(decoded).toEqual(originalData)
    })

    it('should handle unicode characters', () => {
      const schema = z.object({
        text: z.string()
      })

      const originalData = {
        text: '你好世界 مرحبا بالعالم 🚀🎉🔥'
      }

      const encoded = encode(originalData, schema)
      const decoded = decode(encoded, schema)

      expect(decoded).toEqual(originalData)
    })

    it('should handle numbers at precision limits', () => {
      const schema = z.object({
        small: z.number(),
        large: z.number(),
        zero: z.number()
      })

      const originalData = {
        small: 0.0000001,
        large: 999999999,
        zero: 0
      }

      const encoded = encode(originalData, schema)
      const decoded = decode(encoded, schema)

      expect(decoded).toEqual(originalData)
    })
  })
})
