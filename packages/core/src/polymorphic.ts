import { z } from 'zod'
import { encode } from './encoder.js'
import type { EncoderOptions } from './types.js'

/**
 * A wrapper class that holds an encoded string and provides polymorphic
 * string conversion behavior. This allows encoded state objects to be used
 * anywhere strings are expected.
 *
 * Features:
 * - toString() method for explicit string conversion
 * - Symbol.toPrimitive for automatic coercion
 * - valueOf() for completeness
 * - Works with template literals, concatenation, JSON.stringify, etc.
 *
 * @example
 * ```ts
 * const params = createEncodedState({ foo: 'bar' }, schema)
 * const url = `/path?q=${params}` // Automatic string coercion
 * ```
 */
export class EncodedState {
  private readonly encodedString: string

  /**
   * Creates a new EncodedState instance.
   *
   * @param encodedString - The encoded state string
   */
  constructor(encodedString: string) {
    this.encodedString = encodedString
  }

  /**
   * Returns the encoded string.
   * Called explicitly via toString() or implicitly in string contexts.
   */
  toString(): string {
    return this.encodedString
  }

  /**
   * Implements primitive coercion for automatic string conversion.
   * This enables the object to work seamlessly in template literals,
   * concatenation, and other contexts expecting primitives.
   *
   * @param hint - The type hint ('string', 'number', or 'default')
   */
  [Symbol.toPrimitive](hint: 'string' | 'number' | 'default'): string | number {
    if (hint === 'number') {
      // Return NaN for number context (encoded strings aren't numbers)
      return NaN
    }
    // For 'string' and 'default' hints, return the encoded string
    return this.encodedString
  }

  /**
   * Returns the primitive value of the object.
   * Completes the polymorphic behavior.
   */
  valueOf(): string {
    return this.encodedString
  }

  /**
   * Returns a JSON representation of the encoded state.
   * The encoded string is returned directly.
   */
  toJSON(): string {
    return this.encodedString
  }

  /**
   * Returns the length of the encoded string.
   */
  get length(): number {
    return this.encodedString.length
  }

  /**
   * Allows indexed access to the encoded string characters.
   */
  charAt(index: number): string {
    return this.encodedString.charAt(index)
  }

  /**
   * Checks if the encoded string includes a substring.
   */
  includes(searchString: string, position?: number): boolean {
    return this.encodedString.includes(searchString, position)
  }

  /**
   * Finds the index of a substring in the encoded string.
   */
  indexOf(searchString: string, position?: number): number {
    return this.encodedString.indexOf(searchString, position)
  }

  /**
   * Returns a substring of the encoded string.
   */
  substring(start: number, end?: number): string {
    return this.encodedString.substring(start, end)
  }

  /**
   * Returns a slice of the encoded string.
   */
  slice(start?: number, end?: number): string {
    return this.encodedString.slice(start, end)
  }
}

/**
 * Creates an EncodedState instance from data and schema.
 * This is a convenience function that encodes the data and wraps it
 * in an EncodedState object for polymorphic string behavior.
 *
 * @param data - Data to encode
 * @param schema - Zod schema for validation
 * @param version - Version number (default: 1)
 * @param options - Encoder options
 * @returns EncodedState instance that can be used as a string
 *
 * @example
 * ```ts
 * const schema = z.object({ query: z.string(), page: z.number() })
 * const params = createEncodedState({ query: 'search', page: 1 }, schema)
 *
 * // Use in template literals
 * const url = `/api/search?state=${params}`
 *
 * // Use in concatenation
 * const fullUrl = 'https://example.com/api?q=' + params
 *
 * // Use in JSON
 * JSON.stringify({ state: params }) // {"state":"encoded_string"}
 * ```
 */
export function createEncodedState(
  data: unknown,
  schema: z.ZodType,
  version: number = 1,
  options?: EncoderOptions
): EncodedState {
  if (options?.safeParse) {
    const encoded = encode(data, schema, version, { ...options, safeParse: true })
    if (!encoded.success) {
      throw encoded.error
    }
    return new EncodedState(encoded.data!)
  }

  const encoded = encode(data, schema, version)
  return new EncodedState(encoded)
}
