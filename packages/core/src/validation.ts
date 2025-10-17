import { z } from 'zod'
import { ValidationError } from './errors'

/**
 * Reserved field name used internally for versioning
 */
export const RESERVED_FIELD = '_encodedStateVersion'

/**
 * Type guard to check if a value is a ZodObject
 */
export function isZodObject(schema: unknown): schema is z.ZodObject<z.ZodRawShape> {
  return schema instanceof z.ZodObject
}

/**
 * Extracts the shape from a ZodObject schema
 */
export function getSchemaShape<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
): T {
  return schema.shape
}

/**
 * Checks if a schema contains the reserved field name
 * Recursively checks nested objects with cycle detection
 */
function hasReservedField(
  schema: z.ZodType,
  visited: WeakSet<z.ZodType> = new WeakSet()
): boolean {
  // Prevent infinite recursion by tracking visited schemas
  if (visited.has(schema)) {
    return false
  }
  visited.add(schema)

  // Handle ZodObject
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape

    // Check if reserved field exists at this level
    if (RESERVED_FIELD in shape) {
      return true
    }

    // Recursively check nested objects
    for (const key in shape) {
      const field = shape[key]
      if (hasReservedField(field, visited)) {
        return true
      }
    }
  }

  // Handle ZodArray
  if (schema instanceof z.ZodArray) {
    return hasReservedField(schema.element, visited)
  }

  // Handle ZodOptional
  if (schema instanceof z.ZodOptional) {
    return hasReservedField(schema.unwrap(), visited)
  }

  // Handle ZodNullable
  if (schema instanceof z.ZodNullable) {
    return hasReservedField(schema.unwrap(), visited)
  }

  // Handle ZodDefault
  if (schema instanceof z.ZodDefault) {
    return hasReservedField(schema.removeDefault(), visited)
  }

  // Handle ZodUnion
  if (schema instanceof z.ZodUnion) {
    return schema.options.some((option: z.ZodType) =>
      hasReservedField(option, visited)
    )
  }

  // Handle ZodDiscriminatedUnion
  if (schema instanceof z.ZodDiscriminatedUnion) {
    return Array.from(schema.options.values()).some((option) =>
      hasReservedField(option as z.ZodType, visited)
    )
  }

  // Handle ZodIntersection
  if (schema instanceof z.ZodIntersection) {
    return (
      hasReservedField(schema._def.left, visited) ||
      hasReservedField(schema._def.right, visited)
    )
  }

  // Handle ZodRecord
  if (schema instanceof z.ZodRecord) {
    // Check the value type of the record
    return hasReservedField(schema.valueSchema, visited)
  }

  // Handle ZodMap
  if (schema instanceof z.ZodMap) {
    // Check both key and value schemas
    return (
      hasReservedField(schema._def.keyType, visited) ||
      hasReservedField(schema._def.valueType, visited)
    )
  }

  // Handle ZodTuple
  if (schema instanceof z.ZodTuple) {
    return schema.items.some((item: z.ZodType) =>
      hasReservedField(item, visited)
    )
  }

  // Handle ZodEffects (refinements, transforms, preprocess)
  if (schema instanceof z.ZodEffects) {
    return hasReservedField(schema.innerType(), visited)
  }

  // Handle ZodPipeline
  if (schema instanceof z.ZodPipeline) {
    return (
      hasReservedField(schema._def.in, visited) ||
      hasReservedField(schema._def.out, visited)
    )
  }

  // Handle ZodLazy
  if (schema instanceof z.ZodLazy) {
    return hasReservedField(schema._def.getter(), visited)
  }

  return false
}

/**
 * Validates that a Zod schema does not use the reserved field name
 * Throws ValidationError if the reserved field is found
 *
 * @param schema - The Zod schema to validate
 * @throws {ValidationError} If the schema contains the reserved field name
 *
 * @example
 * ```typescript
 * import { z } from 'zod'
 * import { validateSchema } from './validation'
 *
 * // Valid schema - no reserved field
 * const validSchema = z.object({
 *   name: z.string(),
 *   age: z.number()
 * })
 * validateSchema(validSchema) // OK
 *
 * // Invalid schema - contains reserved field
 * const invalidSchema = z.object({
 *   name: z.string(),
 *   _encodedStateVersion: z.number()
 * })
 * validateSchema(invalidSchema) // Throws ValidationError
 * ```
 */
export function validateSchema(schema: z.ZodType): void {
  if (hasReservedField(schema)) {
    throw new ValidationError(
      `Field name "${RESERVED_FIELD}" is reserved and cannot be used in schemas`
    )
  }
}
