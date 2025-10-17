/**
 * Header format (configurable)
 *
 * === 2-byte header mode (default) ===
 * Byte 0:
 *   Bits 0-5: Version (lower 6 bits)
 *   Bit 6: Compression flag
 *   Bit 7: Version mode flag (0=2-byte header, 1=1-byte header)
 *
 * Byte 1:
 *   Bits 0-3: Version (upper 4 bits)
 *   Bit 4: String dictionary
 *   Bit 5: Boolean packing
 *   Bits 6-7: Reserved
 *
 * Provides: 10-bit version (0-1023), 1 compression flag, 4 optimization flags
 *
 * === 1-byte header mode (opt-in) ===
 * Byte 0:
 *   Bit 0: Compression flag
 *   Bit 1: String dictionary
 *   Bit 2: Boolean packing
 *   Bits 3-6: Reserved
 *   Bit 7: Version mode flag (1=1-byte header)
 *
 * Version is stored in protobuf payload (unlimited bits)
 * Provides: Smaller header, unlimited version space
 */

export const FLAGS = {
  // Byte 0, bit 6
  COMPRESSED: 1 << 6,

  // Byte 1, bits 4-5
  STRING_DICTIONARY: 1 << 4,
  BOOLEAN_PACKING: 1 << 5,
} as const

/**
 * Create flags options object (for backward compatibility)
 */
export function createFlags(options: {
  compressed: boolean
  stringDictionary?: boolean
  booleanPacking?: boolean
}): { compressed: boolean; stringDictionary?: boolean; booleanPacking?: boolean } {
  return options
}

/**
 * Check if flag is set in decoded result
 */
export function hasFlag(result: { compressed: boolean }, flag: number): boolean {
  if (flag === FLAGS.COMPRESSED) {
    return result.compressed
  }
  return false
}

/**
 * Encode data with 2-byte header
 *
 * @param payload - Data payload to encode
 * @param version - Version number (0-1023)
 * @param options - Encoding options
 */
export function encodeWithHeader(
  payload: Uint8Array,
  version: number,
  options: {
    compressed: boolean
    stringDictionary?: boolean
    booleanPacking?: boolean
  }
): Uint8Array {
  // Validate version
  if (version < 0 || version > 1023) {
    throw new Error('Version must be 0-1023')
  }

  // Byte 0: Version (lower 6 bits) + Compression flag (bit 6)
  let byte0 = version & 0x3F // Lower 6 bits of version
  if (options.compressed) {
    byte0 |= FLAGS.COMPRESSED
  }

  // Byte 1: Version (upper 4 bits) + Optimization flags (bits 4-7)
  let byte1 = (version >> 6) & 0x0F // Upper 4 bits of version
  if (options.stringDictionary) {
    byte1 |= FLAGS.STRING_DICTIONARY
  }
  if (options.booleanPacking) {
    byte1 |= FLAGS.BOOLEAN_PACKING
  }

  // Create result with 2-byte header + payload
  const result = new Uint8Array(2 + payload.length)
  result[0] = byte0
  result[1] = byte1
  result.set(payload, 2)

  return result
}

/**
 * Decode data with 2-byte header
 */
export function decodeWithHeader(encoded: Uint8Array): {
  version: number
  compressed: boolean
  stringDictionary: boolean
  booleanPacking: boolean
  payload: Uint8Array
} {
  if (encoded.length < 2) {
    throw new Error('Encoded data too short - missing header')
  }

  const byte0 = encoded[0]
  const byte1 = encoded[1]

  // Extract version (10 bits)
  const versionLower = byte0 & 0x3F // Lower 6 bits
  const versionUpper = byte1 & 0x0F // Lower 4 bits of byte1
  const version = versionLower | (versionUpper << 6)

  // Extract flags
  const compressed = (byte0 & FLAGS.COMPRESSED) !== 0
  const stringDictionary = (byte1 & FLAGS.STRING_DICTIONARY) !== 0
  const booleanPacking = (byte1 & FLAGS.BOOLEAN_PACKING) !== 0

  const payload = encoded.slice(2)

  return {
    version,
    compressed,
    stringDictionary,
    booleanPacking,
    payload
  }
}
