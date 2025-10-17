import { z } from 'zod'

/**
 * Schema-aware boolean bit-packing
 *
 * This is deterministic because:
 * 1. Boolean field order is determined by schema traversal (DFS)
 * 2. Same schema = same field order on FE and BE
 * 3. Bit positions are assigned based on this deterministic order
 *
 * Packs up to 8 booleans into a single byte
 */

export interface BooleanFieldInfo {
  /** Path to the field (e.g. "user.settings.notifications") */
  path: string[]
  /** Bit position (0-7) within the byte */
  bitPosition: number
  /** Byte index for fields beyond the first 8 */
  byteIndex: number
}

/**
 * Extract all boolean fields from a Zod schema in deterministic order
 * Returns field paths and their assigned bit positions
 */
export function extractBooleanFields(
  schema: z.ZodType,
  path: string[] = []
): BooleanFieldInfo[] {
  const fields: BooleanFieldInfo[] = []
  let currentBit = 0

  function traverse(currentSchema: z.ZodType, currentPath: string[]): void {
    // Unwrap effects
    let unwrapped = currentSchema
    while (unwrapped instanceof z.ZodEffects) {
      unwrapped = unwrapped._def.schema
    }

    // Unwrap optional/nullable
    if (unwrapped instanceof z.ZodOptional || unwrapped instanceof z.ZodNullable) {
      unwrapped = unwrapped._def.innerType
    }

    // Unwrap default
    if (unwrapped instanceof z.ZodDefault) {
      unwrapped = unwrapped._def.innerType
    }

    // Check if this is a boolean
    if (unwrapped instanceof z.ZodBoolean) {
      const byteIndex = Math.floor(currentBit / 8)
      const bitPosition = currentBit % 8
      fields.push({
        path: currentPath,
        bitPosition,
        byteIndex
      })
      currentBit++
      return
    }

    // Traverse nested objects (in sorted key order for determinism)
    if (unwrapped instanceof z.ZodObject) {
      const shape = unwrapped.shape
      const keys = Object.keys(shape).sort() // Deterministic order
      for (const key of keys) {
        traverse(shape[key] as z.ZodType, [...currentPath, key])
      }
    }

    // Traverse arrays (element type)
    if (unwrapped instanceof z.ZodArray) {
      // Note: We can't pack array element booleans efficiently
      // since array length is dynamic. Skip for now.
      return
    }
  }

  traverse(schema, path)

  return fields
}

/**
 * Extract boolean values from data in deterministic field order
 */
export function extractBooleanValues(
  data: unknown,
  fields: BooleanFieldInfo[]
): boolean[] {
  const values: boolean[] = []

  for (const field of fields) {
    let current: any = data
    let found = true

    // Traverse the path
    for (const key of field.path) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        found = false
        break
      }
    }

    if (found && typeof current === 'boolean') {
      values.push(current)
    } else {
      // Field not present or not boolean - use false as default
      values.push(false)
    }
  }

  return values
}

/**
 * Pack boolean values into bytes
 * Each byte holds 8 booleans (bits)
 */
export function packBooleans(values: boolean[]): Uint8Array {
  const byteCount = Math.ceil(values.length / 8)
  const bytes = new Uint8Array(byteCount)

  for (let i = 0; i < values.length; i++) {
    if (values[i]) {
      const byteIndex = Math.floor(i / 8)
      const bitPosition = i % 8
      bytes[byteIndex] |= (1 << bitPosition)
    }
  }

  return bytes
}

/**
 * Unpack bytes into boolean values
 */
export function unpackBooleans(bytes: Uint8Array, count: number): boolean[] {
  const values: boolean[] = []

  for (let i = 0; i < count; i++) {
    const byteIndex = Math.floor(i / 8)
    const bitPosition = i % 8

    if (byteIndex < bytes.length) {
      const bit = (bytes[byteIndex] >> bitPosition) & 1
      values.push(bit === 1)
    } else {
      values.push(false)
    }
  }

  return values
}

/**
 * Restore boolean values back into data structure
 */
export function restoreBooleanValues(
  data: unknown,
  fields: BooleanFieldInfo[],
  values: boolean[]
): unknown {
  // Deep clone to avoid mutating input
  const result = JSON.parse(JSON.stringify(data))

  for (let i = 0; i < fields.length && i < values.length; i++) {
    const field = fields[i]
    const value = values[i]

    let current: any = result

    // Traverse to parent
    for (let j = 0; j < field.path.length - 1; j++) {
      const key = field.path[j]
      if (!(key in current)) {
        current[key] = {}
      }
      current = current[key]
    }

    // Set the boolean value
    const lastKey = field.path[field.path.length - 1]
    current[lastKey] = value
  }

  return result
}

/**
 * Remove boolean fields from data (they'll be stored in packed form)
 */
export function removeBooleanFields(
  data: unknown,
  fields: BooleanFieldInfo[]
): unknown {
  // Deep clone
  const result = JSON.parse(JSON.stringify(data))

  for (const field of fields) {
    let current: any = result

    // Traverse to parent
    for (let j = 0; j < field.path.length - 1; j++) {
      const key = field.path[j]
      if (!(key in current)) {
        break
      }
      current = current[key]
    }

    // Remove the boolean field
    if (current && typeof current === 'object') {
      const lastKey = field.path[field.path.length - 1]
      delete current[lastKey]
    }
  }

  return result
}

/**
 * Calculate if boolean packing would save space
 */
export function shouldPackBooleans(fields: BooleanFieldInfo[]): boolean {
  // Protobuf encodes booleans as 1 byte per field (field number + value)
  // Average: ~2 bytes per boolean (1 byte field tag + 1 byte value)
  const protobufSize = fields.length * 2

  // Packed format:
  // - 1 byte count
  // - Packed bytes (1 byte per 8 booleans)
  const packedSize = 1 + Math.ceil(fields.length / 8)

  // Only pack if we save at least 3 bytes (worthwhile overhead)
  return fields.length >= 4 && packedSize < protobufSize - 3
}
