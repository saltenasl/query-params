import { describe, expect, it } from 'vitest'
import {
  CompressionError,
  createCompressionError,
  createDecodingError,
  createEncryptionError,
  createValidationError,
  createVersionMismatchError,
  DecodingError,
  EncodedStateError,
  EncryptionError,
  ValidationError,
  VersionMismatchError,
} from './errors'

describe('EncodedStateError', () => {
  it('can be instantiated', () => {
    const error = new EncodedStateError('Test error')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(EncodedStateError)
  })

  it('has correct name', () => {
    const error = new EncodedStateError('Test error')
    expect(error.name).toBe('EncodedStateError')
  })

  it('has correct message', () => {
    const message = 'Something went wrong'
    const error = new EncodedStateError(message)
    expect(error.message).toBe(message)
  })

  it('preserves stack trace', () => {
    const error = new EncodedStateError('Test error')
    expect(error.stack).toBeDefined()
    expect(error.stack).toContain('EncodedStateError')
  })

  it('preserves cause when provided', () => {
    const cause = new Error('Original error')
    const error = new EncodedStateError('Test error', { cause })
    expect(error.cause).toBe(cause)
  })

  it('has undefined cause when not provided', () => {
    const error = new EncodedStateError('Test error')
    expect(error.cause).toBeUndefined()
  })
})

describe('ValidationError', () => {
  it('can be instantiated', () => {
    const error = new ValidationError('Validation failed')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(EncodedStateError)
    expect(error).toBeInstanceOf(ValidationError)
  })

  it('has correct name', () => {
    const error = new ValidationError('Validation failed')
    expect(error.name).toBe('ValidationError')
  })

  it('has correct message', () => {
    const message = 'Schema validation failed'
    const error = new ValidationError(message)
    expect(error.message).toBe(message)
  })

  it('preserves stack trace', () => {
    const error = new ValidationError('Validation failed')
    expect(error.stack).toBeDefined()
    expect(error.stack).toContain('ValidationError')
  })

  it('preserves cause when provided', () => {
    const cause = new Error('Zod validation error')
    const error = new ValidationError('Validation failed', { cause })
    expect(error.cause).toBe(cause)
  })

  it('has undefined cause when not provided', () => {
    const error = new ValidationError('Validation failed')
    expect(error.cause).toBeUndefined()
  })
})

describe('VersionMismatchError', () => {
  it('can be instantiated', () => {
    const error = new VersionMismatchError('Version mismatch')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(EncodedStateError)
    expect(error).toBeInstanceOf(VersionMismatchError)
  })

  it('has correct name', () => {
    const error = new VersionMismatchError('Version mismatch')
    expect(error.name).toBe('VersionMismatchError')
  })

  it('has correct message', () => {
    const message = 'Missing migration for version 2'
    const error = new VersionMismatchError(message)
    expect(error.message).toBe(message)
  })

  it('preserves stack trace', () => {
    const error = new VersionMismatchError('Version mismatch')
    expect(error.stack).toBeDefined()
    expect(error.stack).toContain('VersionMismatchError')
  })

  it('preserves cause when provided', () => {
    const cause = new Error('Migration not found')
    const error = new VersionMismatchError('Version mismatch', { cause })
    expect(error.cause).toBe(cause)
  })

  it('has undefined cause when not provided', () => {
    const error = new VersionMismatchError('Version mismatch')
    expect(error.cause).toBeUndefined()
  })
})

describe('DecodingError', () => {
  it('can be instantiated', () => {
    const error = new DecodingError('Decoding failed')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(EncodedStateError)
    expect(error).toBeInstanceOf(DecodingError)
  })

  it('has correct name', () => {
    const error = new DecodingError('Decoding failed')
    expect(error.name).toBe('DecodingError')
  })

  it('has correct message', () => {
    const message = 'Invalid base64 data'
    const error = new DecodingError(message)
    expect(error.message).toBe(message)
  })

  it('preserves stack trace', () => {
    const error = new DecodingError('Decoding failed')
    expect(error.stack).toBeDefined()
    expect(error.stack).toContain('DecodingError')
  })

  it('preserves cause when provided', () => {
    const cause = new Error('Invalid character')
    const error = new DecodingError('Decoding failed', { cause })
    expect(error.cause).toBe(cause)
  })

  it('has undefined cause when not provided', () => {
    const error = new DecodingError('Decoding failed')
    expect(error.cause).toBeUndefined()
  })
})

describe('CompressionError', () => {
  it('can be instantiated', () => {
    const error = new CompressionError('Compression failed')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(EncodedStateError)
    expect(error).toBeInstanceOf(CompressionError)
  })

  it('has correct name', () => {
    const error = new CompressionError('Compression failed')
    expect(error.name).toBe('CompressionError')
  })

  it('has correct message', () => {
    const message = 'Failed to compress data'
    const error = new CompressionError(message)
    expect(error.message).toBe(message)
  })

  it('preserves stack trace', () => {
    const error = new CompressionError('Compression failed')
    expect(error.stack).toBeDefined()
    expect(error.stack).toContain('CompressionError')
  })

  it('preserves cause when provided', () => {
    const cause = new Error('Buffer overflow')
    const error = new CompressionError('Compression failed', { cause })
    expect(error.cause).toBe(cause)
  })

  it('has undefined cause when not provided', () => {
    const error = new CompressionError('Compression failed')
    expect(error.cause).toBeUndefined()
  })
})

describe('EncryptionError', () => {
  it('can be instantiated', () => {
    const error = new EncryptionError('Encryption failed')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(EncodedStateError)
    expect(error).toBeInstanceOf(EncryptionError)
  })

  it('has correct name', () => {
    const error = new EncryptionError('Encryption failed')
    expect(error.name).toBe('EncryptionError')
  })

  it('has correct message', () => {
    const message = 'Invalid encryption key'
    const error = new EncryptionError(message)
    expect(error.message).toBe(message)
  })

  it('preserves stack trace', () => {
    const error = new EncryptionError('Encryption failed')
    expect(error.stack).toBeDefined()
    expect(error.stack).toContain('EncryptionError')
  })

  it('preserves cause when provided', () => {
    const cause = new Error('Key derivation failed')
    const error = new EncryptionError('Encryption failed', { cause })
    expect(error.cause).toBe(cause)
  })

  it('has undefined cause when not provided', () => {
    const error = new EncryptionError('Encryption failed')
    expect(error.cause).toBeUndefined()
  })
})

describe('Error Factory Functions', () => {
  describe('createValidationError', () => {
    it('creates ValidationError with message', () => {
      const error = createValidationError('Validation failed')
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toBe('Validation failed')
      expect(error.cause).toBeUndefined()
    })

    it('creates ValidationError with cause', () => {
      const cause = new Error('Zod error')
      const error = createValidationError('Validation failed', cause)
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toBe('Validation failed')
      expect(error.cause).toBe(cause)
    })
  })

  describe('createVersionMismatchError', () => {
    it('creates VersionMismatchError with message', () => {
      const error = createVersionMismatchError('Version mismatch')
      expect(error).toBeInstanceOf(VersionMismatchError)
      expect(error.message).toBe('Version mismatch')
      expect(error.cause).toBeUndefined()
    })

    it('creates VersionMismatchError with cause', () => {
      const cause = new Error('Migration missing')
      const error = createVersionMismatchError('Version mismatch', cause)
      expect(error).toBeInstanceOf(VersionMismatchError)
      expect(error.message).toBe('Version mismatch')
      expect(error.cause).toBe(cause)
    })
  })

  describe('createDecodingError', () => {
    it('creates DecodingError with message', () => {
      const error = createDecodingError('Decoding failed')
      expect(error).toBeInstanceOf(DecodingError)
      expect(error.message).toBe('Decoding failed')
      expect(error.cause).toBeUndefined()
    })

    it('creates DecodingError with cause', () => {
      const cause = new Error('Invalid base64')
      const error = createDecodingError('Decoding failed', cause)
      expect(error).toBeInstanceOf(DecodingError)
      expect(error.message).toBe('Decoding failed')
      expect(error.cause).toBe(cause)
    })
  })

  describe('createCompressionError', () => {
    it('creates CompressionError with message', () => {
      const error = createCompressionError('Compression failed')
      expect(error).toBeInstanceOf(CompressionError)
      expect(error.message).toBe('Compression failed')
      expect(error.cause).toBeUndefined()
    })

    it('creates CompressionError with cause', () => {
      const cause = new Error('Buffer error')
      const error = createCompressionError('Compression failed', cause)
      expect(error).toBeInstanceOf(CompressionError)
      expect(error.message).toBe('Compression failed')
      expect(error.cause).toBe(cause)
    })
  })

  describe('createEncryptionError', () => {
    it('creates EncryptionError with message', () => {
      const error = createEncryptionError('Encryption failed')
      expect(error).toBeInstanceOf(EncryptionError)
      expect(error.message).toBe('Encryption failed')
      expect(error.cause).toBeUndefined()
    })

    it('creates EncryptionError with cause', () => {
      const cause = new Error('Key error')
      const error = createEncryptionError('Encryption failed', cause)
      expect(error).toBeInstanceOf(EncryptionError)
      expect(error.message).toBe('Encryption failed')
      expect(error.cause).toBe(cause)
    })
  })
})
