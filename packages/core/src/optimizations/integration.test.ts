import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { encode, decode } from '../index.js'
import {
  buildStringDictionary,
  applyStringDictionary,
  restoreStringDictionary,
  shouldUseDictionary
} from './string-dictionary.js'
import {
  extractBooleanFields,
  extractBooleanValues,
  packBooleans,
  unpackBooleans,
  restoreBooleanValues,
  removeBooleanFields,
  shouldPackBooleans
} from './boolean-packing.js'

describe('Optimization Integration', () => {
  it('should demonstrate string dictionary compression workflow', () => {
    const schema = z.object({
      items: z.array(z.object({
        category: z.string(),
        type: z.string()
      }))
    })

    // Original data with repeated strings
    const original = {
      items: [
        { category: 'electronics', type: 'electronics' },
        { category: 'electronics', type: 'electronics' },
        { category: 'electronics', type: 'electronics' }
      ]
    }

    // 1. Build dictionary
    const dictionary = buildStringDictionary(original)
    console.log('Dictionary:', dictionary.strings)

    // 2. Apply dictionary (replace strings with references)
    const withReferences = applyStringDictionary(original, dictionary)
    console.log('With references:', JSON.stringify(withReferences))

    // 3. Restore original
    const restored = restoreStringDictionary(withReferences, dictionary.strings)
    expect(restored).toEqual(original)

    // This shows the concept works!
    // To integrate: we'd need to encode the dictionary alongside the data
  })

  it('should demonstrate boolean packing workflow', () => {
    const schema = z.object({
      active: z.boolean(),
      verified: z.boolean(),
      premium: z.boolean(),
      darkMode: z.boolean(),
      notifications: z.boolean()
    })

    const original = {
      active: true,
      verified: false,
      premium: true,
      darkMode: false,
      notifications: true
    }

    // 1. Extract boolean fields from schema
    const fields = extractBooleanFields(schema)
    console.log('Boolean fields:', fields.map(f => f.path.join('.')))

    // 2. Extract values in field order
    const values = extractBooleanValues(original, fields)
    console.log('Boolean values:', values)

    // 3. Pack into bytes
    const packed = packBooleans(values)
    console.log('Packed bytes:', Array.from(packed))

    // 4. Unpack
    const unpacked = unpackBooleans(packed, fields.length)
    console.log('Unpacked:', unpacked)

    // 5. Restore to object
    const restored = restoreBooleanValues({}, fields, unpacked)
    console.log('Restored:', restored)

    expect(restored).toEqual(original)

    // This shows the concept works!
    // To integrate: we'd pack booleans, remove them from data, encode, then restore on decode
  })

  it('should show size savings with string dictionary', () => {
    const schema = z.object({
      items: z.array(z.object({
        category: z.string(),
        name: z.string()
      }))
    })

    const dataWithRepetition = {
      items: Array.from({ length: 10 }, () => ({
        category: 'electronics',
        name: 'electronics device'
      }))
    }

    // Without optimization
    const normalEncoded = encode(dataWithRepetition, schema)

    // With dictionary (manual for now)
    const dict = buildStringDictionary(dataWithRepetition)
    if (shouldUseDictionary(dataWithRepetition, dict)) {
      const compressed = applyStringDictionary(dataWithRepetition, dict)
      // In real implementation, we'd encode both compressed data and dictionary
      console.log('Would save space with dictionary!')
      console.log('Unique strings:', dict.strings.length)
      console.log('Normal size:', normalEncoded.length)
    }
  })

  it('should show size savings with boolean packing', () => {
    const schema = z.object({
      flags: z.object({
        a: z.boolean(),
        b: z.boolean(),
        c: z.boolean(),
        d: z.boolean(),
        e: z.boolean(),
        f: z.boolean(),
        g: z.boolean(),
        h: z.boolean()
      })
    })

    const data = {
      flags: {
        a: true,
        b: false,
        c: true,
        d: true,
        e: false,
        f: false,
        g: true,
        h: false
      }
    }

    // Without optimization
    const normalEncoded = encode(data, schema)

    // With packing (manual for now)
    const fields = extractBooleanFields(schema)
    if (shouldPackBooleans(fields)) {
      const values = extractBooleanValues(data, fields)
      const packed = packBooleans(values)
      console.log('Boolean packing would save:', fields.length * 2 - packed.length - 1, 'bytes')
      console.log('Normal size:', normalEncoded.length)
      console.log('Packed bytes:', packed.length)
    }
  })
})
