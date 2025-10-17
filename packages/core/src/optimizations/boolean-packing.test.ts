import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  extractBooleanFields,
  extractBooleanValues,
  packBooleans,
  unpackBooleans,
  restoreBooleanValues,
  removeBooleanFields,
  shouldPackBooleans
} from './boolean-packing.js'

describe('Boolean Bit-Packing', () => {
  it('should extract boolean fields in deterministic order', () => {
    const schema = z.object({
      active: z.boolean(),
      verified: z.boolean(),
      premium: z.boolean()
    })

    // Extract fields multiple times
    const fields1 = extractBooleanFields(schema)
    const fields2 = extractBooleanFields(schema)
    const fields3 = extractBooleanFields(schema)

    // Should produce same order every time
    expect(fields1).toEqual(fields2)
    expect(fields2).toEqual(fields3)

    // Check field order (sorted alphabetically due to Object.keys().sort())
    expect(fields1.map(f => f.path.join('.'))).toEqual(['active', 'premium', 'verified'])
  })

  it('should pack 8 booleans into 1 byte', () => {
    const values = [true, false, true, true, false, false, true, false]
    const packed = packBooleans(values)

    expect(packed.length).toBe(1)
    // Bits: bit0=1, bit1=0, bit2=1, bit3=1, bit4=0, bit5=0, bit6=1, bit7=0
    // = 0b01001101 = 77
    expect(packed[0]).toBe(0b01001101)
  })

  it('should pack 9 booleans into 2 bytes', () => {
    const values = [true, false, true, true, false, false, true, false, true]
    const packed = packBooleans(values)

    expect(packed.length).toBe(2)
    expect(packed[0]).toBe(0b01001101) // First 8 bits
    expect(packed[1]).toBe(0b00000001) // 9th bit
  })

  it('should unpack bytes back to booleans', () => {
    const original = [true, false, true, true, false, false, true, false]
    const packed = packBooleans(original)
    const unpacked = unpackBooleans(packed, original.length)

    expect(unpacked).toEqual(original)
  })

  it('should handle nested boolean fields', () => {
    const schema = z.object({
      user: z.object({
        active: z.boolean(),
        verified: z.boolean()
      }),
      settings: z.object({
        notifications: z.boolean(),
        darkMode: z.boolean()
      })
    })

    const fields = extractBooleanFields(schema)

    // Should find all 4 booleans
    expect(fields.length).toBe(4)

    // Check paths
    const paths = fields.map(f => f.path.join('.'))
    expect(paths).toContain('user.active')
    expect(paths).toContain('user.verified')
    expect(paths).toContain('settings.notifications')
    expect(paths).toContain('settings.darkMode')
  })

  it('should extract and restore boolean values', () => {
    const schema = z.object({
      active: z.boolean(),
      verified: z.boolean(),
      premium: z.boolean()
    })

    const data = {
      active: true,
      verified: false,
      premium: true
    }

    const fields = extractBooleanFields(schema)
    const values = extractBooleanValues(data, fields)
    const packed = packBooleans(values)
    const unpacked = unpackBooleans(packed, fields.length)

    // Create empty object and restore booleans
    const restored = restoreBooleanValues({}, fields, unpacked)

    expect(restored).toEqual(data)
  })

  it('should be deterministic across multiple runs', () => {
    const schema = z.object({
      user: z.object({
        active: z.boolean(),
        verified: z.boolean(),
        premium: z.boolean()
      }),
      settings: z.object({
        notifications: z.boolean(),
        darkMode: z.boolean()
      })
    })

    const data = {
      user: {
        active: true,
        verified: false,
        premium: true
      },
      settings: {
        notifications: true,
        darkMode: false
      }
    }

    const results = []
    for (let i = 0; i < 10; i++) {
      const fields = extractBooleanFields(schema)
      const values = extractBooleanValues(data, fields)
      const packed = packBooleans(values)
      results.push(Array.from(packed))
    }

    // All 10 runs should produce identical packed bytes
    const first = JSON.stringify(results[0])
    for (const result of results) {
      expect(JSON.stringify(result)).toBe(first)
    }
  })

  it('should remove boolean fields from data', () => {
    const schema = z.object({
      name: z.string(),
      active: z.boolean(),
      count: z.number()
    })

    const data = {
      name: 'test',
      active: true,
      count: 42
    }

    const fields = extractBooleanFields(schema)
    const withoutBooleans = removeBooleanFields(data, fields)

    expect(withoutBooleans).toEqual({
      name: 'test',
      count: 42
    })
    expect(withoutBooleans).not.toHaveProperty('active')
  })

  it('should handle optional boolean fields', () => {
    const schema = z.object({
      required: z.boolean(),
      optional: z.boolean().optional()
    })

    const data = {
      required: true
      // optional is missing
    }

    const fields = extractBooleanFields(schema)
    const values = extractBooleanValues(data, fields)

    // Should extract 2 fields
    expect(fields.length).toBe(2)
    expect(values.length).toBe(2)

    // Fields are in alphabetical order: 'optional' then 'required'
    expect(fields[0]!.path).toEqual(['optional'])
    expect(fields[1]!.path).toEqual(['required'])

    // Values: optional=false (missing), required=true
    expect(values[0]).toBe(false) // optional is missing, defaults to false
    expect(values[1]).toBe(true) // required is true
  })

  it('should calculate if packing is worthwhile', () => {
    // 4+ booleans: worth packing
    const fields4 = [
      { path: ['a'], bitPosition: 0, byteIndex: 0 },
      { path: ['b'], bitPosition: 1, byteIndex: 0 },
      { path: ['c'], bitPosition: 2, byteIndex: 0 },
      { path: ['d'], bitPosition: 3, byteIndex: 0 }
    ]
    expect(shouldPackBooleans(fields4)).toBe(true)

    // 2 booleans: not worth packing overhead
    const fields2 = [
      { path: ['a'], bitPosition: 0, byteIndex: 0 },
      { path: ['b'], bitPosition: 1, byteIndex: 0 }
    ]
    expect(shouldPackBooleans(fields2)).toBe(false)

    // 8+ booleans: definitely worth it
    const fields8 = Array.from({ length: 8 }, (_, i) => ({
      path: [`field${i}`],
      bitPosition: i % 8,
      byteIndex: Math.floor(i / 8)
    }))
    expect(shouldPackBooleans(fields8)).toBe(true)
  })

  it('should handle schema with no booleans', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number()
    })

    const fields = extractBooleanFields(schema)
    expect(fields.length).toBe(0)
    expect(shouldPackBooleans(fields)).toBe(false)
  })

  it('should maintain bit positions across schema changes', () => {
    // Same schema defined twice
    const schema1 = z.object({
      alpha: z.boolean(),
      beta: z.boolean(),
      gamma: z.boolean()
    })

    const schema2 = z.object({
      alpha: z.boolean(),
      beta: z.boolean(),
      gamma: z.boolean()
    })

    const fields1 = extractBooleanFields(schema1)
    const fields2 = extractBooleanFields(schema2)

    // Should have identical bit positions
    expect(fields1).toEqual(fields2)
  })
})
