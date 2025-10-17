import { DecodingError } from '../errors.js'

/**
 * Encodes a Uint8Array to a base64url string (URL-safe, no padding)
 * Base64url uses '-' instead of '+' and '_' instead of '/' and removes padding '='
 *
 * @param data - Data to encode
 * @returns Base64url encoded string
 */
export function encodeBase64Url(data: Uint8Array): string {
  // Convert Uint8Array to regular base64 string
  const base64 = Buffer.from(data).toString('base64')
  
  // Convert to base64url format
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Decodes a base64url string to a Uint8Array
 *
 * @param encoded - Base64url encoded string
 * @returns Decoded data
 * @throws DecodingError if decoding fails
 */
export function decodeBase64Url(encoded: string): Uint8Array {
  try {
    // Convert from base64url to regular base64
    let base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    
    // Add padding if needed
    const padding = (4 - (base64.length % 4)) % 4
    base64 += '='.repeat(padding)
    
    // Decode from base64
    return new Uint8Array(Buffer.from(base64, 'base64'))
  } catch (error) {
    throw new DecodingError('Failed to decode base64url string', { cause: error })
  }
}
