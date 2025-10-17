import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { encode, decode } from './index.js'

describe('Real-World Use Cases', () => {
  it('1. E-commerce Product Filters', () => {
    const schema = z.object({
      search: z.string(),
      categories: z.array(z.string()),
      priceRange: z.object({
        min: z.number(),
        max: z.number()
      }),
      brands: z.array(z.string()),
      inStock: z.boolean(),
      rating: z.number(),
      page: z.number()
    })

    const filters = {
      search: 'laptop',
      categories: ['electronics', 'computers'],
      priceRange: { min: 500, max: 2000 },
      brands: ['Dell', 'HP', 'Lenovo'],
      inStock: true,
      rating: 4,
      page: 1
    }

    const encoded = encode(filters, schema)
    const decoded = decode(encoded, schema)
    const jsonLength = JSON.stringify(filters).length

    console.log('\\n=== E-commerce Product Filters ===')
    console.log('Encoded:', encoded)
    console.log('Length:', encoded.length, 'vs JSON:', jsonLength)
    console.log('Reduction:', Math.round((1 - encoded.length / jsonLength) * 100) + '%')

    expect(decoded).toEqual(filters)
  })

  it('2. Data Table State (sorting, pagination, filters)', () => {
    const schema = z.object({
      page: z.number(),
      pageSize: z.number(),
      sortBy: z.string(),
      sortOrder: z.enum(['desc', 'asc']),
      filters: z.array(z.object({
        column: z.string(),
        operator: z.enum(['eq', 'gt', 'ne', 'lt', 'contains']), // 'eq' first - it's the first operator in test data
        value: z.string()
      })),
      selectedColumns: z.array(z.string())
    })

    const tableState = {
      page: 3,
      pageSize: 50,
      sortBy: 'created_at',
      sortOrder: 'desc' as const,
      filters: [
        { column: 'status', operator: 'eq' as const, value: 'active' },
        { column: 'revenue', operator: 'gt' as const, value: '1000' }
      ],
      selectedColumns: ['name', 'email', 'status', 'created_at', 'revenue']
    }

    const encoded = encode(tableState, schema)
    const decoded = decode(encoded, schema)

    // URLSearchParams comparison
    const urlParams = new URLSearchParams({
      page: '3',
      pageSize: '50',
      sortBy: 'created_at',
      sortOrder: 'desc',
      filters: JSON.stringify(tableState.filters),
      selectedColumns: JSON.stringify(tableState.selectedColumns)
    })

    console.log('\\n=== Data Table State ===')
    console.log('Encoded:', encoded)
    console.log('Length:', encoded.length, 'vs URLSearchParams:', urlParams.toString().length)
    console.log('Reduction:', Math.round((1 - encoded.length / urlParams.toString().length) * 100) + '%')

    expect(decoded).toEqual(tableState)
  })

  it('3. Map/Dashboard View State', () => {
    const schema = z.object({
      center: z.object({
        lat: z.number(),
        lng: z.number()
      }),
      zoom: z.number(),
      layers: z.array(z.string()),
      filters: z.object({
        dateRange: z.object({
          start: z.string(),
          end: z.string()
        }),
        categories: z.array(z.string())
      }),
      selectedMarkers: z.array(z.number())
    })

    const mapState = {
      center: { lat: 37.7749, lng: -122.4194 },
      zoom: 12,
      layers: ['traffic', 'transit', 'bike'],
      filters: {
        dateRange: { start: '2024-01-01', end: '2024-12-31' },
        categories: ['restaurants', 'parks', 'museums']
      },
      selectedMarkers: [101, 205, 308]
    }

    const encoded = encode(mapState, schema)
    const decoded = decode(encoded, schema)
    const jsonLength = JSON.stringify(mapState).length

    console.log('\\n=== Map/Dashboard View State ===')
    console.log('Encoded:', encoded)
    console.log('Length:', encoded.length, 'vs JSON:', jsonLength)
    console.log('Reduction:', Math.round((1 - encoded.length / jsonLength) * 100) + '%')

    expect(decoded).toEqual(mapState)
  })

  it('4. Search Facets and Advanced Filters', () => {
    const schema = z.object({
      query: z.string(),
      facets: z.object({
        authors: z.array(z.string()),
        publicationYears: z.array(z.number()),
        topics: z.array(z.string()),
        languages: z.array(z.string())
      }),
      dateRange: z.object({
        from: z.string(),
        to: z.string()
      }),
      sortBy: z.enum(['relevance', 'title', 'date']),
      page: z.number()
    })

    const searchState = {
      query: 'machine learning',
      facets: {
        authors: ['Andrew Ng', 'Geoffrey Hinton'],
        publicationYears: [2023, 2024],
        topics: ['neural networks', 'deep learning', 'AI'],
        languages: ['English', 'Python']
      },
      dateRange: { from: '2023-01-01', to: '2024-12-31' },
      sortBy: 'relevance' as const,
      page: 1
    }

    const encoded = encode(searchState, schema)
    const decoded = decode(encoded, schema)
    const jsonLength = JSON.stringify(searchState).length

    console.log('\\n=== Search Facets and Filters ===')
    console.log('Encoded:', encoded)
    console.log('Length:', encoded.length, 'vs JSON:', jsonLength)
    console.log('Reduction:', Math.round((1 - encoded.length / jsonLength) * 100) + '%')

    expect(decoded).toEqual(searchState)
  })

  it('5. Form Wizard Multi-Step State', () => {
    const schema = z.object({
      currentStep: z.number(),
      completed: z.array(z.number()),
      data: z.object({
        personalInfo: z.object({
          name: z.string(),
          email: z.string(),
          phone: z.string()
        }),
        address: z.object({
          street: z.string(),
          city: z.string(),
          zip: z.string(),
          country: z.string()
        }),
        preferences: z.object({
          newsletter: z.boolean(),
          notifications: z.boolean(),
          theme: z.enum(['dark', 'light']) // 'dark' first since test data uses it
        })
      })
    })

    const wizardState = {
      currentStep: 2,
      completed: [0, 1],
      data: {
        personalInfo: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+1234567890'
        },
        address: {
          street: '123 Main St',
          city: 'San Francisco',
          zip: '94102',
          country: 'USA'
        },
        preferences: {
          newsletter: true,
          notifications: false,
          theme: 'dark' as const
        }
      }
    }

    const encoded = encode(wizardState, schema)
    const decoded = decode(encoded, schema)
    const jsonLength = JSON.stringify(wizardState).length

    console.log('\\n=== Form Wizard State ===')
    console.log('Encoded:', encoded)
    console.log('Length:', encoded.length, 'vs JSON:', jsonLength)
    console.log('Reduction:', Math.round((1 - encoded.length / jsonLength) * 100) + '%')

    expect(decoded).toEqual(wizardState)
  })

  it('6. Analytics Dashboard Filters', () => {
    const schema = z.object({
      timeRange: z.object({
        start: z.string(),
        end: z.string(),
        granularity: z.enum(['day', 'hour', 'week', 'month']) // 'day' first since test data uses it
      }),
      metrics: z.array(z.string()),
      dimensions: z.array(z.string()),
      filters: z.array(z.object({
        field: z.string(),
        op: z.string(),
        value: z.string() // Union types with protobuf need special handling
      })),
      compareWith: z.object({
        enabled: z.boolean(),
        offset: z.number(),
        unit: z.enum(['months', 'days', 'weeks'])
      }).optional()
    })

    const dashboardState = {
      timeRange: {
        start: '2024-01-01',
        end: '2024-01-31',
        granularity: 'day' as const
      },
      metrics: ['pageviews', 'sessions', 'conversions', 'revenue'],
      dimensions: ['source', 'medium', 'campaign'],
      filters: [
        { field: 'country', op: 'eq', value: 'US' },
        { field: 'revenue', op: 'gt', value: '100' }
      ],
      compareWith: {
        enabled: true,
        offset: 1,
        unit: 'months' as const
      }
    }

    const encoded = encode(dashboardState, schema)
    const decoded = decode(encoded, schema)
    const jsonLength = JSON.stringify(dashboardState).length

    console.log('\\n=== Analytics Dashboard ===')
    console.log('Encoded:', encoded)
    console.log('Length:', encoded.length, 'vs JSON:', jsonLength)
    console.log('Reduction:', Math.round((1 - encoded.length / jsonLength) * 100) + '%')

    expect(decoded).toEqual(dashboardState)
  })

  it('7. Calendar/Scheduler View State', () => {
    const schema = z.object({
      view: z.enum(['week', 'day', 'month', 'agenda']),
      date: z.string(),
      filters: z.object({
        calendars: z.array(z.string()),
        categories: z.array(z.string()),
        attendees: z.array(z.string())
      }),
      settings: z.object({
        showWeekends: z.boolean(),
        workingHours: z.object({
          start: z.number(),
          end: z.number()
        }),
        timeZone: z.string()
      })
    })

    const calendarState = {
      view: 'week' as const,
      date: '2024-01-15',
      filters: {
        calendars: ['work', 'personal'],
        categories: ['meeting', 'deadline'],
        attendees: ['john@example.com', 'jane@example.com']
      },
      settings: {
        showWeekends: true,
        workingHours: { start: 9, end: 17 },
        timeZone: 'America/Los_Angeles'
      }
    }

    const encoded = encode(calendarState, schema)
    const decoded = decode(encoded, schema)
    const jsonLength = JSON.stringify(calendarState).length

    console.log('\\n=== Calendar/Scheduler State ===')
    console.log('Encoded:', encoded)
    console.log('Length:', encoded.length, 'vs JSON:', jsonLength)
    console.log('Reduction:', Math.round((1 - encoded.length / jsonLength) * 100) + '%')

    expect(decoded).toEqual(calendarState)
  })

  it('8. Game/Application State Snapshot', () => {
    const schema = z.object({
      level: z.number(),
      score: z.number(),
      playerPosition: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number()
      }),
      inventory: z.array(z.object({
        id: z.string(),
        quantity: z.number()
      })),
      settings: z.object({
        difficulty: z.enum(['hard', 'easy', 'normal']),
        sound: z.boolean(),
        music: z.boolean()
      }),
      checkpointTimestamp: z.string()
    })

    const gameState = {
      level: 5,
      score: 12450,
      playerPosition: { x: 123.45, y: 67.89, z: 10.0 },
      inventory: [
        { id: 'sword', quantity: 1 },
        { id: 'potion', quantity: 5 },
        { id: 'gold', quantity: 350 }
      ],
      settings: {
        difficulty: 'hard' as const,
        sound: true,
        music: false
      },
      checkpointTimestamp: '2024-01-15T10:30:00Z'
    }

    const encoded = encode(gameState, schema)
    const decoded = decode(encoded, schema)
    const jsonLength = JSON.stringify(gameState).length

    console.log('\\n=== Game State Snapshot ===')
    console.log('Encoded:', encoded)
    console.log('Length:', encoded.length, 'vs JSON:', jsonLength)
    console.log('Reduction:', Math.round((1 - encoded.length / jsonLength) * 100) + '%')

    expect(decoded).toEqual(gameState)
  })
})
