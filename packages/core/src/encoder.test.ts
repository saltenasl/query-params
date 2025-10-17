import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { encode } from './encoder'
import { RESERVED_FIELD } from './validation'
import { ValidationError } from './errors'

describe('encoder', () => {
  describe('encode', () => {
    it('should encode simple object', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const result = encode({ name: 'Alice', age: 30 }, schema)
      
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
      // Base64url should not contain +, /, or =
      expect(result).not.toMatch(/[+/=]/)
    })

    it('should encode complex nested objects', () => {
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

      const result = encode(data, schema)
      
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should encode arrays', () => {
      const schema = z.object({
        items: z.array(z.string()),
        numbers: z.array(z.number())
      })

      const data = {
        items: ['apple', 'banana', 'cherry'],
        numbers: [1, 2, 3, 4, 5]
      }

      const result = encode(data, schema)
      
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should encode optional fields', () => {
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

      const result1 = encode(dataWithOptional, schema)
      const result2 = encode(dataWithoutOptional, schema)
      
      expect(typeof result1).toBe('string')
      expect(typeof result2).toBe('string')
    })

    it('should throw ValidationError for reserved field', () => {
      const schema = z.object({
        name: z.string(),
        [RESERVED_FIELD]: z.number()
      })

      expect(() => {
        encode({ name: 'test', [RESERVED_FIELD]: 1 }, schema)
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for nested reserved field', () => {
      const schema = z.object({
        data: z.object({
          [RESERVED_FIELD]: z.number()
        })
      })

      expect(() => {
        encode({ data: { [RESERVED_FIELD]: 1 } }, schema)
      }).toThrow(ValidationError)
    })

    it('should throw for invalid data', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      expect(() => {
        encode({ name: 'Alice', age: 'not a number' }, schema)
      }).toThrow()
    })

    it('should support custom version', () => {
      const schema = z.object({
        name: z.string()
      })

      const result1 = encode({ name: 'test' }, schema, 1)
      const result2 = encode({ name: 'test' }, schema, 5)
      
      expect(typeof result1).toBe('string')
      expect(typeof result2).toBe('string')
      // Different versions should potentially produce different output
      // (though the data is the same, the version field differs)
    })

    it('should return error object with safeParse option', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const result = encode(
        { name: 'Alice', age: 'invalid' },
        schema,
        1,
        { safeParse: true }
      )

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

      const result = encode(
        { name: 'Alice', age: 30 },
        schema,
        1,
        { safeParse: true }
      )

      expect(result).toHaveProperty('success')
      if ('success' in result) {
        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        expect(typeof result.data).toBe('string')
      }
    })

    it('should encode booleans', () => {
      const schema = z.object({
        isActive: z.boolean(),
        isVerified: z.boolean()
      })

      const result = encode({ isActive: true, isVerified: false }, schema)
      
      expect(typeof result).toBe('string')
    })

    it('should encode enums', () => {
      const schema = z.object({
        role: z.enum(['admin', 'user', 'guest'])
      })

      const result = encode({ role: 'admin' }, schema)
      
      expect(typeof result).toBe('string')
    })

    it('should throw for non-object root schema', () => {
      const schema = z.string()

      expect(() => {
        encode('just a string', schema)
      }).toThrow(ValidationError)
    })

    it('should encode empty object', () => {
      const schema = z.object({})

      const result = encode({}, schema)
      
      expect(typeof result).toBe('string')
    })
  })
})
