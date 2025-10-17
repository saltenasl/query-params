import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { encode } from './encoder'
import { decode, decodeWithVersion } from './decoder'

describe('decoder', () => {
  describe('decode', () => {
    it('should decode simple object', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const data = { name: 'Alice', age: 30 }
      const encoded = encode(data, schema)
      const decoded = decode(encoded, schema)

      expect(decoded).toEqual(data)
    })

    it('should decode complex nested objects', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          profile: z.object({
            bio: z.string(),
            age: z.number()
          })
        }),
        settings: z.object({
          theme: z.string(),
          notifications: z.boolean()
        })
      })

      const data = {
        user: {
          name: 'Bob',
          profile: {
            bio: 'Software engineer',
            age: 25
          }
        },
        settings: {
          theme: 'dark',
          notifications: true
        }
      }

      const encoded = encode(data, schema)
      const decoded = decode(encoded, schema)

      expect(decoded).toEqual(data)
    })

    it('should decode arrays', () => {
      const schema = z.object({
        items: z.array(z.string()),
        numbers: z.array(z.number())
      })

      const data = {
        items: ['apple', 'banana', 'cherry'],
        numbers: [1, 2, 3, 4, 5]
      }

      const encoded = encode(data, schema)
      const decoded = decode(encoded, schema)

      expect(decoded).toEqual(data)
    })

    it('should decode optional fields', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional(),
        maybeNumber: z.number().optional()
      })

      const dataWithOptional = {
        required: 'test',
        optional: 'present',
        maybeNumber: 42
      }

      const dataWithoutOptional = {
        required: 'test'
      }

      const encoded1 = encode(dataWithOptional, schema)
      const encoded2 = encode(dataWithoutOptional, schema)

      const decoded1 = decode(encoded1, schema)
      const decoded2 = decode(encoded2, schema)

      expect(decoded1).toEqual(dataWithOptional)
      expect(decoded2).toEqual(dataWithoutOptional)
    })

    it('should throw error for invalid encoded string', () => {
      const schema = z.object({
        name: z.string()
      })

      // Invalid base64url will decode but fail during decompression
      expect(() => {
        decode('invalid-base64url-string!!!', schema)
      }).toThrow()
    })

    it('should throw DecodingError for corrupted data', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const data = { name: 'Alice', age: 30 }
      const encoded = encode(data, schema)

      // Corrupt the encoded string by truncating it significantly
      // This ensures protobuf decoding will fail
      const corrupted = encoded.slice(0, Math.floor(encoded.length / 2))

      expect(() => {
        decode(corrupted, schema)
      }).toThrow()
    })

    it('should return error object with safeParse option', () => {
      const schema = z.object({
        name: z.string()
      })

      const result = decode('invalid-string', schema, { safeParse: true })

      expect(result).toHaveProperty('success')
      if ('success' in result) {
        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
      }
    })

    it('should return success object with safeParse option', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const data = { name: 'Alice', age: 30 }
      const encoded = encode(data, schema)

      const result = decode(encoded, schema, { safeParse: true })

      expect(result).toHaveProperty('success')
      if ('success' in result) {
        expect(result.success).toBe(true)
        expect(result.data).toEqual(data)
      }
    })

    it('should decode booleans', () => {
      const schema = z.object({
        isActive: z.boolean(),
        isVerified: z.boolean()
      })

      const data = { isActive: true, isVerified: false }
      const encoded = encode(data, schema)
      const decoded = decode(encoded, schema)

      expect(decoded).toEqual(data)
    })

    it('should decode enums', () => {
      const schema = z.object({
        role: z.enum(['admin', 'user', 'guest'])
      })

      const data = { role: 'admin' as const }
      const encoded = encode(data, schema)
      const decoded = decode(encoded, schema)

      expect(decoded).toEqual(data)
    })

    it('should decode empty object', () => {
      const schema = z.object({})

      const data = {}
      const encoded = encode(data, schema)
      const decoded = decode(encoded, schema)

      expect(decoded).toEqual(data)
    })
  })

  describe('decodeWithVersion', () => {
    it('should return data and version', () => {
      const schema = z.object({
        name: z.string()
      })

      const data = { name: 'test' }
      const version = 5
      const encoded = encode(data, schema, version)

      const result = decodeWithVersion(encoded, schema)

      expect(result.data).toEqual(data)
      expect(result.version).toBe(version)
    })

    it('should return default version 1', () => {
      const schema = z.object({
        name: z.string()
      })

      const data = { name: 'test' }
      const encoded = encode(data, schema) // default version = 1

      const result = decodeWithVersion(encoded, schema)

      expect(result.data).toEqual(data)
      expect(result.version).toBe(1)
    })
  })
})
