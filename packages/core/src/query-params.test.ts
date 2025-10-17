import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { EncodedQueryParams } from './query-params'
import { ValidationError } from './errors'

describe('EncodedQueryParams', () => {
  describe('constructor', () => {
    it('should create instance from data object', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const params = new EncodedQueryParams({ name: 'Alice', age: 30 }, schema)

      expect(params).toBeInstanceOf(EncodedQueryParams)
      expect(params.get('name')).toBe('Alice')
      expect(params.get('age')).toBe('30')
    })

    it('should create instance from encoded string', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const originalData = { name: 'Bob', age: 25 }
      const params1 = new EncodedQueryParams(originalData, schema)
      const encoded = params1.toString()

      const params2 = new EncodedQueryParams(encoded, schema)

      expect(params2.get('name')).toBe('Bob')
      expect(params2.get('age')).toBe('25')
    })

    it('should validate data against schema', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      expect(() => {
        new EncodedQueryParams({ name: 'Alice', age: 'invalid' } as any, schema)
      }).toThrow()
    })

    it('should throw if schema is not z.object()', () => {
      const schema = z.string()

      expect(() => {
        new EncodedQueryParams('test', schema as any)
      }).toThrow(ValidationError)
      expect(() => {
        new EncodedQueryParams('test', schema as any)
      }).toThrow('EncodedQueryParams requires a z.object() schema')
    })

    it('should accept custom version number', () => {
      const schema = z.object({
        value: z.string()
      })

      const params = new EncodedQueryParams({ value: 'test' }, schema, 5)

      expect(params).toBeInstanceOf(EncodedQueryParams)
      expect(params.get('value')).toBe('test')
    })

    it('should handle complex nested objects', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          profile: z.object({
            bio: z.string(),
            age: z.number()
          })
        })
      })

      const data = {
        user: {
          name: 'Charlie',
          profile: {
            bio: 'Developer',
            age: 28
          }
        }
      }

      const params = new EncodedQueryParams(data, schema)

      expect(params.get('user')).toBe('[object Object]')
      expect(params.getRaw('user')).toEqual(data.user)
    })

    it('should handle arrays', () => {
      const schema = z.object({
        items: z.array(z.string()),
        numbers: z.array(z.number())
      })

      const data = {
        items: ['apple', 'banana', 'cherry'],
        numbers: [1, 2, 3]
      }

      const params = new EncodedQueryParams(data, schema)

      expect(params.getRaw('items')).toEqual(['apple', 'banana', 'cherry'])
      expect(params.getRaw('numbers')).toEqual([1, 2, 3])
    })

    it('should handle optional fields', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional()
      })

      const withOptional = new EncodedQueryParams(
        { required: 'test', optional: 'present' },
        schema
      )
      const withoutOptional = new EncodedQueryParams(
        { required: 'test' },
        schema
      )

      expect(withOptional.get('optional')).toBe('present')
      expect(withoutOptional.get('optional')).toBe(null)
    })

    it('should handle boolean values', () => {
      const schema = z.object({
        isActive: z.boolean(),
        isVerified: z.boolean()
      })

      const params = new EncodedQueryParams(
        { isActive: true, isVerified: false },
        schema
      )

      expect(params.get('isActive')).toBe('true')
      expect(params.get('isVerified')).toBe('false')
      expect(params.getRaw('isActive')).toBe(true)
      expect(params.getRaw('isVerified')).toBe(false)
    })

    it('should handle enum values', () => {
      const schema = z.object({
        role: z.enum(['admin', 'user', 'guest']),
        status: z.enum(['active', 'inactive'])
      })

      const params = new EncodedQueryParams(
        { role: 'admin', status: 'active' },
        schema
      )

      expect(params.get('role')).toBe('admin')
      expect(params.get('status')).toBe('active')
    })
  })

  describe('get()', () => {
    it('should return string value for existing parameter', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const params = new EncodedQueryParams({ name: 'Alice', age: 30 }, schema)

      expect(params.get('name')).toBe('Alice')
      expect(params.get('age')).toBe('30')
    })

    it('should return null for non-existent parameter', () => {
      const schema = z.object({
        name: z.string()
      })

      const params = new EncodedQueryParams({ name: 'Alice' }, schema)

      expect(params.get('nonexistent')).toBe(null)
    })

    it('should return null for undefined values', () => {
      const schema = z.object({
        name: z.string(),
        optional: z.string().optional()
      })

      const params = new EncodedQueryParams({ name: 'Alice' }, schema)

      expect(params.get('optional')).toBe(null)
    })

    it('should convert numbers to strings', () => {
      const schema = z.object({
        count: z.number(),
        price: z.number()
      })

      const params = new EncodedQueryParams({ count: 42, price: 99.99 }, schema)

      expect(params.get('count')).toBe('42')
      expect(params.get('price')).toBe('99.99')
    })

    it('should convert booleans to strings', () => {
      const schema = z.object({
        active: z.boolean()
      })

      const params = new EncodedQueryParams({ active: true }, schema)

      expect(params.get('active')).toBe('true')
    })

    it('should convert objects to string representation', () => {
      const schema = z.object({
        nested: z.object({
          value: z.string()
        })
      })

      const params = new EncodedQueryParams(
        { nested: { value: 'test' } },
        schema
      )

      expect(params.get('nested')).toBe('[object Object]')
    })

    it('should convert arrays to string representation', () => {
      const schema = z.object({
        items: z.array(z.string())
      })

      const params = new EncodedQueryParams({ items: ['a', 'b', 'c'] }, schema)

      expect(params.get('items')).toBe('a,b,c')
    })
  })

  describe('getAll()', () => {
    it('should return array with single value for existing parameter', () => {
      const schema = z.object({
        name: z.string()
      })

      const params = new EncodedQueryParams({ name: 'Alice' }, schema)

      expect(params.getAll('name')).toEqual(['Alice'])
    })

    it('should return empty array for non-existent parameter', () => {
      const schema = z.object({
        name: z.string()
      })

      const params = new EncodedQueryParams({ name: 'Alice' }, schema)

      expect(params.getAll('nonexistent')).toEqual([])
    })
  })

  describe('getRaw()', () => {
    it('should return typed value without string conversion', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
        active: z.boolean()
      })

      const params = new EncodedQueryParams(
        { name: 'Alice', age: 30, active: true },
        schema
      )

      expect(params.getRaw('name')).toBe('Alice')
      expect(params.getRaw('age')).toBe(30)
      expect(params.getRaw('active')).toBe(true)
    })

    it('should return undefined for non-existent parameter', () => {
      const schema = z.object({
        name: z.string()
      })

      const params = new EncodedQueryParams({ name: 'Alice' }, schema)

      expect(params.getRaw('nonexistent')).toBe(undefined)
    })

    it('should return complex objects as-is', () => {
      const schema = z.object({
        nested: z.object({
          value: z.string(),
          count: z.number()
        })
      })

      const data = { nested: { value: 'test', count: 42 } }
      const params = new EncodedQueryParams(data, schema)

      expect(params.getRaw('nested')).toEqual({ value: 'test', count: 42 })
    })

    it('should return arrays as-is', () => {
      const schema = z.object({
        items: z.array(z.string())
      })

      const params = new EncodedQueryParams({ items: ['a', 'b', 'c'] }, schema)

      expect(params.getRaw('items')).toEqual(['a', 'b', 'c'])
    })
  })

  describe('set()', () => {
    it('should set parameter value', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const params = new EncodedQueryParams({ name: 'Alice', age: 30 }, schema)

      params.set('name', 'Bob')

      expect(params.get('name')).toBe('Bob')
    })

    it('should validate new value against schema', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const params = new EncodedQueryParams({ name: 'Alice', age: 30 }, schema)

      expect(() => {
        params.set('age', 'invalid')
      }).toThrow()
    })

    it('should allow setting optional fields', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional()
      })

      const params = new EncodedQueryParams({ required: 'test' }, schema)

      params.set('optional', 'now present')

      expect(params.get('optional')).toBe('now present')
    })

    it('should update existing values', () => {
      const schema = z.object({
        count: z.number()
      })

      const params = new EncodedQueryParams({ count: 10 }, schema)

      params.set('count', 20)

      expect(params.getRaw('count')).toBe(20)
    })
  })

  describe('has()', () => {
    it('should return true for existing parameter', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const params = new EncodedQueryParams({ name: 'Alice', age: 30 }, schema)

      expect(params.has('name')).toBe(true)
      expect(params.has('age')).toBe(true)
    })

    it('should return false for non-existent parameter', () => {
      const schema = z.object({
        name: z.string()
      })

      const params = new EncodedQueryParams({ name: 'Alice' }, schema)

      expect(params.has('nonexistent')).toBe(false)
    })

    it('should return false for undefined optional parameter', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional()
      })

      const params = new EncodedQueryParams({ required: 'test' }, schema)

      expect(params.has('optional')).toBe(false)
    })

    it('should return true for defined optional parameter', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional()
      })

      const params = new EncodedQueryParams(
        { required: 'test', optional: 'present' },
        schema
      )

      expect(params.has('optional')).toBe(true)
    })
  })

  describe('delete()', () => {
    it('should delete optional parameter', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional()
      })

      const params = new EncodedQueryParams(
        { required: 'test', optional: 'present' },
        schema
      )

      params.delete('optional')

      expect(params.has('optional')).toBe(false)
      expect(params.get('optional')).toBe(null)
    })

    it('should throw when deleting required parameter', () => {
      const schema = z.object({
        required: z.string()
      })

      const params = new EncodedQueryParams({ required: 'test' }, schema)

      expect(() => {
        params.delete('required')
      }).toThrow()
    })

    it('should not throw when deleting non-existent parameter', () => {
      const schema = z.object({
        name: z.string()
      })

      const params = new EncodedQueryParams({ name: 'test' }, schema)

      // Deleting non-existent parameter should validate successfully
      expect(() => {
        params.delete('nonexistent')
      }).not.toThrow()
    })
  })

  describe('append()', () => {
    it('should append value to array parameter', () => {
      const schema = z.object({
        items: z.array(z.string())
      })

      const params = new EncodedQueryParams({ items: ['a', 'b'] }, schema)

      params.append('items', 'c')

      expect(params.getRaw('items')).toEqual(['a', 'b', 'c'])
    })

    it('should throw when appending to non-existent parameter', () => {
      const schema = z.object({
        items: z.array(z.string())
      })

      const params = new EncodedQueryParams({ items: ['a'] }, schema)

      expect(() => {
        params.append('nonexistent', 'value')
      }).toThrow(ValidationError)
      expect(() => {
        params.append('nonexistent', 'value')
      }).toThrow('Cannot append to non-existent parameter')
    })

    it('should throw when appending to non-array parameter', () => {
      const schema = z.object({
        name: z.string()
      })

      const params = new EncodedQueryParams({ name: 'test' }, schema)

      expect(() => {
        params.append('name', 'value')
      }).toThrow(ValidationError)
      expect(() => {
        params.append('name', 'value')
      }).toThrow('Cannot append to non-array parameter')
    })

    it('should validate appended value', () => {
      const schema = z.object({
        numbers: z.array(z.number())
      })

      const params = new EncodedQueryParams({ numbers: [1, 2] }, schema)

      expect(() => {
        params.append('numbers', 'invalid')
      }).toThrow()
    })

    it('should append multiple values', () => {
      const schema = z.object({
        items: z.array(z.string())
      })

      const params = new EncodedQueryParams({ items: ['a'] }, schema)

      params.append('items', 'b')
      params.append('items', 'c')
      params.append('items', 'd')

      expect(params.getRaw('items')).toEqual(['a', 'b', 'c', 'd'])
    })
  })

  describe('entries()', () => {
    it('should iterate over all key-value pairs', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const params = new EncodedQueryParams({ name: 'Alice', age: 30 }, schema)

      const entries = Array.from(params.entries())

      expect(entries).toEqual([
        ['name', 'Alice'],
        ['age', '30']
      ])
    })

    it('should skip undefined values', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional()
      })

      const params = new EncodedQueryParams({ required: 'test' }, schema)

      const entries = Array.from(params.entries())

      expect(entries).toEqual([['required', 'test']])
    })

    it('should work with for...of loop', () => {
      const schema = z.object({
        a: z.string(),
        b: z.string()
      })

      const params = new EncodedQueryParams({ a: 'A', b: 'B' }, schema)

      const result: [string, string][] = []
      for (const [key, value] of params.entries()) {
        result.push([key, value])
      }

      expect(result).toEqual([
        ['a', 'A'],
        ['b', 'B']
      ])
    })
  })

  describe('keys()', () => {
    it('should iterate over all parameter names', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const params = new EncodedQueryParams({ name: 'Alice', age: 30 }, schema)

      const keys = Array.from(params.keys())

      expect(keys).toEqual(['name', 'age'])
    })

    it('should skip undefined values', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional()
      })

      const params = new EncodedQueryParams({ required: 'test' }, schema)

      const keys = Array.from(params.keys())

      expect(keys).toEqual(['required'])
    })
  })

  describe('values()', () => {
    it('should iterate over all parameter values', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const params = new EncodedQueryParams({ name: 'Alice', age: 30 }, schema)

      const values = Array.from(params.values())

      expect(values).toEqual(['Alice', '30'])
    })

    it('should skip undefined values', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional()
      })

      const params = new EncodedQueryParams({ required: 'test' }, schema)

      const values = Array.from(params.values())

      expect(values).toEqual(['test'])
    })
  })

  describe('forEach()', () => {
    it('should execute callback for each parameter', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const params = new EncodedQueryParams({ name: 'Alice', age: 30 }, schema)

      const result: Array<[string, string]> = []
      params.forEach((value, key) => {
        result.push([key, value])
      })

      expect(result).toEqual([
        ['name', 'Alice'],
        ['age', '30']
      ])
    })

    it('should pass correct arguments to callback', () => {
      const schema = z.object({
        name: z.string()
      })

      const params = new EncodedQueryParams({ name: 'Alice' }, schema)

      params.forEach((value, key, parent) => {
        expect(value).toBe('Alice')
        expect(key).toBe('name')
        expect(parent).toBe(params)
      })
    })

    it('should support thisArg parameter', () => {
      const schema = z.object({
        name: z.string()
      })

      const params = new EncodedQueryParams({ name: 'Alice' }, schema)

      const context = { result: '' }
      params.forEach(function (this: typeof context, value) {
        this.result = value
      }, context)

      expect(context.result).toBe('Alice')
    })

    it('should skip undefined values', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional()
      })

      const params = new EncodedQueryParams({ required: 'test' }, schema)

      const keys: string[] = []
      params.forEach((_, key) => {
        keys.push(key)
      })

      expect(keys).toEqual(['required'])
    })
  })

  describe('sort()', () => {
    it('should sort parameters alphabetically', () => {
      const schema = z.object({
        zebra: z.string(),
        apple: z.string(),
        middle: z.string()
      })

      const params = new EncodedQueryParams(
        { zebra: 'z', apple: 'a', middle: 'm' },
        schema
      )

      params.sort()

      const keys = Array.from(params.keys())
      expect(keys).toEqual(['apple', 'middle', 'zebra'])
    })

    it('should affect iteration order', () => {
      const schema = z.object({
        c: z.string(),
        a: z.string(),
        b: z.string()
      })

      const params = new EncodedQueryParams({ c: '3', a: '1', b: '2' }, schema)

      params.sort()

      const entries = Array.from(params.entries())
      expect(entries).toEqual([
        ['a', '1'],
        ['b', '2'],
        ['c', '3']
      ])
    })
  })

  describe('toString()', () => {
    it('should return encoded string', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const params = new EncodedQueryParams({ name: 'Alice', age: 30 }, schema)

      const encoded = params.toString()

      expect(typeof encoded).toBe('string')
      expect(encoded.length).toBeGreaterThan(0)
    })

    it('should produce decodable string', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const originalData = { name: 'Bob', age: 25 }
      const params1 = new EncodedQueryParams(originalData, schema)
      const encoded = params1.toString()

      const params2 = new EncodedQueryParams(encoded, schema)

      expect(params2.toObject()).toEqual(originalData)
    })

    it('should use custom version if provided', () => {
      const schema = z.object({
        value: z.string()
      })

      const params = new EncodedQueryParams({ value: 'test' }, schema, 5)

      const encoded = params.toString()

      // Should be able to decode back
      const decoded = new EncodedQueryParams(encoded, schema)
      expect(decoded.get('value')).toBe('test')
    })
  })

  describe('toObject()', () => {
    it('should return raw data object', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
        active: z.boolean()
      })

      const originalData = { name: 'Alice', age: 30, active: true }
      const params = new EncodedQueryParams(originalData, schema)

      const obj = params.toObject()

      expect(obj).toEqual(originalData)
    })

    it('should return a copy, not the original', () => {
      const schema = z.object({
        name: z.string()
      })

      const params = new EncodedQueryParams({ name: 'Alice' }, schema)

      const obj = params.toObject()
      obj.name = 'Bob'

      expect(params.get('name')).toBe('Alice')
    })

    it('should handle complex nested objects', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          profile: z.object({
            bio: z.string()
          })
        })
      })

      const data = {
        user: {
          name: 'Charlie',
          profile: {
            bio: 'Developer'
          }
        }
      }

      const params = new EncodedQueryParams(data, schema)

      expect(params.toObject()).toEqual(data)
    })
  })

  describe('size', () => {
    it('should return number of parameters', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
        active: z.boolean()
      })

      const params = new EncodedQueryParams(
        { name: 'Alice', age: 30, active: true },
        schema
      )

      expect(params.size).toBe(3)
    })

    it('should not count undefined values', () => {
      const schema = z.object({
        required: z.string(),
        optional1: z.string().optional(),
        optional2: z.string().optional()
      })

      const params = new EncodedQueryParams({ required: 'test' }, schema)

      expect(params.size).toBe(1)
    })

    it('should update after set/delete operations', () => {
      const schema = z.object({
        a: z.string(),
        b: z.string().optional()
      })

      const params = new EncodedQueryParams({ a: 'A' }, schema)

      expect(params.size).toBe(1)

      params.set('b', 'B')
      expect(params.size).toBe(2)

      params.delete('b')
      expect(params.size).toBe(1)
    })
  })

  describe('Symbol.iterator', () => {
    it('should make instance iterable with for...of', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const params = new EncodedQueryParams({ name: 'Alice', age: 30 }, schema)

      const result: [string, string][] = []
      for (const [key, value] of params) {
        result.push([key, value])
      }

      expect(result).toEqual([
        ['name', 'Alice'],
        ['age', '30']
      ])
    })

    it('should work with spread operator', () => {
      const schema = z.object({
        a: z.string(),
        b: z.string()
      })

      const params = new EncodedQueryParams({ a: 'A', b: 'B' }, schema)

      const entries = [...params]

      expect(entries).toEqual([
        ['a', 'A'],
        ['b', 'B']
      ])
    })

    it('should work with Array.from()', () => {
      const schema = z.object({
        x: z.string(),
        y: z.string()
      })

      const params = new EncodedQueryParams({ x: 'X', y: 'Y' }, schema)

      const entries = Array.from(params)

      expect(entries).toEqual([
        ['x', 'X'],
        ['y', 'Y']
      ])
    })
  })

  describe('round-trip encoding/decoding', () => {
    it('should maintain data integrity through encoding/decoding', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
        active: z.boolean(),
        tags: z.array(z.string())
      })

      const originalData = {
        name: 'Alice',
        age: 30,
        active: true,
        tags: ['developer', 'typescript']
      }

      const params1 = new EncodedQueryParams(originalData, schema)
      const encoded = params1.toString()
      const params2 = new EncodedQueryParams(encoded, schema)

      expect(params2.toObject()).toEqual(originalData)
    })

    it('should maintain data through multiple round trips', () => {
      const schema = z.object({
        value: z.string(),
        count: z.number()
      })

      const originalData = { value: 'test', count: 42 }

      let params = new EncodedQueryParams(originalData, schema)

      for (let i = 0; i < 3; i++) {
        const encoded = params.toString()
        params = new EncodedQueryParams(encoded, schema)
      }

      expect(params.toObject()).toEqual(originalData)
    })
  })

  describe('integration with URLSearchParams API', () => {
    it('should mimic URLSearchParams behavior', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const params = new EncodedQueryParams({ name: 'Alice', age: 30 }, schema)

      // Similar API to URLSearchParams
      expect(params.get('name')).toBe('Alice')
      expect(params.has('name')).toBe(true)
      expect(params.has('nonexistent')).toBe(false)
      expect(Array.from(params.keys())).toContain('name')
      expect(Array.from(params.values())).toContain('Alice')
    })

    it('should work in URL building scenarios', () => {
      const schema = z.object({
        query: z.string(),
        page: z.number()
      })

      const params = new EncodedQueryParams({ query: 'search', page: 1 }, schema)
      const encoded = params.toString()

      const url = `https://example.com/api?state=${encodeURIComponent(encoded)}`

      expect(url).toContain('state=')

      // Parse back
      const stateParam = decodeURIComponent(url.split('state=')[1]!)
      const decoded = new EncodedQueryParams(stateParam, schema)

      expect(decoded.get('query')).toBe('search')
      expect(decoded.getRaw('page')).toBe(1)
    })
  })

  describe('edge cases', () => {
    it('should handle empty object', () => {
      const schema = z.object({})

      const params = new EncodedQueryParams({}, schema)

      expect(params.size).toBe(0)
      expect(Array.from(params.keys())).toEqual([])
    })

    it('should handle very large numbers', () => {
      const schema = z.object({
        bigNumber: z.number()
      })

      const params = new EncodedQueryParams(
        { bigNumber: Number.MAX_SAFE_INTEGER },
        schema
      )

      expect(params.getRaw('bigNumber')).toBe(Number.MAX_SAFE_INTEGER)
    })

    it('should handle empty strings', () => {
      const schema = z.object({
        empty: z.string()
      })

      const params = new EncodedQueryParams({ empty: '' }, schema)

      expect(params.get('empty')).toBe('')
    })

    it('should handle empty arrays', () => {
      const schema = z.object({
        items: z.array(z.string())
      })

      const params = new EncodedQueryParams({ items: [] }, schema)

      expect(params.getRaw('items')).toEqual([])
    })

    it('should handle special characters in strings', () => {
      const schema = z.object({
        special: z.string()
      })

      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`'
      const params = new EncodedQueryParams({ special: specialChars }, schema)

      const encoded = params.toString()
      const decoded = new EncodedQueryParams(encoded, schema)

      expect(decoded.get('special')).toBe(specialChars)
    })

    it('should handle unicode characters', () => {
      const schema = z.object({
        unicode: z.string()
      })

      const unicodeText = 'Hello 世界 🌍 Привет'
      const params = new EncodedQueryParams({ unicode: unicodeText }, schema)

      const encoded = params.toString()
      const decoded = new EncodedQueryParams(encoded, schema)

      expect(decoded.get('unicode')).toBe(unicodeText)
    })
  })
})
