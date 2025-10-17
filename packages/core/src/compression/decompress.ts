import { inflateSync } from 'zlib'
import { isNode } from './platform.js'
import { CompressionError } from '../errors.js'

/**
 * Decompress data using platform-appropriate compression library
 * - Node.js: uses native zlib.inflateSync()
 * - Browser: uses pako.inflate()
 *
 * @param data - Compressed data to decompress
 * @returns Decompressed data
 * @throws CompressionError if decompression fails
 */
export function decompress(data: Uint8Array): Uint8Array {
  try {
    if (isNode()) {
      // Node.js: use native zlib
      const buffer = inflateSync(data)
      // Convert Buffer to Uint8Array
      return new Uint8Array(buffer)
    } else {
      // Browser: use pako (dynamically imported)
      // Note: This will be resolved at build time for browser bundles
      const pako = require('pako')
      return pako.inflate(data)
    }
  } catch (error) {
    throw new CompressionError('Decompression failed', { cause: error })
  }
}
