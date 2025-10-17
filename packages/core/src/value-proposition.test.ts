import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { encode } from './encoder.js'

describe('Value Proposition - When @encoded-state Wins', () => {
  it('Complex nested objects - our sweet spot', () => {
    const schema = z.object({
      user: z.object({
        id: z.number(),
        name: z.string(),
        email: z.string()
      }),
      filters: z.array(z.object({
        field: z.string(),
        op: z.string(),
        value: z.string()
      })),
      pagination: z.object({
        page: z.number(),
        size: z.number()
      }),
      sort: z.array(z.object({
        field: z.string(),
        dir: z.string()
      }))
    })

    const data = {
      user: { id: 123, name: 'John Doe', email: 'john@example.com' },
      filters: [
        { field: 'status', op: 'eq', value: 'active' },
        { field: 'created', op: 'gt', value: '2024-01-01' }
      ],
      pagination: { page: 1, size: 20 },
      sort: [{ field: 'created', dir: 'desc' }]
    }

    const encoded = encode(data, schema)
    const jsonStr = JSON.stringify(data)

    console.log('\\n=== Complex Nested Data ===')
    console.log('JSON length:', jsonStr.length)
    console.log('Encoded length:', encoded.length)
    console.log('Reduction:', Math.round((1 - encoded.length / jsonStr.length) * 100) + '%')
    console.log('\\nJSON:', jsonStr)
    console.log('\\nEncoded:', encoded)

    // URLSearchParams would need to flatten everything
    const urlParams = new URLSearchParams()
    urlParams.set('user.id', '123')
    urlParams.set('user.name', 'John Doe')
    urlParams.set('user.email', 'john@example.com')
    urlParams.append('filters', JSON.stringify(data.filters[0]))
    urlParams.append('filters', JSON.stringify(data.filters[1]))
    urlParams.set('pagination', JSON.stringify(data.pagination))
    urlParams.set('sort', JSON.stringify(data.sort))
    const urlParamsStr = urlParams.toString()

    console.log('\\nURLSearchParams (flattened):', urlParamsStr.length, 'chars')
    console.log(urlParamsStr)

    expect(encoded.length).toBeLessThan(jsonStr.length)
    expect(encoded.length).toBeLessThan(urlParamsStr.length)
  })

  it('Arrays of strings - significant savings', () => {
    const schema = z.object({
      tags: z.array(z.string()),
      categories: z.array(z.string())
    })

    const data = {
      tags: ['javascript', 'typescript', 'react', 'node', 'web'],
      categories: ['programming', 'frontend', 'backend']
    }

    const encoded = encode(data, schema)

    // URLSearchParams with repeated keys
    const urlParams = new URLSearchParams()
    data.tags.forEach(tag => urlParams.append('tags', tag))
    data.categories.forEach(cat => urlParams.append('categories', cat))
    const urlParamsStr = urlParams.toString()

    console.log('\\n=== Arrays ===')
    console.log('URLSearchParams:', urlParamsStr.length, 'chars')
    console.log(urlParamsStr)
    console.log('\\nEncoded:', encoded.length, 'chars')
    console.log(encoded)
    console.log('\\nSavings:', Math.round((1 - encoded.length / urlParamsStr.length) * 100) + '%')

    expect(encoded.length).toBeLessThan(urlParamsStr.length)
  })

  it('Large repetitive data - compression shines', () => {
    const schema = z.object({
      items: z.array(z.object({
        id: z.number(),
        name: z.string(),
        description: z.string(),
        price: z.number(),
        inStock: z.boolean()
      }))
    })

    const data = {
      items: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
        description: `This is a description for product ${i + 1}`,
        price: (i + 1) * 10.99,
        inStock: i % 2 === 0
      }))
    }

    const encoded = encode(data, schema)
    const jsonStr = JSON.stringify(data)

    console.log('\\n=== Large Repetitive Data ===')
    console.log('JSON length:', jsonStr.length)
    console.log('Encoded length:', encoded.length)
    console.log('Compression ratio:', Math.round((1 - encoded.length / jsonStr.length) * 100) + '%')

    expect(encoded.length).toBeLessThan(jsonStr.length * 0.8) // At least 20% reduction
  })

  it('When URLSearchParams is better - simple key-values', () => {
    const schema = z.object({
      q: z.string(),
      page: z.number()
    })

    const data = { q: 'test', page: 1 }
    const encoded = encode(data, schema)
    const urlParamsStr = 'q=test&page=1'

    console.log('\\n=== Simple Key-Value (URLSearchParams Wins) ===')
    console.log('URLSearchParams:', urlParamsStr.length, 'chars -', urlParamsStr)
    console.log('Encoded:', encoded.length, 'chars -', encoded)
    console.log('Verdict: Use regular URLSearchParams for simple cases!')

    // This is OK - we're not optimizing for simple cases
  })
})
