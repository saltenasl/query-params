import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  createMigration,
  applyMigrations,
  getVersion
} from './migrations'
import { encode } from './encoder'
import { decode } from './decoder'
import { VersionMismatchError } from './errors'

describe('migrations', () => {
  describe('createMigration', () => {
    it('should create a migration with up and down functions', () => {
      const migration = createMigration({
        up: (data) => ({ ...data, newField: 'default' }),
        down: (data) => {
          const { newField, ...rest } = data
          return rest
        }
      })

      expect(migration).toHaveProperty('up')
      expect(migration).toHaveProperty('down')
      expect(typeof migration.up).toBe('function')
      expect(typeof migration.down).toBe('function')
    })

    it('should return the same migration object', () => {
      const migrationDef = {
        up: (data: any) => data,
        down: (data: any) => data
      }

      const migration = createMigration(migrationDef)

      expect(migration.up).toBe(migrationDef.up)
      expect(migration.down).toBe(migrationDef.down)
    })

    it('should create type-safe migrations', () => {
      interface V1 {
        name: string
      }

      interface V2 {
        name: string
        email: string
      }

      const migration = createMigration<V1, V2>({
        up: (data) => ({ ...data, email: 'default@example.com' }),
        down: (data) => {
          const { email, ...rest } = data
          return rest
        }
      })

      const v1Data: V1 = { name: 'Alice' }
      const v2Data = migration.up(v1Data)

      expect(v2Data).toEqual({ name: 'Alice', email: 'default@example.com' })
      expect(migration.down(v2Data)).toEqual(v1Data)
    })
  })

  describe('getVersion', () => {
    it('should extract version from encoded data', () => {
      const schema = z.object({ name: z.string() })
      const encoded = encode({ name: 'Alice' }, schema, 2)

      const version = getVersion(encoded, schema)

      expect(version).toBe(2)
    })

    it('should return 1 for data encoded with default version', () => {
      const schema = z.object({ name: z.string() })
      const encoded = encode({ name: 'Alice' }, schema)

      const version = getVersion(encoded, schema)

      expect(version).toBe(1)
    })

    it('should return 1 for invalid encoded data', () => {
      const schema = z.object({ name: z.string() })
      const version = getVersion('invalid-data', schema)

      expect(version).toBe(1)
    })

    it('should handle various version numbers', () => {
      const schema = z.object({ value: z.number() })

      const encoded1 = encode({ value: 1 }, schema, 1)
      const encoded5 = encode({ value: 5 }, schema, 5)
      const encoded100 = encode({ value: 100 }, schema, 100)

      expect(getVersion(encoded1, schema)).toBe(1)
      expect(getVersion(encoded5, schema)).toBe(5)
      expect(getVersion(encoded100, schema)).toBe(100)
    })
  })

  describe('applyMigrations', () => {
    describe('single migration (up)', () => {
      it('should apply single upgrade migration', () => {
        const schemaV1 = z.object({ name: z.string() })
        const schemaV2 = z.object({ name: z.string(), email: z.string() })

        const v1ToV2 = createMigration({
          up: (data) => ({ ...data, email: 'default@example.com' }),
          down: (data) => {
            const { email, ...rest } = data
            return rest
          }
        })

        const encoded = encode({ name: 'Alice' }, schemaV1, 1)
        const migrated = applyMigrations(encoded, schemaV1, schemaV2, 2, [v1ToV2])

        const decoded = decode(migrated, schemaV2)

        expect(decoded).toEqual({ name: 'Alice', email: 'default@example.com' })
        expect(getVersion(migrated, schemaV2)).toBe(2)
      })

      it('should preserve data during upgrade migration', () => {
        const schemaV1 = z.object({
          name: z.string(),
          age: z.number(),
          active: z.boolean()
        })

        const schemaV2 = z.object({
          name: z.string(),
          age: z.number(),
          active: z.boolean(),
          role: z.string()
        })

        const v1ToV2 = createMigration({
          up: (data) => ({ ...data, role: 'user' }),
          down: (data) => {
            const { role, ...rest } = data
            return rest
          }
        })

        const originalData = { name: 'Bob', age: 30, active: true }
        const encoded = encode(originalData, schemaV1, 1)
        const migrated = applyMigrations(encoded, schemaV1, schemaV2, 2, [v1ToV2])

        const decoded = decode(migrated, schemaV2)

        expect(decoded).toEqual({ ...originalData, role: 'user' })
      })

      it('should transform data during upgrade', () => {
        const schemaV1 = z.object({ fullName: z.string() })
        const schemaV2 = z.object({
          firstName: z.string(),
          lastName: z.string()
        })

        const v1ToV2 = createMigration({
          up: (data: any) => {
            const [firstName, lastName] = data.fullName.split(' ')
            return { firstName, lastName }
          },
          down: (data: any) => ({
            fullName: `${data.firstName} ${data.lastName}`
          })
        })

        const encoded = encode({ fullName: 'Alice Smith' }, schemaV1, 1)
        const migrated = applyMigrations(encoded, schemaV1, schemaV2, 2, [v1ToV2])

        const decoded = decode(migrated, schemaV2)

        expect(decoded).toEqual({ firstName: 'Alice', lastName: 'Smith' })
      })
    })

    describe('single migration (down)', () => {
      it('should apply single downgrade migration', () => {
        const schemaV2 = z.object({ name: z.string(), email: z.string() })
        const schemaV1 = z.object({ name: z.string() })

        const v1ToV2 = createMigration({
          up: (data) => ({ ...data, email: 'default@example.com' }),
          down: (data: any) => {
            const { email, ...rest } = data
            return rest
          }
        })

        const encoded = encode(
          { name: 'Alice', email: 'alice@example.com' },
          schemaV2,
          2
        )
        const migrated = applyMigrations(encoded, schemaV2, schemaV1, 1, [v1ToV2])

        const decoded = decode(migrated, schemaV1)

        expect(decoded).toEqual({ name: 'Alice' })
        expect(getVersion(migrated, schemaV1)).toBe(1)
      })

      it('should remove fields during downgrade', () => {
        const schemaV2 = z.object({
          name: z.string(),
          age: z.number(),
          email: z.string(),
          phone: z.string()
        })

        const schemaV1 = z.object({
          name: z.string(),
          age: z.number()
        })

        const v1ToV2 = createMigration({
          up: (data) => ({
            ...data,
            email: 'default@example.com',
            phone: '000-0000'
          }),
          down: (data: any) => {
            const { email, phone, ...rest } = data
            return rest
          }
        })

        const encoded = encode(
          { name: 'Bob', age: 30, email: 'bob@test.com', phone: '123-4567' },
          schemaV2,
          2
        )
        const migrated = applyMigrations(encoded, schemaV2, schemaV1, 1, [v1ToV2])

        const decoded = decode(migrated, schemaV1)

        expect(decoded).toEqual({ name: 'Bob', age: 30 })
      })

      it('should transform data during downgrade', () => {
        const schemaV2 = z.object({
          firstName: z.string(),
          lastName: z.string()
        })
        const schemaV1 = z.object({ fullName: z.string() })

        const v1ToV2 = createMigration({
          up: (data: any) => {
            const [firstName, lastName] = data.fullName.split(' ')
            return { firstName, lastName }
          },
          down: (data: any) => ({
            fullName: `${data.firstName} ${data.lastName}`
          })
        })

        const encoded = encode(
          { firstName: 'Alice', lastName: 'Smith' },
          schemaV2,
          2
        )
        const migrated = applyMigrations(encoded, schemaV2, schemaV1, 1, [v1ToV2])

        const decoded = decode(migrated, schemaV1)

        expect(decoded).toEqual({ fullName: 'Alice Smith' })
      })
    })

    describe('multiple migrations (forward)', () => {
      it('should apply multiple migrations forward', () => {
        const schemaV1 = z.object({ name: z.string() })
        const schemaV3 = z.object({
          name: z.string(),
          email: z.string(),
          role: z.string()
        })

        const v1ToV2 = createMigration({
          up: (data) => ({ ...data, email: 'default@example.com' }),
          down: (data: any) => {
            const { email, ...rest } = data
            return rest
          }
        })

        const v2ToV3 = createMigration({
          up: (data) => ({ ...data, role: 'user' }),
          down: (data: any) => {
            const { role, ...rest } = data
            return rest
          }
        })

        const encoded = encode({ name: 'Alice' }, schemaV1, 1)
        const migrated = applyMigrations(encoded, schemaV1, schemaV3, 3, [v1ToV2, v2ToV3])

        const decoded = decode(migrated, schemaV3)

        expect(decoded).toEqual({
          name: 'Alice',
          email: 'default@example.com',
          role: 'user'
        })
        expect(getVersion(migrated, schemaV3)).toBe(3)
      })

      it('should apply migrations in sequence', () => {
        const schemaV1 = z.object({ value: z.number() })
        const schemaV4 = z.object({ value: z.number() })

        const v1ToV2 = createMigration({
          up: (data: any) => ({ value: data.value * 2 }),
          down: (data: any) => ({ value: data.value / 2 })
        })

        const v2ToV3 = createMigration({
          up: (data: any) => ({ value: data.value + 10 }),
          down: (data: any) => ({ value: data.value - 10 })
        })

        const v3ToV4 = createMigration({
          up: (data: any) => ({ value: data.value * 3 }),
          down: (data: any) => ({ value: data.value / 3 })
        })

        const encoded = encode({ value: 5 }, schemaV1, 1)
        const migrated = applyMigrations(encoded, schemaV1, schemaV4, 4, [
          v1ToV2,
          v2ToV3,
          v3ToV4
        ])

        const decoded = decode(migrated, schemaV4)

        // 5 * 2 = 10, 10 + 10 = 20, 20 * 3 = 60
        expect(decoded).toEqual({ value: 60 })
      })

      it('should handle complex data transformations across versions', () => {
        const schemaV1 = z.object({ items: z.array(z.string()) })
        const schemaV3 = z.object({
          items: z.array(z.string()),
          count: z.number(),
          summary: z.string()
        })

        const v1ToV2 = createMigration({
          up: (data: any) => ({ ...data, count: data.items.length }),
          down: (data: any) => {
            const { count, ...rest } = data
            return rest
          }
        })

        const v2ToV3 = createMigration({
          up: (data: any) => ({
            ...data,
            summary: `${data.count} items`
          }),
          down: (data: any) => {
            const { summary, ...rest } = data
            return rest
          }
        })

        const encoded = encode({ items: ['a', 'b', 'c'] }, schemaV1, 1)
        const migrated = applyMigrations(encoded, schemaV1, schemaV3, 3, [v1ToV2, v2ToV3])

        const decoded = decode(migrated, schemaV3)

        expect(decoded).toEqual({
          items: ['a', 'b', 'c'],
          count: 3,
          summary: '3 items'
        })
      })
    })

    describe('multiple migrations (backward)', () => {
      it('should apply multiple migrations backward', () => {
        const schemaV3 = z.object({
          name: z.string(),
          email: z.string(),
          role: z.string()
        })
        const schemaV1 = z.object({ name: z.string() })

        const v1ToV2 = createMigration({
          up: (data) => ({ ...data, email: 'default@example.com' }),
          down: (data: any) => {
            const { email, ...rest } = data
            return rest
          }
        })

        const v2ToV3 = createMigration({
          up: (data) => ({ ...data, role: 'user' }),
          down: (data: any) => {
            const { role, ...rest } = data
            return rest
          }
        })

        const encoded = encode(
          { name: 'Alice', email: 'alice@test.com', role: 'admin' },
          schemaV3,
          3
        )
        const migrated = applyMigrations(encoded, schemaV3, schemaV1, 1, [v1ToV2, v2ToV3])

        const decoded = decode(migrated, schemaV1)

        expect(decoded).toEqual({ name: 'Alice' })
        expect(getVersion(migrated, schemaV1)).toBe(1)
      })

      it('should apply migrations in reverse sequence', () => {
        const schemaV4 = z.object({ value: z.number() })
        const schemaV1 = z.object({ value: z.number() })

        const v1ToV2 = createMigration({
          up: (data: any) => ({ value: data.value * 2 }),
          down: (data: any) => ({ value: data.value / 2 })
        })

        const v2ToV3 = createMigration({
          up: (data: any) => ({ value: data.value + 10 }),
          down: (data: any) => ({ value: data.value - 10 })
        })

        const v3ToV4 = createMigration({
          up: (data: any) => ({ value: data.value * 3 }),
          down: (data: any) => ({ value: data.value / 3 })
        })

        const encoded = encode({ value: 60 }, schemaV4, 4)
        const migrated = applyMigrations(encoded, schemaV4, schemaV1, 1, [
          v1ToV2,
          v2ToV3,
          v3ToV4
        ])

        const decoded = decode(migrated, schemaV1)

        // 60 / 3 = 20, 20 - 10 = 10, 10 / 2 = 5
        expect(decoded).toEqual({ value: 5 })
      })

      it('should handle partial downgrade', () => {
        const schemaV4 = z.object({
          name: z.string(),
          b: z.string(),
          c: z.string(),
          d: z.string()
        })
        const schemaV2 = z.object({
          name: z.string(),
          b: z.string()
        })

        const v1ToV2 = createMigration({
          up: (data) => ({ ...data, b: 'b' }),
          down: (data: any) => {
            const { b, ...rest } = data
            return rest
          }
        })

        const v2ToV3 = createMigration({
          up: (data) => ({ ...data, c: 'c' }),
          down: (data: any) => {
            const { c, ...rest } = data
            return rest
          }
        })

        const v3ToV4 = createMigration({
          up: (data) => ({ ...data, d: 'd' }),
          down: (data: any) => {
            const { d, ...rest } = data
            return rest
          }
        })

        const encoded = encode(
          { name: 'test', b: 'b', c: 'c', d: 'd' },
          schemaV4,
          4
        )
        const migrated = applyMigrations(encoded, schemaV4, schemaV2, 2, [
          v1ToV2,
          v2ToV3,
          v3ToV4
        ])

        const decoded = decode(migrated, schemaV2)

        expect(decoded).toEqual({ name: 'test', b: 'b' })
      })
    })

    describe('skipping versions', () => {
      it('should skip from v1 to v3', () => {
        const schemaV1 = z.object({ name: z.string() })
        const schemaV3 = z.object({
          name: z.string(),
          email: z.string(),
          role: z.string()
        })

        const v1ToV2 = createMigration({
          up: (data) => ({ ...data, email: 'default@example.com' }),
          down: (data: any) => {
            const { email, ...rest } = data
            return rest
          }
        })

        const v2ToV3 = createMigration({
          up: (data) => ({ ...data, role: 'user' }),
          down: (data: any) => {
            const { role, ...rest } = data
            return rest
          }
        })

        const encoded = encode({ name: 'Alice' }, schemaV1, 1)
        const migrated = applyMigrations(encoded, schemaV1, schemaV3, 3, [v1ToV2, v2ToV3])

        const decoded = decode(migrated, schemaV3)

        expect(decoded).toEqual({
          name: 'Alice',
          email: 'default@example.com',
          role: 'user'
        })
        expect(getVersion(migrated, schemaV3)).toBe(3)
      })

      it('should skip from v1 to v5', () => {
        const schemaV1 = z.object({ value: z.number() })
        const schemaV5 = z.object({ value: z.number() })

        const migrations = [
          createMigration({
            up: (data: any) => ({ value: data.value + 1 }),
            down: (data: any) => ({ value: data.value - 1 })
          }),
          createMigration({
            up: (data: any) => ({ value: data.value + 1 }),
            down: (data: any) => ({ value: data.value - 1 })
          }),
          createMigration({
            up: (data: any) => ({ value: data.value + 1 }),
            down: (data: any) => ({ value: data.value - 1 })
          }),
          createMigration({
            up: (data: any) => ({ value: data.value + 1 }),
            down: (data: any) => ({ value: data.value - 1 })
          })
        ]

        const encoded = encode({ value: 10 }, schemaV1, 1)
        const migrated = applyMigrations(encoded, schemaV1, schemaV5, 5, migrations)

        const decoded = decode(migrated, schemaV5)

        expect(decoded).toEqual({ value: 14 })
      })

      it('should skip from v5 to v2', () => {
        const schemaV5 = z.object({ value: z.number() })
        const schemaV2 = z.object({ value: z.number() })

        const migrations = [
          createMigration({
            up: (data: any) => ({ value: data.value + 1 }),
            down: (data: any) => ({ value: data.value - 1 })
          }),
          createMigration({
            up: (data: any) => ({ value: data.value + 1 }),
            down: (data: any) => ({ value: data.value - 1 })
          }),
          createMigration({
            up: (data: any) => ({ value: data.value + 1 }),
            down: (data: any) => ({ value: data.value - 1 })
          }),
          createMigration({
            up: (data: any) => ({ value: data.value + 1 }),
            down: (data: any) => ({ value: data.value - 1 })
          })
        ]

        const encoded = encode({ value: 20 }, schemaV5, 5)
        const migrated = applyMigrations(encoded, schemaV5, schemaV2, 2, migrations)

        const decoded = decode(migrated, schemaV2)

        expect(decoded).toEqual({ value: 17 })
      })
    })

    describe('same version (no-op)', () => {
      it('should return data unchanged for same version', () => {
        const schema = z.object({ name: z.string(), age: z.number() })

        const v1ToV2 = createMigration({
          up: (data) => ({ ...data, email: 'test@example.com' }),
          down: (data: any) => {
            const { email, ...rest } = data
            return rest
          }
        })

        const encoded = encode({ name: 'Alice', age: 30 }, schema, 2)
        const migrated = applyMigrations(encoded, schema, schema, 2, [v1ToV2])

        expect(migrated).toBeDefined()
        expect(getVersion(migrated, schema)).toBe(2)

        const decoded = decode(migrated, schema)
        expect(decoded).toEqual({ name: 'Alice', age: 30 })
      })

      it('should validate schema even when version matches', () => {
        const schema = z.object({
          name: z.string(),
          age: z.number().min(0).max(150)
        })

        const encoded = encode({ name: 'Bob', age: 25 }, schema, 1)
        const migrated = applyMigrations(encoded, schema, schema, 1, [])

        const decoded = decode(migrated, schema)
        expect(decoded).toEqual({ name: 'Bob', age: 25 })
      })
    })

    describe('error cases', () => {
      it('should throw VersionMismatchError for missing upgrade migration', () => {
        const schemaV1 = z.object({ name: z.string() })
        const schemaV3 = z.object({
          name: z.string(),
          email: z.string(),
          role: z.string()
        })

        const v1ToV2 = createMigration({
          up: (data) => ({ ...data, email: 'default@example.com' }),
          down: (data: any) => {
            const { email, ...rest } = data
            return rest
          }
        })

        // Missing v2ToV3 migration

        const encoded = encode({ name: 'Alice' }, schemaV1, 1)

        expect(() => {
          applyMigrations(encoded, schemaV1, schemaV3, 3, [v1ToV2])
        }).toThrow(VersionMismatchError)

        expect(() => {
          applyMigrations(encoded, schemaV1, schemaV3, 3, [v1ToV2])
        }).toThrow(/Missing migration from version 2 to 3/)
      })

      it('should throw VersionMismatchError for missing downgrade migration', () => {
        const schemaV3 = z.object({
          name: z.string(),
          email: z.string(),
          role: z.string()
        })
        const schemaV1 = z.object({ name: z.string() })

        const v2ToV3 = createMigration({
          up: (data) => ({ ...data, role: 'user' }),
          down: (data: any) => {
            const { role, ...rest } = data
            return rest
          }
        })

        // Missing v1ToV2 migration

        const encoded = encode(
          { name: 'Alice', email: 'test@test.com', role: 'admin' },
          schemaV3,
          3
        )

        expect(() => {
          applyMigrations(encoded, schemaV3, schemaV1, 1, [v2ToV3])
        }).toThrow(VersionMismatchError)

        expect(() => {
          applyMigrations(encoded, schemaV3, schemaV1, 1, [v2ToV3])
        }).toThrow(/Missing migration from version 3 to 2/)
      })

      it('should throw VersionMismatchError when migration array is empty', () => {
        const schemaV1 = z.object({ name: z.string() })
        const schemaV2 = z.object({ name: z.string(), email: z.string() })

        const encoded = encode({ name: 'Alice' }, schemaV1, 1)

        expect(() => {
          applyMigrations(encoded, schemaV1, schemaV2, 2, [])
        }).toThrow(VersionMismatchError)
      })

      it('should throw descriptive error with version numbers', () => {
        const schemaV1 = z.object({ value: z.number() })
        const schemaV10 = z.object({ value: z.number() })

        const migrations = Array(5)
          .fill(null)
          .map(() =>
            createMigration({
              up: (data: any) => data,
              down: (data: any) => data
            })
          )

        const encoded = encode({ value: 42 }, schemaV1, 1)

        expect(() => {
          applyMigrations(encoded, schemaV1, schemaV10, 10, migrations)
        }).toThrow(/Missing migration from version 6 to 7/)

        expect(() => {
          applyMigrations(encoded, schemaV1, schemaV10, 10, migrations)
        }).toThrow(/Cannot upgrade from v1 to v10/)
      })
    })

    describe('various schema types', () => {
      it('should work with schemas containing optional fields', () => {
        const schemaV1 = z.object({
          name: z.string(),
          age: z.number().optional()
        })

        const schemaV2 = z.object({
          name: z.string(),
          age: z.number().optional(),
          email: z.string().optional()
        })

        const v1ToV2 = createMigration({
          up: (data) => ({ ...data, email: undefined }),
          down: (data: any) => {
            const { email, ...rest } = data
            return rest
          }
        })

        const encoded = encode({ name: 'Alice', age: 30 }, schemaV1, 1)
        const migrated = applyMigrations(encoded, schemaV1, schemaV2, 2, [v1ToV2])

        const decoded = decode(migrated, schemaV2)
        expect(decoded).toEqual({ name: 'Alice', age: 30 })
      })

      it('should work with schemas containing arrays', () => {
        const schemaV1 = z.object({
          items: z.array(z.string())
        })

        const schemaV2 = z.object({
          items: z.array(z.string()),
          tags: z.array(z.string())
        })

        const v1ToV2 = createMigration({
          up: (data) => ({ ...data, tags: [] }),
          down: (data: any) => {
            const { tags, ...rest } = data
            return rest
          }
        })

        const encoded = encode({ items: ['a', 'b', 'c'] }, schemaV1, 1)
        const migrated = applyMigrations(encoded, schemaV1, schemaV2, 2, [v1ToV2])

        const decoded = decode(migrated, schemaV2)
        expect(decoded).toEqual({ items: ['a', 'b', 'c'], tags: [] })
      })

      it('should work with schemas containing nested objects', () => {
        const schemaV1 = z.object({
          user: z.object({
            name: z.string()
          })
        })

        const schemaV2 = z.object({
          user: z.object({
            name: z.string(),
            profile: z.object({
              bio: z.string()
            })
          })
        })

        const v1ToV2 = createMigration({
          up: (data: any) => ({
            user: {
              ...data.user,
              profile: { bio: 'No bio' }
            }
          }),
          down: (data: any) => ({
            user: {
              name: data.user.name
            }
          })
        })

        const encoded = encode({ user: { name: 'Alice' } }, schemaV1, 1)
        const migrated = applyMigrations(encoded, schemaV1, schemaV2, 2, [v1ToV2])

        const decoded = decode(migrated, schemaV2)
        expect(decoded).toEqual({
          user: { name: 'Alice', profile: { bio: 'No bio' } }
        })
      })

      it('should work with schemas containing enums', () => {
        const schemaV1 = z.object({
          status: z.enum(['active', 'inactive'])
        })

        const schemaV2 = z.object({
          status: z.enum(['active', 'inactive', 'pending']),
          priority: z.enum(['low', 'medium', 'high'])
        })

        const v1ToV2 = createMigration({
          up: (data) => ({ ...data, priority: 'low' as const }),
          down: (data: any) => {
            const { priority, ...rest } = data
            return rest
          }
        })

        const encoded = encode({ status: 'active' }, schemaV1, 1)
        const migrated = applyMigrations(encoded, schemaV1, schemaV2, 2, [v1ToV2])

        const decoded = decode(migrated, schemaV2)
        expect(decoded).toEqual({ status: 'active', priority: 'low' })
      })

      it('should work with schemas containing numbers and booleans', () => {
        const schemaV1 = z.object({
          count: z.number(),
          enabled: z.boolean()
        })

        const schemaV2 = z.object({
          count: z.number(),
          enabled: z.boolean(),
          ratio: z.number(),
          verified: z.boolean()
        })

        const v1ToV2 = createMigration({
          up: (data) => ({ ...data, ratio: 1.0, verified: false }),
          down: (data: any) => {
            const { ratio, verified, ...rest } = data
            return rest
          }
        })

        const encoded = encode({ count: 42, enabled: true }, schemaV1, 1)
        const migrated = applyMigrations(encoded, schemaV1, schemaV2, 2, [v1ToV2])

        const decoded = decode(migrated, schemaV2)
        expect(decoded).toEqual({
          count: 42,
          enabled: true,
          ratio: 1.0,
          verified: false
        })
      })

      it('should work with schemas containing records', () => {
        const schemaV1 = z.object({
          metadata: z.record(z.string())
        })

        const schemaV2 = z.object({
          metadata: z.record(z.string()),
          tags: z.record(z.boolean())
        })

        const v1ToV2 = createMigration({
          up: (data) => ({ ...data, tags: {} }),
          down: (data: any) => {
            const { tags, ...rest } = data
            return rest
          }
        })

        const encoded = encode(
          { metadata: { key1: 'value1', key2: 'value2' } },
          schemaV1,
          1
        )
        const migrated = applyMigrations(encoded, schemaV1, schemaV2, 2, [v1ToV2])

        const decoded = decode(migrated, schemaV2)
        expect(decoded).toEqual({
          metadata: { key1: 'value1', key2: 'value2' },
          tags: {}
        })
      })
    })

    describe('edge cases', () => {
      it('should handle empty objects', () => {
        const schemaV1 = z.object({})
        const schemaV2 = z.object({ field: z.string() })

        const v1ToV2 = createMigration({
          up: (data) => ({ ...data, field: 'default' }),
          down: (data: any) => {
            const { field, ...rest } = data
            return rest
          }
        })

        const encoded = encode({}, schemaV1, 1)
        const migrated = applyMigrations(encoded, schemaV1, schemaV2, 2, [v1ToV2])

        const decoded = decode(migrated, schemaV2)
        expect(decoded).toEqual({ field: 'default' })
      })

      it('should handle migrations that modify array contents', () => {
        const schemaV1 = z.object({
          items: z.array(z.number())
        })

        const schemaV2 = z.object({
          items: z.array(z.number())
        })

        const v1ToV2 = createMigration({
          up: (data: any) => ({
            items: data.items.map((x: number) => x * 2)
          }),
          down: (data: any) => ({
            items: data.items.map((x: number) => x / 2)
          })
        })

        const encoded = encode({ items: [1, 2, 3, 4] }, schemaV1, 1)
        const migrated = applyMigrations(encoded, schemaV1, schemaV2, 2, [v1ToV2])

        const decoded = decode(migrated, schemaV2)
        expect(decoded).toEqual({ items: [2, 4, 6, 8] })
      })

      it('should handle migrations with complex transformations', () => {
        interface V1Data {
          users: Array<{ name: string; age: number }>
        }

        interface V2Data {
          users: Array<{ name: string; age: number }>
          summary: { total: number; avgAge: number }
        }

        const schemaV1 = z.object({
          users: z.array(z.object({ name: z.string(), age: z.number() }))
        })

        const schemaV2 = z.object({
          users: z.array(z.object({ name: z.string(), age: z.number() })),
          summary: z.object({ total: z.number(), avgAge: z.number() })
        })

        const v1ToV2 = createMigration<V1Data, V2Data>({
          up: (data) => {
            const total = data.users.length
            const avgAge =
              total > 0
                ? data.users.reduce((sum, u) => sum + u.age, 0) / total
                : 0
            return { ...data, summary: { total, avgAge } }
          },
          down: (data) => {
            const { summary, ...rest } = data
            return rest
          }
        })

        const encoded = encode(
          {
            users: [
              { name: 'Alice', age: 30 },
              { name: 'Bob', age: 40 }
            ]
          },
          schemaV1,
          1
        )

        const migrated = applyMigrations(encoded, schemaV1, schemaV2, 2, [v1ToV2])

        const decoded = decode(migrated, schemaV2)
        expect(decoded).toEqual({
          users: [
            { name: 'Alice', age: 30 },
            { name: 'Bob', age: 40 }
          ],
          summary: { total: 2, avgAge: 35 }
        })
      })

      it('should handle bi-directional migrations correctly', () => {
        const schemaV1 = z.object({ value: z.number() })
        const schemaV2 = z.object({ value: z.number() })

        const v1ToV2 = createMigration({
          up: (data: any) => ({ value: data.value * 100 }),
          down: (data: any) => ({ value: data.value / 100 })
        })

        // Test up then down
        const encoded1 = encode({ value: 5 }, schemaV1, 1)
        const migratedUp = applyMigrations(encoded1, schemaV1, schemaV2, 2, [v1ToV2])
        const decodedUp = decode(migratedUp, schemaV2)
        expect(decodedUp).toEqual({ value: 500 })

        // Migrate back down
        const migratedDown = applyMigrations(migratedUp, schemaV2, schemaV1, 1, [v1ToV2])
        const decodedDown = decode(migratedDown, schemaV1)
        expect(decodedDown).toEqual({ value: 5 })
      })
    })
  })
})
