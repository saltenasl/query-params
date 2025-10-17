import { z } from 'zod'
import { encode } from './encoder.js'
import { decode } from './decoder.js'
import { ValidationError } from './errors.js'

/**
 * URLSearchParams-compatible wrapper for encoded state
 *
 * This class provides a familiar URLSearchParams API while using
 * the encoded-state library for efficient compression and encoding.
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   name: z.string(),
 *   age: z.number()
 * })
 *
 * // Create from data
 * const params = new EncodedQueryParams({ name: 'Alice', age: 30 }, schema)
 * console.log(params.toString()) // encoded string
 *
 * // Create from encoded string
 * const params2 = new EncodedQueryParams(params.toString(), schema)
 * console.log(params2.get('name')) // 'Alice'
 * ```
 */
export class EncodedQueryParams {
  private data: Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private schema: z.ZodObject<any>
  private version: number

  /**
   * Creates a new EncodedQueryParams instance
   *
   * @param init - Either an encoded string or data object
   * @param schema - Zod schema for validation (must be z.object())
   * @param version - Version number (default: 1)
   */
  constructor(
    init: string | Record<string, unknown>,
    schema: z.ZodType,
    version: number = 1
  ) {
    // Ensure schema is a ZodObject
    if (!(schema instanceof z.ZodObject)) {
      throw new ValidationError(
        'EncodedQueryParams requires a z.object() schema'
      )
    }

    this.schema = schema
    this.version = version

    if (typeof init === 'string') {
      // Decode from string
      this.data = decode(init, schema)
    } else {
      // Use provided data
      const validated = schema.parse(init)
      this.data = validated
    }
  }

  /**
   * Returns the value of the first parameter with the specified name
   * Returns null if the parameter doesn't exist
   *
   * @param name - Parameter name
   */
  get(name: string): string | null {
    if (!(name in this.data)) {
      return null
    }

    const value = this.data[name]

    // Convert to string representation
    if (value === null || value === undefined) {
      return null
    }

    return String(value)
  }

  /**
   * Returns all values associated with the specified parameter name
   * Since we store single values per key, this returns an array with one or zero elements
   *
   * @param name - Parameter name
   */
  getAll(name: string): string[] {
    const value = this.get(name)
    return value === null ? [] : [value]
  }

  /**
   * Returns the raw value without string conversion
   * This is a convenience method for accessing typed data
   *
   * @param name - Parameter name
   */
  getRaw<T = unknown>(name: string): T | undefined {
    return this.data[name] as T | undefined
  }

  /**
   * Sets the value of the parameter with the specified name
   *
   * @param name - Parameter name
   * @param value - Parameter value
   */
  set(name: string, value: unknown): void {
    // Create a new data object with the updated value
    const newData = {
      ...this.data,
      [name]: value
    }

    // Validate the updated data against the schema
    this.data = this.schema.parse(newData)
  }

  /**
   * Returns whether a parameter with the specified name exists
   *
   * @param name - Parameter name
   */
  has(name: string): boolean {
    return name in this.data && this.data[name] !== undefined
  }

  /**
   * Deletes the parameter with the specified name
   *
   * @param name - Parameter name
   */
  delete(name: string): void {
    const newData = { ...this.data }
    delete newData[name]

    // Validate the updated data against the schema
    // This will fail if the deleted field was required
    this.data = this.schema.parse(newData)
  }

  /**
   * Appends a value to the parameter with the specified name
   * If the parameter is an array, appends to it
   * If the parameter doesn't exist or isn't an array, throws an error
   *
   * @param name - Parameter name
   * @param value - Value to append
   */
  append(name: string, value: unknown): void {
    if (!(name in this.data)) {
      throw new ValidationError(
        `Cannot append to non-existent parameter: ${name}`
      )
    }

    const currentValue = this.data[name]

    if (!Array.isArray(currentValue)) {
      throw new ValidationError(
        `Cannot append to non-array parameter: ${name}`
      )
    }

    this.set(name, [...currentValue, value])
  }

  /**
   * Sorts all parameters by name
   * Note: This affects the iteration order but not the encoded output
   */
  sort(): void {
    const sortedKeys = Object.keys(this.data).sort()
    const sortedData: Record<string, unknown> = {}

    for (const key of sortedKeys) {
      sortedData[key] = this.data[key]
    }

    this.data = sortedData
  }

  /**
   * Returns an iterator of all key/value pairs
   */
  *entries(): IterableIterator<[string, string]> {
    for (const [key, value] of Object.entries(this.data)) {
      if (value !== undefined) {
        yield [key, String(value)]
      }
    }
  }

  /**
   * Returns an iterator of all parameter names
   */
  *keys(): IterableIterator<string> {
    for (const key of Object.keys(this.data)) {
      if (this.data[key] !== undefined) {
        yield key
      }
    }
  }

  /**
   * Returns an iterator of all parameter values (as strings)
   */
  *values(): IterableIterator<string> {
    for (const value of Object.values(this.data)) {
      if (value !== undefined) {
        yield String(value)
      }
    }
  }

  /**
   * Executes a callback function for each parameter
   *
   * @param callback - Function to execute for each parameter
   * @param thisArg - Value to use as `this` when executing callback
   */
  forEach(
    callback: (value: string, key: string, parent: this) => void,
    thisArg?: unknown
  ): void {
    const boundCallback = thisArg ? callback.bind(thisArg) : callback

    for (const [key, value] of this.entries()) {
      boundCallback(value, key, this)
    }
  }

  /**
   * Returns the encoded string representation
   * This is the compact, compressed, base64url-encoded state
   */
  toString(): string {
    return encode(this.data, this.schema, this.version)
  }

  /**
   * Returns the raw data object
   * This is useful for accessing the original typed data
   */
  toObject(): Record<string, unknown> {
    return { ...this.data }
  }

  /**
   * Returns the size (number of parameters)
   */
  get size(): number {
    return Object.keys(this.data).filter(
      key => this.data[key] !== undefined
    ).length
  }

  /**
   * Makes the instance iterable (for...of support)
   */
  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries()
  }

  /**
   * Custom inspection for Node.js console.log
   */
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return `EncodedQueryParams { ${Array.from(this.entries())
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')} }`
  }
}
