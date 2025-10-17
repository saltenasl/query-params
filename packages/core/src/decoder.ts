import { z } from 'zod'
import { decodeBase64Url } from './compression/base64url.js'
import { decompress } from './compression/decompress.js'
import { zodToProtobuf } from './protobuf/converter.js'
import { validateSchema, RESERVED_FIELD } from './validation.js'
import { DecodingError } from './errors.js'
import type { DecoderOptions } from './types.js'

/**
 * Result type for safe parse
 */
export interface DecodeResult<T = unknown> {
  success: boolean
  data?: T
  error?: Error
  version?: number
}

/**
 * Decodes an encoded string
 *
 * @param encoded - Encoded string to decode
 * @param schema - Zod schema for validation
 * @returns Decoded data
 */
export function decode<T = unknown>(
  encoded: string,
  schema: z.ZodType
): T

/**
 * Decodes an encoded string with safe parse enabled
 *
 * @param encoded - Encoded string to decode
 * @param schema - Zod schema for validation
 * @param options - Decoder options with safeParse enabled
 * @returns DecodeResult with success status
 */
export function decode<T = unknown>(
  encoded: string,
  schema: z.ZodType,
  options: DecoderOptions & { safeParse: true }
): DecodeResult<T>

/**
 * Decodes an encoded string (implementation)
 */
export function decode<T = unknown>(
  encoded: string,
  schema: z.ZodType,
  options?: DecoderOptions
): T | DecodeResult<T> {
  // If safeParse is enabled, wrap in try-catch
  if (options?.safeParse) {
    try {
      const { data, version } = decodeInternal(encoded, schema)
      return { success: true, data: data as T, version }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }
  }

  // Normal decoding (throws on error)
  const { data } = decodeInternal(encoded, schema)
  return data as T
}

/**
 * Internal decode function that always throws on error
 */
function decodeInternal(
  encoded: string,
  schema: z.ZodType
): { data: unknown; version: number } {
  // Validate schema doesn't use reserved field
  validateSchema(schema)

  // 1. Decode base64url to binary
  const dataWithMarker = decodeBase64Url(encoded)

  // 2. Check compression marker and decompress if needed
  const compressionMarker = dataWithMarker[0]
  const payload = dataWithMarker.slice(1)

  let binary: Uint8Array
  if (compressionMarker === 0x01) {
    // Data is compressed - decompress it
    binary = decompress(payload)
  } else if (compressionMarker === 0x00) {
    // Data is not compressed - use as-is
    binary = payload
  } else {
    throw new DecodingError(
      `Invalid compression marker: ${compressionMarker}. Expected 0x00 or 0x01`
    )
  }

  // 3. Convert schema to protobuf (to get the type for decoding)
  const pbType = zodToProtobuf(schema)

  // 4. Parse protobuf message
  let decoded: protobuf.Message
  try {
    decoded = pbType.decode(binary)
  } catch (error) {
    throw new DecodingError('Failed to decode protobuf message', { cause: error })
  }

  // Convert to plain object
  const decodedObj = pbType.toObject(decoded, {
    longs: Number,
    enums: String,
    bytes: String,
    defaults: false,
    arrays: true,
    objects: true,
    oneofs: true
  }) as Record<string, unknown>

  // 5. Extract version (default to 1 if missing for backward compatibility)
  const version = decodedObj[RESERVED_FIELD]

  let dataWithoutVersion: Record<string, unknown>
  if (version !== undefined) {
    if (typeof version !== 'number') {
      throw new DecodingError(
        `Invalid version field: ${RESERVED_FIELD}. Expected number, got ${typeof version}`
      )
    }
    // Remove version from decoded data
    const { [RESERVED_FIELD]: _, ...rest } = decodedObj
    dataWithoutVersion = rest
  } else {
    // No version field means v1 (optimization to save space)
    dataWithoutVersion = decodedObj
  }

  const finalVersion = version ?? 1

  // 6. Validate with Zod schema
  const validated = schema.parse(dataWithoutVersion)

  return { data: validated, version: finalVersion }
}

/**
 * Decodes an encoded string and returns both the data and version
 * This is a convenience function for when you need access to the version
 *
 * @param encoded - Encoded string to decode
 * @param schema - Zod schema for validation
 * @returns Object containing decoded data and version
 */
export function decodeWithVersion<T = unknown>(
  encoded: string,
  schema: z.ZodType
): { data: T; version: number } {
  const result = decodeInternal(encoded, schema)
  return { data: result.data as T, version: result.version }
}
