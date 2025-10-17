import type { z } from 'zod'

export interface EncoderOptions {
  safeParse?: boolean
  /**
   * Enable experimental optimizations (dictionary compression + boolean packing)
   * These optimizations are deterministic and work across FE/BE when same schema is used
   * Default: false (disabled for backward compatibility)
   */
  experimental?: {
    /** Dictionary compression for repeated strings (40-60% savings on string-heavy data) */
    stringDictionary?: boolean
    /** Bit-packing for boolean fields (saves ~1 byte per boolean) */
    booleanPacking?: boolean
  }
}

export interface DecoderOptions {
  safeParse?: boolean
}

export interface VersionedSchemaConfig<T extends Record<string, z.ZodType>> {
  versions: T
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  migrations: Record<string, { up: (data: any) => any; down: (data: any) => any }>
}
