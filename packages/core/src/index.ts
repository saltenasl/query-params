// Export error classes
export * from './errors.js'

// Export compression utilities
export { compress } from './compression/compress.js'
export { decompress } from './compression/decompress.js'
export { encodeBase64Url, decodeBase64Url } from './compression/base64url.js'
export { isNode, isBrowser } from './compression/platform.js'

// Export validation utilities
export * from './validation.js'

// Export types
export * from './types.js'

// Export protobuf converter
export { zodToProtobuf } from './protobuf/converter.js'

// Export encoder and decoder
export { encode, type EncodeResult } from './encoder.js'
export { decode, decodeWithVersion, type DecodeResult } from './decoder.js'

// Export migrations
export {
  createMigration,
  applyMigrations,
  getVersion,
  type Migration,
  type MigrationChain
} from './migrations.js'

// Export polymorphic string conversion
export { EncodedState, createEncodedState } from './polymorphic.js'

// Export main API
export {
  createQueryParams,
  parseQueryParams,
  QueryParams,
  type CreateQueryParamsOptions,
  type CreateQueryParamsResult
} from './api.js'

// Export URLSearchParams-compatible API
export { EncodedQueryParams } from './query-params.js'
