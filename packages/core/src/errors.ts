/**
 * Base error class for all encoded-state errors
 */
export class EncodedStateError extends Error {
  public cause?: unknown

  constructor(
    message: string,
    public readonly options?: { cause?: unknown }
  ) {
    super(message)
    this.name = 'EncodedStateError'
    if (options?.cause) {
      this.cause = options.cause
    }
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends EncodedStateError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ValidationError'
  }
}

/**
 * Error thrown when version mismatch occurs
 */
export class VersionMismatchError extends EncodedStateError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'VersionMismatchError'
  }
}

/**
 * Error thrown when decoding fails
 */
export class DecodingError extends EncodedStateError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'DecodingError'
  }
}

/**
 * Error thrown when compression/decompression fails
 */
export class CompressionError extends EncodedStateError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'CompressionError'
  }
}

/**
 * Error thrown when encryption or decryption fails
 */
export class EncryptionError extends EncodedStateError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'EncryptionError'
  }
}

/**
 * Factory function to create a ValidationError
 */
export function createValidationError(
  message: string,
  cause?: unknown
): ValidationError {
  return new ValidationError(message, cause ? { cause } : undefined)
}

/**
 * Factory function to create a VersionMismatchError
 */
export function createVersionMismatchError(
  message: string,
  cause?: unknown
): VersionMismatchError {
  return new VersionMismatchError(message, cause ? { cause } : undefined)
}

/**
 * Factory function to create a DecodingError
 */
export function createDecodingError(
  message: string,
  cause?: unknown
): DecodingError {
  return new DecodingError(message, cause ? { cause } : undefined)
}

/**
 * Factory function to create a CompressionError
 */
export function createCompressionError(
  message: string,
  cause?: unknown
): CompressionError {
  return new CompressionError(message, cause ? { cause } : undefined)
}

/**
 * Factory function to create an EncryptionError
 */
export function createEncryptionError(
  message: string,
  cause?: unknown
): EncryptionError {
  return new EncryptionError(message, cause ? { cause } : undefined)
}
