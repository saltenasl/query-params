import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { encode } from './encoder.js'
import { decode } from './decoder.js'
import { createQueryParams } from './api.js'
import { createMigration, applyMigrations } from './migrations.js'

describe('README Examples', () => {
  describe('Quick Start Example', () => {
    it('should encode and decode search params', () => {
      const SearchParams = z.object({
        query: z.string(),
        filters: z.array(z.string()),
        page: z.number()
      })

      const data = {
        query: 'typescript',
        filters: ['books', 'articles'],
        page: 1
      }

      // Encode the data
      const encoded = encode(data, SearchParams)

      // Should be URL-safe
      expect(encoded).not.toMatch(/[+/=]/)
      expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/)

      // Decode it back
      const decoded = decode(encoded, SearchParams)
      expect(decoded).toEqual(data)

      console.log('Quick Start - Encoded:', encoded)
      console.log('Quick Start - Decoded:', decoded)
    })
  })

  describe('Client-Side State Example', () => {
    it('should handle complex nested state', () => {
      const FilterParams = z.object({
        search: z.string(),
        categories: z.array(z.string()),
        priceRange: z.object({
          min: z.number(),
          max: z.number()
        }),
        page: z.number()
      })

      const state = {
        search: 'laptop',
        categories: ['electronics', 'computers'],
        priceRange: { min: 500, max: 2000 },
        page: 1
      }

      const encoded = encode(state, FilterParams)
      const decoded = decode(encoded, FilterParams)

      expect(decoded).toEqual(state)
      expect(encoded).not.toMatch(/[+/=]/)

      console.log('Client-Side State - Encoded:', encoded)
      console.log('Client-Side State - Length:', encoded.length)
      console.log('Client-Side State - Decoded:', decoded)
    })
  })

  describe('Schema Versioning Example', () => {
    it('should migrate from v1 to v2', () => {
      // v1: Original schema
      const ParamsV1 = z.object({
        query: z.string()
      })

      // v2: Added filters
      const ParamsV2 = z.object({
        query: z.string(),
        filters: z.array(z.string())
      })

      // Define migration
      const v1ToV2 = createMigration({
        up: (v1: any) => ({ ...v1, filters: [] }),
        down: (v2: any) => ({ query: v2.query })
      })

      // Encode with v1
      const v1Data = { query: 'test' }
      const encodedV1 = encode(v1Data, ParamsV1, 1)

      // Migrate to v2
      const encodedV2 = applyMigrations(encodedV1, ParamsV1, ParamsV2, 2, [v1ToV2])

      // Decode as v2
      const decodedV2 = decode(encodedV2, ParamsV2)

      expect(decodedV2).toEqual({ query: 'test', filters: [] })

      console.log('Versioning - V1 Encoded:', encodedV1)
      console.log('Versioning - V2 Encoded:', encodedV2)
      console.log('Versioning - V2 Decoded:', decodedV2)
    })

    it('should migrate backwards from v2 to v1', () => {
      const ParamsV1 = z.object({
        query: z.string()
      })

      const ParamsV2 = z.object({
        query: z.string(),
        filters: z.array(z.string())
      })

      const v1ToV2 = createMigration({
        up: (v1: any) => ({ ...v1, filters: [] }),
        down: (v2: any) => ({ query: v2.query })
      })

      // Encode with v2
      const v2Data = { query: 'test', filters: ['a', 'b'] }
      const encodedV2 = encode(v2Data, ParamsV2, 2)

      // Migrate back to v1
      const encodedV1 = applyMigrations(encodedV2, ParamsV2, ParamsV1, 1, [v1ToV2])

      // Decode as v1
      const decodedV1 = decode(encodedV1, ParamsV1)

      expect(decodedV1).toEqual({ query: 'test' })

      console.log('Versioning Backward - V2 Encoded:', encodedV2)
      console.log('Versioning Backward - V1 Encoded:', encodedV1)
      console.log('Versioning Backward - V1 Decoded:', decodedV1)
    })
  })

  describe('API createQueryParams Example', () => {
    it('should work with createQueryParams', () => {
      const schema = z.object({
        query: z.string(),
        filters: z.array(z.string()),
        page: z.number()
      })

      const data = {
        query: 'typescript',
        filters: ['books', 'articles'],
        page: 1
      }

      const params = createQueryParams(data, schema)

      // Should be string coercible
      const encoded = String(params)
      expect(encoded).not.toMatch(/[+/=]/)

      // Should work in template literals
      const url = `/search?state=${params}`
      expect(url).toMatch(/^\/search\?state=[A-Za-z0-9_-]+$/)

      console.log('API - Encoded:', encoded)
      console.log('API - URL:', url)
    })
  })

  describe('Compression Comparison', () => {
    it('should show compression benefits', () => {
      const schema = z.object({
        query: z.string(),
        filter: z.array(z.string()),
        page: z.number(),
        sortBy: z.string(),
        order: z.string(),
        category: z.string()
      })

      const data = {
        query: 'typescript',
        filter: ['books', 'articles'],
        page: 1,
        sortBy: 'date',
        order: 'desc',
        category: 'programming'
      }

      // Our encoded version
      const encoded = encode(data, schema)

      // Traditional URLSearchParams version
      const traditional = new URLSearchParams()
      traditional.set('query', 'typescript')
      traditional.append('filter', 'books')
      traditional.append('filter', 'articles')
      traditional.set('page', '1')
      traditional.set('sortBy', 'date')
      traditional.set('order', 'desc')
      traditional.set('category', 'programming')
      const traditionalString = traditional.toString()

      console.log('\n=== Compression Comparison ===')
      console.log('Traditional URLSearchParams:', traditionalString)
      console.log('Traditional Length:', traditionalString.length)
      console.log('\nWith @encoded-state:', encoded)
      console.log('Encoded Length:', encoded.length)
      console.log('Compression Ratio:', Math.round((1 - encoded.length / traditionalString.length) * 100) + '%')
    })
  })

  describe('Various Data Types', () => {
    it('should handle booleans, numbers, arrays, and nested objects', () => {
      const schema = z.object({
        active: z.boolean(),
        count: z.number(),
        tags: z.array(z.string()),
        metadata: z.object({
          created: z.string(),
          updated: z.string()
        })
      })

      const data = {
        active: true,
        count: 42,
        tags: ['tech', 'javascript', 'typescript'],
        metadata: {
          created: '2024-01-01',
          updated: '2024-01-15'
        }
      }

      const encoded = encode(data, schema)
      const decoded = decode(encoded, schema)

      expect(decoded).toEqual(data)

      console.log('\n=== Various Data Types ===')
      console.log('Original:', JSON.stringify(data, null, 2))
      console.log('Encoded:', encoded)
      console.log('Encoded Length:', encoded.length)
      console.log('JSON Length:', JSON.stringify(data).length)
    })
  })

  describe('Optional Fields', () => {
    it('should handle optional fields', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional(),
        nullable: z.string().nullable().optional()
      })

      const withOptional = {
        required: 'test',
        optional: 'present'
      }

      const withoutOptional = {
        required: 'test'
      }

      const encoded1 = encode(withOptional, schema)
      const encoded2 = encode(withoutOptional, schema)

      const decoded1 = decode(encoded1, schema)
      const decoded2 = decode(encoded2, schema)

      expect(decoded1).toEqual(withOptional)
      expect(decoded2).toEqual(withoutOptional)

      console.log('\n=== Optional Fields ===')
      console.log('With optional - Encoded:', encoded1)
      console.log('With optional - Decoded:', decoded1)
      console.log('Without optional - Encoded:', encoded2)
      console.log('Without optional - Decoded:', decoded2)
    })
  })

  describe('Enum Support', () => {
    it('should handle enums', () => {
      const schema = z.object({
        status: z.enum(['active', 'pending', 'completed']),
        priority: z.enum(['high', 'medium', 'low'])
      })

      const data = {
        status: 'active' as const,
        priority: 'high' as const
      }

      const encoded = encode(data, schema)
      const decoded = decode(encoded, schema)

      expect(decoded).toEqual(data)

      console.log('\n=== Enum Support ===')
      console.log('Original:', data)
      console.log('Encoded:', encoded)
      console.log('Decoded:', decoded)
    })
  })
})
