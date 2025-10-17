import { deflateSync } from 'zlib'
import { isNode } from './platform.js'
import { CompressionError } from '../errors.js'

/**
 * Compress data using platform-appropriate compression library
 * - Node.js: uses native zlib.deflateSync()
 * - Browser: uses pako.deflate()
 * 
 * @param data - Data to compress
 * @returns Compressed data
 * @throws CompressionError if compression fails
 */
export function compress(data: Uint8Array): Uint8Array {
  try {
    if (isNode()) {
      // Node.js: use native zlib
      const buffer = deflateSync(data)
      // Convert Buffer to Uint8Array
      return new Uint8Array(buffer)
    } else {
      // Browser: use pako (dynamically imported)
      // Note: This will be resolved at build time for browser bundles
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pako = require('pako')
      return pako.deflate(data)
    }
  } catch (error) {
    throw new CompressionError('Compression failed', { cause: error })
  }
}
