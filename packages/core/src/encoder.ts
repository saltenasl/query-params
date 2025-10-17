import { z } from 'zod'
import { validateSchema, RESERVED_FIELD } from './validation.js'
import { zodToProtobuf } from './protobuf/converter.js'
import { compress } from './compression/compress.js'
import { encodeBase64Url } from './compression/base64url.js'
import { ValidationError } from './errors.js'
import type { EncoderOptions } from './types.js'

/**
 * Result type for safe parse
 */
export interface EncodeResult {
  success: boolean
  data?: string
  error?: Error
}

/**
 * Encodes data using the following pipeline:
 * 1. Validates schema doesn't use reserved field
 * 2. Parses data with Zod schema
 * 3. Adds _encodedStateVersion to data
 * 4. Converts schema to protobuf
 * 5. Serializes to binary with protobuf
 * 6. Compresses binary data
 * 7. Encodes as base64url string
 *
 * @param data - Data to encode
 * @param schema - Zod schema for validation
 * @param version - Version number (default: 1)
 * @returns Encoded string
 */
export function encode(
  data: unknown,
  schema: z.ZodType,
  version?: number
): string

/**
 * Encodes data with safe parse enabled
 *
 * @param data - Data to encode
 * @param schema - Zod schema for validation
 * @param version - Version number (default: 1)
 * @param options - Encoder options with safeParse enabled
 * @returns EncodeResult with success status
 */
export function encode(
  data: unknown,
  schema: z.ZodType,
  version: number,
  options: EncoderOptions & { safeParse: true }
): EncodeResult

/**
 * Encodes data (implementation)
 */
export function encode(
  data: unknown,
  schema: z.ZodType,
  version: number = 1,
  options?: EncoderOptions
): string | EncodeResult {
  // If safeParse is enabled, wrap in try-catch
  if (options?.safeParse) {
    try {
      const result = encodeInternal(data, schema, version)
      return { success: true, data: result }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }
  }

  // Normal encoding (throws on error)
  return encodeInternal(data, schema, version)
}

/**
 * Internal encode function that always throws on error
 */
function encodeInternal(
  data: unknown,
  schema: z.ZodType,
  version: number
): string {
  // 1. Validate schema doesn't use reserved field
  validateSchema(schema)

  // 2. Parse data with Zod schema
  const validated = schema.parse(data)

  // Ensure validated is an object
  if (typeof validated !== 'object' || validated === null || Array.isArray(validated)) {
    throw new ValidationError(
      'Encoded data must be an object. Root schema must be z.object({})'
    )
  }

  // 3. Add version to data (skip for v1 to save space)
  const withVersion = version === 1
    ? validated
    : {
        ...validated,
        [RESERVED_FIELD]: version
      }

  // 4. Convert schema to protobuf
  const pbType = zodToProtobuf(schema)

  // 5. Serialize to binary with protobuf
  // Use fromObject to properly convert enum strings to numeric values
  const message = pbType.fromObject(withVersion)
  const binary = pbType.encode(message).finish()

  // 6. Adaptive compression - only compress if beneficial
  // Add a marker byte: 0x00 = uncompressed, 0x01 = compressed
  const compressed = compress(binary)

  let finalBinary: Uint8Array
  if (compressed.length < binary.length) {
    // Compression helped - use it with marker
    finalBinary = new Uint8Array(compressed.length + 1)
    finalBinary[0] = 0x01 // Compressed marker
    finalBinary.set(compressed, 1)
  } else {
    // Skip compression - not beneficial
    finalBinary = new Uint8Array(binary.length + 1)
    finalBinary[0] = 0x00 // Uncompressed marker
    finalBinary.set(binary, 1)
  }

  // 7. Encode as base64url string
  return encodeBase64Url(finalBinary)
}
