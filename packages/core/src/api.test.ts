import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { createQueryParams, parseQueryParams, QueryParams } from './api'

describe('api', () => {
  describe('createQueryParams', () => {
    it('should create QueryParams from simple object', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const params = createQueryParams({ name: 'Alice', age: 30 }, schema)

      expect(params).toBeInstanceOf(QueryParams)
      expect(params).toBeInstanceOf(URLSearchParams)
      expect(typeof params.getState()).toBe('string')
      expect(params.getState().length).toBeGreaterThan(0)
    })

    it('should create QueryParams with custom version', () => {
      const schema = z.object({
        name: z.string()
      })

      const params = createQueryParams({ name: 'test' }, schema, { version: 5 })

      expect(params).toBeInstanceOf(QueryParams)
      expect(params.getState()).toBeDefined()
    })

    it('should create QueryParams with complex nested objects', () => {
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

      const params = createQueryParams(data, schema)

      expect(params).toBeInstanceOf(QueryParams)
      expect(params.getState()).toBeTruthy()
    })

    it('should create QueryParams with arrays', () => {
      const schema = z.object({
        items: z.array(z.string()),
        numbers: z.array(z.number())
      })

      const data = {
        items: ['apple', 'banana', 'cherry'],
        numbers: [1, 2, 3, 4, 5]
      }

      const params = createQueryParams(data, schema)

      expect(params).toBeInstanceOf(QueryParams)
      expect(params.getState()).toBeTruthy()
    })

    it('should create QueryParams with optional fields', () => {
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

      const params1 = createQueryParams(dataWithOptional, schema)
      const params2 = createQueryParams(dataWithoutOptional, schema)

      expect(params1).toBeInstanceOf(QueryParams)
      expect(params2).toBeInstanceOf(QueryParams)
    })

    it('should create QueryParams with booleans', () => {
      const schema = z.object({
        isActive: z.boolean(),
        isVerified: z.boolean()
      })

      const params = createQueryParams(
        { isActive: true, isVerified: false },
        schema
      )

      expect(params).toBeInstanceOf(QueryParams)
    })

    it('should create QueryParams with enums', () => {
      const schema = z.object({
        role: z.enum(['admin', 'user', 'guest']),
        status: z.enum(['active', 'inactive'])
      })

      const params = createQueryParams(
        { role: 'admin', status: 'active' },
        schema
      )

      expect(params).toBeInstanceOf(QueryParams)
    })

    it('should throw for invalid data', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      expect(() => {
        createQueryParams({ name: 'Alice', age: 'invalid' } as any, schema)
      }).toThrow()
    })

    it('should return error object with safeParse option', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const result = createQueryParams(
        { name: 'Alice', age: 'invalid' } as any,
        schema,
        { safeParse: true }
      )

      expect(result).toHaveProperty('success')
      if ('success' in result) {
        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.data).toBeUndefined()
      }
    })

    it('should return success object with safeParse option', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const result = createQueryParams(
        { name: 'Alice', age: 30 },
        schema,
        { safeParse: true }
      )

      expect(result).toHaveProperty('success')
      if ('success' in result) {
        expect(result.success).toBe(true)
        expect(result.data).toBeInstanceOf(QueryParams)
        expect(result.error).toBeUndefined()
      }
    })

    it('should handle empty object', () => {
      const schema = z.object({})

      const params = createQueryParams({}, schema)

      expect(params).toBeInstanceOf(QueryParams)
    })
  })

  describe('QueryParams polymorphic behavior', () => {
    const schema = z.object({
      name: z.string(),
      count: z.number()
    })

    it('should be coercible to string with toString()', () => {
      const params = createQueryParams({ name: 'test', count: 42 }, schema)
      const stringValue = params.toString()

      expect(typeof stringValue).toBe('string')
      expect(stringValue.length).toBeGreaterThan(0)
      // Should not contain URLSearchParams format
      expect(stringValue).not.toContain('state=')
    })

    it('should be coercible to string with String()', () => {
      const params = createQueryParams({ name: 'test', count: 42 }, schema)
      const stringValue = String(params)

      expect(typeof stringValue).toBe('string')
      expect(stringValue).toBe(params.getState())
    })

    it('should be coercible to string with valueOf()', () => {
      const params = createQueryParams({ name: 'test', count: 42 }, schema)
      const stringValue = params.valueOf()

      expect(typeof stringValue).toBe('string')
      expect(stringValue).toBe(params.getState())
    })

    it('should support Symbol.toPrimitive for string hint', () => {
      const params = createQueryParams({ name: 'test', count: 42 }, schema)
      // Template literal triggers toPrimitive with 'string' hint
      const stringValue = `${params}`

      expect(typeof stringValue).toBe('string')
      expect(stringValue).toBe(params.getState())
    })

    it('should work in string concatenation', () => {
      const params = createQueryParams({ name: 'test', count: 42 }, schema)
      const url = 'https://example.com?state=' + params

      expect(url).toContain('https://example.com?state=')
      expect(url).toContain(params.getState())
    })

    it('should provide URLSearchParams functionality', () => {
      const params = createQueryParams({ name: 'test', count: 42 }, schema)

      // Should have 'state' parameter
      expect(params.has('state')).toBe(true)
      expect(params.get('state')).toBe(params.getState())
    })

    it('should provide toURLSearchParamsString for explicit URLSearchParams format', () => {
      const params = createQueryParams({ name: 'test', count: 42 }, schema)
      const urlParamsString = params.toURLSearchParamsString()

      expect(urlParamsString).toContain('state=')
      expect(urlParamsString).toContain(encodeURIComponent(params.getState()))
    })

    it('should be usable with URL constructor', () => {
      const params = createQueryParams({ name: 'test', count: 42 }, schema)
      const url = new URL('https://example.com?' + params.toURLSearchParamsString())

      expect(url.searchParams.get('state')).toBe(params.getState())
    })

    it('should support URLSearchParams methods', () => {
      const params = createQueryParams({ name: 'test', count: 42 }, schema)

      // Test various URLSearchParams methods
      expect(params.has('state')).toBe(true)
      expect(params.get('state')).toBe(params.getState())
      expect(Array.from(params.keys())).toContain('state')
      expect(Array.from(params.values())).toContain(params.getState())
    })
  })

  describe('parseQueryParams', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number()
    })

    it('should parse QueryParams back to original data', () => {
      const originalData = { name: 'Alice', age: 30 }
      const params = createQueryParams(originalData, schema)

      const parsed = parseQueryParams(params, schema)

      expect(parsed).toEqual(originalData)
    })

    it('should parse encoded string back to original data', () => {
      const originalData = { name: 'Bob', age: 25 }
      const params = createQueryParams(originalData, schema)
      const encodedString = params.getState()

      const parsed = parseQueryParams(encodedString, schema)

      expect(parsed).toEqual(originalData)
    })

    it('should preserve data types', () => {
      const originalData = { name: 'Charlie', age: 35 }
      const params = createQueryParams(originalData, schema)

      const parsed = parseQueryParams(params, schema)

      expect(typeof parsed.name).toBe('string')
      expect(typeof parsed.age).toBe('number')
      expect(parsed.name).toBe('Charlie')
      expect(parsed.age).toBe(35)
    })

    it('should parse complex nested objects', () => {
      const complexSchema = z.object({
        user: z.object({
          name: z.string(),
          profile: z.object({
            bio: z.string(),
            age: z.number()
          })
        })
      })

      const originalData = {
        user: {
          name: 'Dave',
          profile: {
            bio: 'Developer',
            age: 28
          }
        }
      }

      const params = createQueryParams(originalData, complexSchema)
      const parsed = parseQueryParams(params, complexSchema)

      expect(parsed).toEqual(originalData)
    })

    it('should parse arrays correctly', () => {
      const arraySchema = z.object({
        items: z.array(z.string()),
        numbers: z.array(z.number())
      })

      const originalData = {
        items: ['one', 'two', 'three'],
        numbers: [10, 20, 30]
      }

      const params = createQueryParams(originalData, arraySchema)
      const parsed = parseQueryParams(params, arraySchema)

      expect(parsed).toEqual(originalData)
      expect(Array.isArray(parsed.items)).toBe(true)
      expect(Array.isArray(parsed.numbers)).toBe(true)
    })

    it('should parse optional fields', () => {
      const optionalSchema = z.object({
        required: z.string(),
        optional: z.string().optional()
      })

      const dataWithOptional = {
        required: 'test',
        optional: 'present'
      }

      const dataWithoutOptional = {
        required: 'test'
      }

      const params1 = createQueryParams(dataWithOptional, optionalSchema)
      const params2 = createQueryParams(dataWithoutOptional, optionalSchema)

      const parsed1 = parseQueryParams(params1, optionalSchema)
      const parsed2 = parseQueryParams(params2, optionalSchema)

      expect(parsed1).toEqual(dataWithOptional)
      expect(parsed2).toEqual(dataWithoutOptional)
    })

    it('should parse booleans correctly', () => {
      const boolSchema = z.object({
        isActive: z.boolean(),
        isVerified: z.boolean()
      })

      const originalData = { isActive: true, isVerified: false }
      const params = createQueryParams(originalData, boolSchema)
      const parsed = parseQueryParams(params, boolSchema)

      expect(parsed).toEqual(originalData)
      expect(typeof parsed.isActive).toBe('boolean')
      expect(typeof parsed.isVerified).toBe('boolean')
    })

    it('should throw for invalid encoded string', () => {
      expect(() => {
        parseQueryParams('invalid-encoded-string', schema)
      }).toThrow()
    })

    it('should return error object with safeParse option', () => {
      const result = parseQueryParams('invalid-encoded-string', schema, {
        safeParse: true
      })

      expect(result).toHaveProperty('success')
      if ('success' in result) {
        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.data).toBeUndefined()
      }
    })

    it('should return success object with safeParse option', () => {
      const originalData = { name: 'Eve', age: 40 }
      const params = createQueryParams(originalData, schema)

      const result = parseQueryParams(params, schema, { safeParse: true })

      expect(result).toHaveProperty('success')
      if ('success' in result) {
        expect(result.success).toBe(true)
        expect(result.data).toEqual(originalData)
        expect(result.error).toBeUndefined()
      }
    })
  })

  describe('round-trip encoding/decoding', () => {
    it('should maintain data integrity through multiple round trips', () => {
      const schema = z.object({
        name: z.string(),
        count: z.number(),
        active: z.boolean()
      })

      const originalData = { name: 'test', count: 42, active: true }

      // First round trip
      const params1 = createQueryParams(originalData, schema)
      const parsed1 = parseQueryParams(params1, schema)
      expect(parsed1).toEqual(originalData)

      // Second round trip
      const params2 = createQueryParams(parsed1, schema)
      const parsed2 = parseQueryParams(params2, schema)
      expect(parsed2).toEqual(originalData)

      // Third round trip
      const params3 = createQueryParams(parsed2, schema)
      const parsed3 = parseQueryParams(params3, schema)
      expect(parsed3).toEqual(originalData)
    })

    it('should work with different versions', () => {
      const schema = z.object({
        value: z.string()
      })

      const data = { value: 'test' }

      const params1 = createQueryParams(data, schema, { version: 1 })
      const params2 = createQueryParams(data, schema, { version: 2 })

      const parsed1 = parseQueryParams(params1, schema)
      const parsed2 = parseQueryParams(params2, schema)

      expect(parsed1).toEqual(data)
      expect(parsed2).toEqual(data)
    })
  })

  describe('type inference', () => {
    it('should infer correct types from schema', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
        active: z.boolean()
      })

      const params = createQueryParams(
        { name: 'test', age: 30, active: true },
        schema
      )

      // Type inference test - this should compile without errors
      const parsed = parseQueryParams(params, schema)
      const _name: string = parsed.name
      const _age: number = parsed.age
      const _active: boolean = parsed.active

      expect(_name).toBe('test')
      expect(_age).toBe(30)
      expect(_active).toBe(true)
    })

    it('should infer optional fields correctly', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.number().optional()
      })

      const params = createQueryParams({ required: 'test' }, schema)
      const parsed = parseQueryParams(params, schema)

      // Type inference test
      const _required: string = parsed.required
      const _optional: number | undefined = parsed.optional

      expect(_required).toBe('test')
      expect(_optional).toBeUndefined()
    })
  })

  describe('integration scenarios', () => {
    it('should work in URL building scenario', () => {
      const schema = z.object({
        userId: z.string(),
        preferences: z.object({
          theme: z.string(),
          language: z.string()
        })
      })

      const data = {
        userId: 'user123',
        preferences: {
          theme: 'dark',
          language: 'en'
        }
      }

      const params = createQueryParams(data, schema)
      const url = `https://example.com/api?state=${params}`

      expect(url).toContain('https://example.com/api?state=')
      expect(url).toContain(params.getState())

      // Extract and parse back
      const extractedState = url.split('state=')[1]!
      const parsed = parseQueryParams(extractedState, schema)

      expect(parsed).toEqual(data)
    })

    it('should work with fetch API simulation', () => {
      const schema = z.object({
        query: z.string(),
        filters: z.array(z.string())
      })

      const searchData = {
        query: 'test search',
        filters: ['category:tech', 'date:recent']
      }

      const params = createQueryParams(searchData, schema)
      const apiUrl = `https://api.example.com/search?${params.toURLSearchParamsString()}`

      expect(apiUrl).toContain('state=')

      // Parse back from URL
      const urlObj = new URL(apiUrl)
      const stateParam = urlObj.searchParams.get('state')
      expect(stateParam).toBeTruthy()

      const parsed = parseQueryParams(stateParam!, schema)
      expect(parsed).toEqual(searchData)
    })

    it('should handle large complex state objects', () => {
      const schema = z.object({
        filters: z.object({
          categories: z.array(z.string()),
          priceRange: z.object({
            min: z.number(),
            max: z.number()
          }),
          inStock: z.boolean()
        }),
        sort: z.object({
          field: z.string(),
          order: z.enum(['asc', 'desc'])
        }),
        pagination: z.object({
          page: z.number(),
          pageSize: z.number()
        })
      })

      const complexState = {
        filters: {
          categories: ['electronics', 'computers', 'accessories'],
          priceRange: {
            min: 100,
            max: 1000
          },
          inStock: true
        },
        sort: {
          field: 'price',
          order: 'asc' as const
        },
        pagination: {
          page: 1,
          pageSize: 20
        }
      }

      const params = createQueryParams(complexState, schema)
      const parsed = parseQueryParams(params, schema)

      expect(parsed).toEqual(complexState)
    })
  })
})
