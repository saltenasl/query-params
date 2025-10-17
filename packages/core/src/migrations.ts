import { z } from 'zod'
import { decodeWithVersion } from './decoder.js'
import { encode } from './encoder.js'
import { createVersionMismatchError } from './errors.js'

/**
 * Represents a migration between two versions
 * Migrations must be pure functions with no side effects
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Migration<TFrom = any, TTo = any> {
  /**
   * Upgrades data from version N to N+1
   */
  up: (data: TFrom) => TTo

  /**
   * Downgrades data from version N+1 to N
   */
  down: (data: TTo) => TFrom
}

/**
 * Creates a type-safe migration between two versions
 *
 * @param migration - Migration definition with up and down functions
 * @returns Migration object
 *
 * @example
 * ```typescript
 * const v1ToV2 = createMigration({
 *   up: (data) => ({ ...data, newField: 'default' }),
 *   down: (data) => { const { newField, ...rest } = data; return rest; }
 * })
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMigration<TFrom = any, TTo = any>(
  migration: Migration<TFrom, TTo>
): Migration<TFrom, TTo> {
  return migration
}

/**
 * Helper function to extract version and data from encoded string
 * without requiring a specific schema
 */
function extractVersionAndData(encoded: string, sourceSchema: z.ZodType): { version: number; data: unknown } {
  const { data, version } = decodeWithVersion(encoded, sourceSchema)
  return { version, data }
}

/**
 * Applies migrations to encoded data to reach the target version
 *
 * This function:
 * 1. Decodes the data to extract the current version
 * 2. Determines the migration path (up or down)
 * 3. Applies migrations in sequence
 * 4. Re-encodes the data with the new version
 *
 * @param encoded - Encoded string to migrate
 * @param sourceSchema - Zod schema for the current version (the schema used to encode the data)
 * @param targetSchema - Zod schema for the target version
 * @param targetVersion - Target version number to migrate to
 * @param migrations - Array of migrations, ordered from v1→v2, v2→v3, etc.
 * @returns Encoded string with migrated data at target version
 *
 * @throws {VersionMismatchError} When a required migration is missing
 *
 * @example
 * ```typescript
 * const migrations = [v1ToV2, v2ToV3]
 * const encoded = applyMigrations(oldData, schemaV1, schemaV3, 3, migrations)
 * ```
 */
export function applyMigrations(
  encoded: string,
  sourceSchema: z.ZodType,
  targetSchema: z.ZodType,
  targetVersion: number,
  migrations: Migration[]
): string {
  // Extract current version and data
  const { version: currentVersion, data: decoded } = extractVersionAndData(encoded, sourceSchema)

  // If versions match, no migration needed
  if (currentVersion === targetVersion) {
    // Just re-encode with target schema to validate
    return encode(decoded, targetSchema, targetVersion)
  }

  let data = decoded

  // Determine direction and apply migrations
  if (currentVersion < targetVersion) {
    // Upgrade path: apply up migrations
    for (let v = currentVersion; v < targetVersion; v++) {
      const migrationIndex = v - 1 // migrations[0] is v1→v2

      if (migrationIndex >= migrations.length || !migrations[migrationIndex]) {
        throw createVersionMismatchError(
          `Missing migration from version ${v} to ${v + 1}. ` +
          `Cannot upgrade from v${currentVersion} to v${targetVersion}.`
        )
      }

      data = migrations[migrationIndex].up(data)
    }
  } else {
    // Downgrade path: apply down migrations in reverse
    for (let v = currentVersion; v > targetVersion; v--) {
      const migrationIndex = v - 2 // migrations[0] is v1→v2, so v2→v1 is also migrations[0].down

      if (migrationIndex < 0 || migrationIndex >= migrations.length || !migrations[migrationIndex]) {
        throw createVersionMismatchError(
          `Missing migration from version ${v} to ${v - 1}. ` +
          `Cannot downgrade from v${currentVersion} to v${targetVersion}.`
        )
      }

      data = migrations[migrationIndex].down(data)
    }
  }

  // Re-encode with target version and schema
  return encode(data, targetSchema, targetVersion)
}

/**
 * Gets the version number from encoded data
 *
 * @param encoded - Encoded string
 * @param schema - Zod schema for the encoded data
 * @returns Version number
 *
 * @example
 * ```typescript
 * const version = getVersion(encoded, schema)
 * console.log(`Data is at version ${version}`)
 * ```
 */
export function getVersion(encoded: string, schema: z.ZodType): number {
  try {
    const { version } = decodeWithVersion(encoded, schema)
    return version
  } catch {
    // Default to version 1 if we can't extract
    return 1
  }
}

/**
 * Type helper for creating migration chains
 * Ensures type safety across multiple migrations
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MigrationChain<Versions extends readonly any[]> = {
  [K in keyof Versions]: K extends `${number}`
    ? number extends Versions[K]
      ? never
      : Migration<
          K extends '0' ? Versions[0] : Versions[number],
          Versions[number]
        >
    : never
}
