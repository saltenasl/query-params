import protobuf from 'protobufjs';
import { z } from 'zod';
import { zodToProtobuf } from './converter.js';

/**
 * Cache for storing generated protobuf types by Zod schema
 * Uses WeakMap so that schemas can be garbage collected when no longer referenced
 */
const protobufCache = new WeakMap<z.ZodType, protobuf.Type>();

/**
 * Gets a cached protobuf type or creates a new one if not cached
 * @param schema - The Zod schema to convert
 * @param messageName - Optional name for the generated message type
 * @returns The cached or newly created protobuf.Type
 */
export function getOrCreateProtobuf(
  schema: z.ZodType,
  messageName = 'EncodedState'
): protobuf.Type {
  // Check if we have a cached version
  const cached = protobufCache.get(schema);
  if (cached) {
    return cached;
  }

  // Generate new protobuf type
  const pbType = zodToProtobuf(schema, messageName);

  // Cache it
  protobufCache.set(schema, pbType);

  return pbType;
}

/**
 * Clears a specific schema from the cache
 * @param schema - The schema to remove from the cache
 */
export function clearCacheForSchema(schema: z.ZodType): void {
  protobufCache.delete(schema);
}

/**
 * Checks if a schema is cached
 * @param schema - The schema to check
 * @returns true if the schema is in the cache
 */
export function isCached(schema: z.ZodType): boolean {
  return protobufCache.has(schema);
}
