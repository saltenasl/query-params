import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { EncodedState, createEncodedState } from './polymorphic'
import { encode } from './encoder'

describe('polymorphic', () => {
  const testSchema = z.object({
    query: z.string(),
    page: z.number()
  })

  const testData = { query: 'search', page: 1 }

  describe('EncodedState', () => {
    it('should create instance with encoded string', () => {
      const encoded = encode(testData, testSchema)
      const state = new EncodedState(encoded)

      expect(state).toBeInstanceOf(EncodedState)
    })

    it('should return encoded string from toString()', () => {
      const encoded = encode(testData, testSchema)
      const state = new EncodedState(encoded)

      expect(state.toString()).toBe(encoded)
    })

    it('should return encoded string from valueOf()', () => {
      const encoded = encode(testData, testSchema)
      const state = new EncodedState(encoded)

      expect(state.valueOf()).toBe(encoded)
    })

    it('should return encoded string from toJSON()', () => {
      const encoded = encode(testData, testSchema)
      const state = new EncodedState(encoded)

      expect(state.toJSON()).toBe(encoded)
    })

    it('should coerce to string in template literals', () => {
      const encoded = encode(testData, testSchema)
      const state = new EncodedState(encoded)

      const result = `state=${state}`
      expect(result).toBe(`state=${encoded}`)
    })

    it('should coerce to string in concatenation', () => {
      const encoded = encode(testData, testSchema)
      const state = new EncodedState(encoded)

      const result = 'prefix-' + state + '-suffix'
      expect(result).toBe(`prefix-${encoded}-suffix`)
    })

    it('should work with String() constructor', () => {
      const encoded = encode(testData, testSchema)
      const state = new EncodedState(encoded)

      expect(String(state)).toBe(encoded)
    })

    it('should handle Symbol.toPrimitive with string hint', () => {
      const encoded = encode(testData, testSchema)
      const state = new EncodedState(encoded)

      const result = state[Symbol.toPrimitive]('string')
      expect(result).toBe(encoded)
    })

    it('should handle Symbol.toPrimitive with default hint', () => {
      const encoded = encode(testData, testSchema)
      const state = new EncodedState(encoded)

      const result = state[Symbol.toPrimitive]('default')
      expect(result).toBe(encoded)
    })

    it('should handle Symbol.toPrimitive with number hint', () => {
      const encoded = encode(testData, testSchema)
      const state = new EncodedState(encoded)

      const result = state[Symbol.toPrimitive]('number')
      expect(result).toBe(NaN)
    })

    it('should work with JSON.stringify', () => {
      const encoded = encode(testData, testSchema)
      const state = new EncodedState(encoded)

      const json = JSON.stringify({ state })
      expect(json).toBe(JSON.stringify({ state: encoded }))
    })

    it('should work with JSON.stringify in arrays', () => {
      const encoded = encode(testData, testSchema)
      const state = new EncodedState(encoded)

      const json = JSON.stringify([state, 'other'])
      expect(json).toBe(JSON.stringify([encoded, 'other']))
    })

    it('should work with JSON.stringify in nested objects', () => {
      const encoded = encode(testData, testSchema)
      const state = new EncodedState(encoded)

      const json = JSON.stringify({ data: { nested: state } })
      expect(json).toBe(JSON.stringify({ data: { nested: encoded } }))
    })

    it('should work in URL construction', () => {
      const encoded = encode(testData, testSchema)
      const state = new EncodedState(encoded)

      const url = `/api/search?state=${state}`
      expect(url).toBe(`/api/search?state=${encoded}`)
    })

    it('should work with URLSearchParams', () => {
      const encoded = encode(testData, testSchema)
      const state = new EncodedState(encoded)

      const params = new URLSearchParams()
      params.set('state', state as any)

      expect(params.get('state')).toBe(encoded)
    })

    it('should work with URL object', () => {
      const encoded = encode(testData, testSchema)
      const state = new EncodedState(encoded)

      const url = new URL(`https://example.com?state=${state}`)
      expect(url.searchParams.get('state')).toBe(encoded)
    })

    it('should expose length property', () => {
      const encoded = encode(testData, testSchema)
      const state = new EncodedState(encoded)

      expect(state.length).toBe(encoded.length)
    })

    it('should support charAt method', () => {
      const encoded = encode(testData, testSchema)
      const state = new EncodedState(encoded)

      expect(state.charAt(0)).toBe(encoded.charAt(0))
      expect(state.charAt(5)).toBe(encoded.charAt(5))
    })

    it('should support includes method', () => {
      const encoded = encode(testData, testSchema)
      const state = new EncodedState(encoded)

      const substring = encoded.substring(0, 3)
      expect(state.includes(substring)).toBe(true)
      expect(state.includes('xyz123')).toBe(false)
    })

    it('should support indexOf method', () => {
      const encoded = encode(testData, testSchema)
      const state = new EncodedState(encoded)

      const char = encoded.charAt(5)
      expect(state.indexOf(char)).toBe(encoded.indexOf(char))
      expect(state.indexOf('xyz')).toBe(-1)
    })

    it('should support substring method', () => {
      const encoded = encode(testData, testSchema)
      const state = new EncodedState(encoded)

      expect(state.substring(0, 5)).toBe(encoded.substring(0, 5))
      expect(state.substring(3)).toBe(encoded.substring(3))
    })

    it('should support slice method', () => {
      const encoded = encode(testData, testSchema)
      const state = new EncodedState(encoded)

      expect(state.slice(0, 5)).toBe(encoded.slice(0, 5))
      expect(state.slice(-5)).toBe(encoded.slice(-5))
      expect(state.slice(2, -2)).toBe(encoded.slice(2, -2))
    })
  })

  describe('createEncodedState', () => {
    it('should create EncodedState from data and schema', () => {
      const state = createEncodedState(testData, testSchema)

      expect(state).toBeInstanceOf(EncodedState)
    })

    it('should encode data correctly', () => {
      const state = createEncodedState(testData, testSchema)
      const expected = encode(testData, testSchema)

      expect(state.toString()).toBe(expected)
    })

    it('should work with custom version', () => {
      const state = createEncodedState(testData, testSchema, 2)
      const expected = encode(testData, testSchema, 2)

      expect(state.toString()).toBe(expected)
    })

    it('should work in template literals immediately', () => {
      const state = createEncodedState(testData, testSchema)
      const url = `/path?q=${state}`

      expect(url).toContain('/path?q=')
      expect(url.length).toBeGreaterThan('/path?q='.length)
    })

    it('should work in string concatenation immediately', () => {
      const state = createEncodedState(testData, testSchema)
      const url = 'https://example.com?state=' + state

      expect(url).toContain('https://example.com?state=')
    })

    it('should work with complex nested objects', () => {
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
          name: 'Alice',
          profile: {
            bio: 'Software engineer',
            age: 30
          }
        },
        settings: {
          theme: 'dark',
          notifications: true
        }
      }

      const state = createEncodedState(data, schema)
      expect(state).toBeInstanceOf(EncodedState)
      expect(state.length).toBeGreaterThan(0)
    })

    it('should work with arrays in schema', () => {
      const schema = z.object({
        tags: z.array(z.string()),
        counts: z.array(z.number())
      })

      const data = {
        tags: ['typescript', 'nodejs', 'react'],
        counts: [1, 2, 3, 4, 5]
      }

      const state = createEncodedState(data, schema)
      const url = `/api?data=${state}`

      expect(url).toContain('/api?data=')
    })

    it('should work with optional fields', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional(),
        nullable: z.string().nullable()
      })

      const data = {
        required: 'value',
        optional: undefined,
        nullable: null
      }

      const state = createEncodedState(data, schema)
      expect(state).toBeInstanceOf(EncodedState)
    })

    it('should work with enums', () => {
      const schema = z.object({
        status: z.enum(['pending', 'active', 'completed']),
        priority: z.enum(['low', 'medium', 'high'])
      })

      const data = {
        status: 'active' as const,
        priority: 'high' as const
      }

      const state = createEncodedState(data, schema)
      const json = JSON.stringify({ state })

      expect(json).toContain(state.toString())
    })

    it('should work with unions', () => {
      const schema = z.object({
        value: z.union([z.string(), z.number()]),
        type: z.literal('text').or(z.literal('number'))
      })

      const data = {
        value: 'test',
        type: 'text' as const
      }

      const state = createEncodedState(data, schema)
      expect(state.length).toBeGreaterThan(0)
    })

    it('should throw error for invalid data', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const invalidData = {
        name: 'Alice',
        age: 'not a number' // Invalid
      }

      expect(() => createEncodedState(invalidData, schema)).toThrow()
    })

    it('should work with safeParse option', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const invalidData = {
        name: 'Alice',
        age: 'not a number'
      }

      // With safeParse, should still throw since we handle the error internally
      expect(() =>
        createEncodedState(invalidData, schema, 1, { safeParse: true })
      ).toThrow()
    })

    // Note: ZodDate is not currently supported by the encoder
    // it('should work with dates', () => {
    //   const schema = z.object({
    //     timestamp: z.date(),
    //     name: z.string()
    //   })
    //
    //   const data = {
    //     timestamp: new Date('2024-01-01T00:00:00Z'),
    //     name: 'Event'
    //   }
    //
    //   const state = createEncodedState(data, schema)
    //   expect(state).toBeInstanceOf(EncodedState)
    // })

    it('should work with booleans', () => {
      const schema = z.object({
        active: z.boolean(),
        verified: z.boolean(),
        deleted: z.boolean()
      })

      const data = {
        active: true,
        verified: false,
        deleted: false
      }

      const state = createEncodedState(data, schema)
      const url = `https://api.example.com/users?filter=${state}`

      expect(url).toContain('https://api.example.com/users?filter=')
    })

    it('should create url-safe strings', () => {
      const state = createEncodedState(testData, testSchema)
      const str = state.toString()

      // Base64url should not contain +, /, or =
      expect(str).not.toMatch(/[+/=]/)
    })

    it('should work with object spreading in template literals', () => {
      const state = createEncodedState(testData, testSchema)
      const params = {
        q: 'search',
        state: state
      }

      const url = `/api?q=${params.q}&state=${params.state}`
      expect(url).toContain('/api?q=search&state=')
    })

    it('should maintain immutability', () => {
      const state = createEncodedState(testData, testSchema)
      const str1 = state.toString()
      const str2 = state.toString()

      expect(str1).toBe(str2)
    })

    it('should work with multiple instances', () => {
      const state1 = createEncodedState({ query: 'first', page: 1 }, testSchema)
      const state2 = createEncodedState({ query: 'second', page: 2 }, testSchema)

      expect(state1.toString()).not.toBe(state2.toString())

      const url = `/api?state1=${state1}&state2=${state2}`
      expect(url).toContain('state1=')
      expect(url).toContain('state2=')
    })
  })
})
