import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  validateSchema,
  isZodObject,
  getSchemaShape,
  RESERVED_FIELD,
} from './validation'
import { ValidationError } from './errors'

describe('validation', () => {
  describe('RESERVED_FIELD', () => {
    it('should export the reserved field name', () => {
      expect(RESERVED_FIELD).toBe('_encodedStateVersion')
    })
  })

  describe('isZodObject', () => {
    it('should return true for ZodObject', () => {
      const schema = z.object({ name: z.string() })
      expect(isZodObject(schema)).toBe(true)
    })

    it('should return false for ZodString', () => {
      const schema = z.string()
      expect(isZodObject(schema)).toBe(false)
    })

    it('should return false for ZodNumber', () => {
      const schema = z.number()
      expect(isZodObject(schema)).toBe(false)
    })

    it('should return false for ZodArray', () => {
      const schema = z.array(z.string())
      expect(isZodObject(schema)).toBe(false)
    })

    it('should return false for non-Zod values', () => {
      expect(isZodObject(null)).toBe(false)
      expect(isZodObject(undefined)).toBe(false)
      expect(isZodObject({})).toBe(false)
      expect(isZodObject('string')).toBe(false)
      expect(isZodObject(123)).toBe(false)
    })
  })

  describe('getSchemaShape', () => {
    it('should extract shape from ZodObject', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      })
      const shape = getSchemaShape(schema)

      expect(shape).toBeDefined()
      expect(shape.name).toBeDefined()
      expect(shape.age).toBeDefined()
    })

    it('should return empty object for object with no fields', () => {
      const schema = z.object({})
      const shape = getSchemaShape(schema)

      expect(shape).toEqual({})
    })

    it('should preserve field types', () => {
      const schema = z.object({
        str: z.string(),
        num: z.number(),
        bool: z.boolean(),
        arr: z.array(z.string()),
      })
      const shape = getSchemaShape(schema)

      expect(shape.str).toBeInstanceOf(z.ZodString)
      expect(shape.num).toBeInstanceOf(z.ZodNumber)
      expect(shape.bool).toBeInstanceOf(z.ZodBoolean)
      expect(shape.arr).toBeInstanceOf(z.ZodArray)
    })
  })

  describe('validateSchema', () => {
    describe('valid schemas', () => {
      it('should pass validation for simple object schema', () => {
        const schema = z.object({
          name: z.string(),
          age: z.number(),
        })

        expect(() => validateSchema(schema)).not.toThrow()
      })

      it('should pass validation for empty object schema', () => {
        const schema = z.object({})

        expect(() => validateSchema(schema)).not.toThrow()
      })

      it('should pass validation for primitive schemas', () => {
        expect(() => validateSchema(z.string())).not.toThrow()
        expect(() => validateSchema(z.number())).not.toThrow()
        expect(() => validateSchema(z.boolean())).not.toThrow()
      })

      it('should pass validation for array schema', () => {
        const schema = z.array(z.string())

        expect(() => validateSchema(schema)).not.toThrow()
      })

      it('should pass validation for nested object without reserved field', () => {
        const schema = z.object({
          user: z.object({
            name: z.string(),
            profile: z.object({
              bio: z.string(),
            }),
          }),
        })

        expect(() => validateSchema(schema)).not.toThrow()
      })

      it('should pass validation for optional fields', () => {
        const schema = z.object({
          name: z.string(),
          email: z.string().optional(),
        })

        expect(() => validateSchema(schema)).not.toThrow()
      })

      it('should pass validation for nullable fields', () => {
        const schema = z.object({
          name: z.string(),
          nickname: z.string().nullable(),
        })

        expect(() => validateSchema(schema)).not.toThrow()
      })

      it('should pass validation for union types', () => {
        const schema = z.object({
          value: z.union([z.string(), z.number()]),
        })

        expect(() => validateSchema(schema)).not.toThrow()
      })

      it('should pass validation for enum types', () => {
        const schema = z.object({
          status: z.enum(['pending', 'active', 'completed']),
        })

        expect(() => validateSchema(schema)).not.toThrow()
      })
    })

    describe('invalid schemas with reserved field', () => {
      it('should throw ValidationError for top-level reserved field', () => {
        const schema = z.object({
          name: z.string(),
          [RESERVED_FIELD]: z.number(),
        })

        expect(() => validateSchema(schema)).toThrow(ValidationError)
        expect(() => validateSchema(schema)).toThrow(
          `Field name "${RESERVED_FIELD}" is reserved and cannot be used in schemas`
        )
      })

      it('should throw ValidationError for nested reserved field', () => {
        const schema = z.object({
          user: z.object({
            name: z.string(),
            [RESERVED_FIELD]: z.number(),
          }),
        })

        expect(() => validateSchema(schema)).toThrow(ValidationError)
        expect(() => validateSchema(schema)).toThrow(
          `Field name "${RESERVED_FIELD}" is reserved and cannot be used in schemas`
        )
      })

      it('should throw ValidationError for deeply nested reserved field', () => {
        const schema = z.object({
          level1: z.object({
            level2: z.object({
              level3: z.object({
                [RESERVED_FIELD]: z.string(),
              }),
            }),
          }),
        })

        expect(() => validateSchema(schema)).toThrow(ValidationError)
      })

      it('should throw ValidationError for reserved field in array item', () => {
        const schema = z.object({
          items: z.array(
            z.object({
              name: z.string(),
              [RESERVED_FIELD]: z.number(),
            })
          ),
        })

        expect(() => validateSchema(schema)).toThrow(ValidationError)
      })

      it('should throw ValidationError for reserved field in optional object', () => {
        const schema = z.object({
          metadata: z
            .object({
              [RESERVED_FIELD]: z.string(),
            })
            .optional(),
        })

        expect(() => validateSchema(schema)).toThrow(ValidationError)
      })

      it('should throw ValidationError for reserved field in nullable object', () => {
        const schema = z.object({
          metadata: z
            .object({
              [RESERVED_FIELD]: z.string(),
            })
            .nullable(),
        })

        expect(() => validateSchema(schema)).toThrow(ValidationError)
      })

      it('should throw ValidationError for reserved field in union', () => {
        const schema = z.object({
          data: z.union([
            z.object({
              type: z.literal('a'),
              [RESERVED_FIELD]: z.string(),
            }),
            z.object({
              type: z.literal('b'),
            }),
          ]),
        })

        expect(() => validateSchema(schema)).toThrow(ValidationError)
      })

      it('should throw ValidationError for reserved field in discriminated union', () => {
        const schema = z.discriminatedUnion('type', [
          z.object({
            type: z.literal('a'),
            [RESERVED_FIELD]: z.string(),
          }),
          z.object({
            type: z.literal('b'),
            value: z.string(),
          }),
        ])

        expect(() => validateSchema(schema)).toThrow(ValidationError)
      })

      it('should throw ValidationError for reserved field in intersection', () => {
        const baseSchema = z.object({
          id: z.string(),
        })
        const extendedSchema = z.object({
          [RESERVED_FIELD]: z.number(),
        })
        const schema = z.intersection(baseSchema, extendedSchema)

        expect(() => validateSchema(schema)).toThrow(ValidationError)
      })

      it('should throw ValidationError for reserved field in record value', () => {
        const schema = z.record(
          z.object({
            [RESERVED_FIELD]: z.string(),
          })
        )

        expect(() => validateSchema(schema)).toThrow(ValidationError)
      })

      it('should throw ValidationError for reserved field in tuple item', () => {
        const schema = z.tuple([
          z.string(),
          z.object({
            [RESERVED_FIELD]: z.number(),
          }),
        ])

        expect(() => validateSchema(schema)).toThrow(ValidationError)
      })

      it('should throw ValidationError for reserved field in transformed schema', () => {
        const schema = z
          .object({
            [RESERVED_FIELD]: z.string(),
          })
          .transform((data) => data)

        expect(() => validateSchema(schema)).toThrow(ValidationError)
      })

      it('should throw ValidationError for reserved field in refined schema', () => {
        const schema = z
          .object({
            [RESERVED_FIELD]: z.string(),
          })
          .refine((_data) => true)

        expect(() => validateSchema(schema)).toThrow(ValidationError)
      })

      it('should throw ValidationError for reserved field with default value', () => {
        const schema = z.object({
          name: z.string(),
          [RESERVED_FIELD]: z.number().default(1),
        })

        expect(() => validateSchema(schema)).toThrow(ValidationError)
      })
    })

    describe('edge cases', () => {
      it('should handle lazy schemas', () => {
        type Category = {
          name: string
          subcategories: Category[]
        }

        const categorySchema: z.ZodType<Category> = z.lazy(() =>
          z.object({
            name: z.string(),
            subcategories: z.array(categorySchema),
          })
        )

        expect(() => validateSchema(categorySchema)).not.toThrow()
      })

      it('should throw for lazy schemas with reserved field', () => {
        const schemaWithReserved: z.ZodType<any> = z.lazy(() =>
          z.object({
            name: z.string(),
            [RESERVED_FIELD]: z.number(),
          })
        )

        expect(() => validateSchema(schemaWithReserved)).toThrow(ValidationError)
      })

      it('should handle pipeline schemas', () => {
        const schema = z
          .string()
          .pipe(z.string().transform((_val) => _val.toUpperCase()))

        expect(() => validateSchema(schema)).not.toThrow()
      })

      it('should handle map schemas', () => {
        const schema = z.map(z.string(), z.number())

        expect(() => validateSchema(schema)).not.toThrow()
      })

      it('should throw for map schemas with reserved field in value', () => {
        const schema = z.map(
          z.string(),
          z.object({
            [RESERVED_FIELD]: z.number(),
          })
        )

        expect(() => validateSchema(schema)).toThrow(ValidationError)
      })

      it('should handle preprocess', () => {
        const schema = z.preprocess(
          (val) => val,
          z.object({
            name: z.string(),
          })
        )

        expect(() => validateSchema(schema)).not.toThrow()
      })

      it('should throw for preprocess with reserved field', () => {
        const schema = z.preprocess(
          (_val) => _val,
          z.object({
            [RESERVED_FIELD]: z.string(),
          })
        )

        expect(() => validateSchema(schema)).toThrow(ValidationError)
      })

      it('should handle fields with similar names', () => {
        const schema = z.object({
          encodedStateVersion: z.number(), // Similar but not reserved
          _encodedState: z.string(), // Similar but not reserved
          version: z.number(), // Similar but not reserved
        })

        expect(() => validateSchema(schema)).not.toThrow()
      })
    })
  })
})
