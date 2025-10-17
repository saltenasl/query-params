import { z } from 'zod'
import { encode } from './encoder.js'
import { decode, type DecodeResult } from './decoder.js'
import type { EncoderOptions } from './types.js'

/**
 * Options for createQueryParams
 */
export interface CreateQueryParamsOptions extends EncoderOptions {
  /**
   * Version number for the encoded state (default: 1)
   */
  version?: number
}

/**
 * A polymorphic object that behaves like URLSearchParams but can be
 * coerced to a string containing the encoded state
 */
export class QueryParams extends URLSearchParams {
  private encodedValue: string

  constructor(encodedValue: string) {
    // Initialize URLSearchParams with a single 'state' parameter
    super({ state: encodedValue })
    this.encodedValue = encodedValue
  }

  /**
   * Returns the encoded state value
   */
  getState(): string {
    return this.encodedValue
  }

  /**
   * Custom toString that returns the encoded state directly
   * This makes the object string-coercible
   */
  toString(): string {
    return this.encodedValue
  }

  /**
   * Custom valueOf that returns the encoded state
   * This allows string coercion with String(params)
   */
  valueOf(): string {
    return this.encodedValue
  }

  /**
   * Override to return the URLSearchParams string representation
   * when explicitly called as a URLSearchParams method
   */
  toURLSearchParamsString(): string {
    return super.toString()
  }

  /**
   * Symbol.toPrimitive allows automatic type conversion
   */
  [Symbol.toPrimitive](hint: string): string {
    if (hint === 'number') {
      return this.encodedValue
    }
    return this.encodedValue
  }
}

/**
 * Result type for createQueryParams with safeParse enabled
 */
export interface CreateQueryParamsResult {
  success: boolean
  data?: QueryParams
  error?: Error
}

/**
 * Main API function: Creates a QueryParams object that is both
 * URLSearchParams-compatible and string-coercible
 *
 * @param data - Data to encode
 * @param schema - Zod schema for validation
 * @param options - Optional configuration
 * @returns QueryParams object that can be used as URLSearchParams or coerced to string
 *
 * @example
 * ```typescript
 * const params = createQueryParams({ name: 'test', age: 30 }, schema)
 * params.get('state') // Returns the encoded string
 * String(params) // Returns the encoded string
 * params.toString() // Returns the encoded string
 * ```
 */
export function createQueryParams<T extends z.ZodType>(
  data: z.infer<T>,
  schema: T
): QueryParams

/**
 * Creates a QueryParams object with custom version
 */
export function createQueryParams<T extends z.ZodType>(
  data: z.infer<T>,
  schema: T,
  options: CreateQueryParamsOptions & { safeParse?: false }
): QueryParams

/**
 * Creates a QueryParams object with safeParse enabled
 */
export function createQueryParams<T extends z.ZodType>(
  data: z.infer<T>,
  schema: T,
  options: CreateQueryParamsOptions & { safeParse: true }
): CreateQueryParamsResult

/**
 * Implementation of createQueryParams
 */
export function createQueryParams<T extends z.ZodType>(
  data: z.infer<T>,
  schema: T,
  options?: CreateQueryParamsOptions
): QueryParams | CreateQueryParamsResult {
  const version = options?.version ?? 1
  const safeParse = options?.safeParse ?? false

  if (safeParse) {
    const result = encode(data, schema, version, { safeParse: true })
    if (!result.success) {
      return {
        success: false,
        error: result.error!
      }
    }
    return {
      success: true,
      data: new QueryParams(result.data!)
    }
  }

  // Normal mode (throws on error)
  const encoded = encode(data, schema, version)
  return new QueryParams(encoded)
}

/**
 * Parses a QueryParams object or encoded string back to the original data
 *
 * @param params - QueryParams object or encoded string
 * @param schema - Zod schema for validation
 * @returns Decoded data
 *
 * @example
 * ```typescript
 * const params = createQueryParams({ name: 'test' }, schema)
 * const data = parseQueryParams(params, schema)
 * // or
 * const data = parseQueryParams('encoded-string', schema)
 * ```
 */
export function parseQueryParams<T extends z.ZodType>(
  params: QueryParams | string,
  schema: T
): z.infer<T>

/**
 * Parses with safeParse enabled
 */
export function parseQueryParams<T extends z.ZodType>(
  params: QueryParams | string,
  schema: T,
  options: { safeParse: true }
): DecodeResult<z.infer<T>>

/**
 * Implementation of parseQueryParams
 */
export function parseQueryParams<T extends z.ZodType>(
  params: QueryParams | string,
  schema: T,
  options?: { safeParse?: boolean }
): z.infer<T> | DecodeResult<z.infer<T>> {
  const encoded = params instanceof QueryParams ? params.getState() : params

  if (options?.safeParse) {
    return decode<z.infer<T>>(encoded, schema, { safeParse: true })
  }

  return decode<z.infer<T>>(encoded, schema)
}
