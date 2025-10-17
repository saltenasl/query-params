import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import protobuf from 'protobufjs';
import { zodToProtobuf } from './converter.js';
import {
  getOrCreateProtobuf,
  clearCacheForSchema,
  isCached,
} from './cache.js';

describe('Protobuf Converter', () => {
  describe('zodToProtobuf', () => {
    it('should convert schema without version field (version is now in header)', () => {
      const schema = z.object({
        name: z.string(),
      });

      const pbType = zodToProtobuf(schema);

      // Version field is now in protobuf schema
      expect(pbType.fields._encodedStateVersion).toBeDefined();
      expect(pbType.fields.name).toBeDefined();
    });

    it('should convert simple object schema', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
        active: z.boolean(),
      });

      const pbType = zodToProtobuf(schema);

      expect(pbType.fields.name).toBeDefined();
      expect(pbType.fields.name!.type).toBe('string');
      expect(pbType.fields.age).toBeDefined();
      expect(pbType.fields.age!.type).toBe('double');
      expect(pbType.fields.active).toBeDefined();
      expect(pbType.fields.active!.type).toBe('bool');
    });

    it('should convert z.string() to protobuf string', () => {
      const schema = z.object({
        text: z.string(),
      });

      const pbType = zodToProtobuf(schema);

      expect(pbType.fields.text!.type).toBe('string');
    });

    it('should convert z.number() to protobuf double', () => {
      const schema = z.object({
        value: z.number(),
      });

      const pbType = zodToProtobuf(schema);

      expect(pbType.fields.value!.type).toBe('double');
    });

    it('should convert z.number().int() to protobuf int32', () => {
      const schema = z.object({
        count: z.number().int(),
      });

      const pbType = zodToProtobuf(schema);

      expect(pbType.fields.count!.type).toBe('int32');
    });

    it('should convert z.boolean() to protobuf bool', () => {
      const schema = z.object({
        flag: z.boolean(),
      });

      const pbType = zodToProtobuf(schema);

      expect(pbType.fields.flag!.type).toBe('bool');
    });

    it('should convert z.array() to repeated field', () => {
      const schema = z.object({
        items: z.array(z.string()),
      });

      const pbType = zodToProtobuf(schema);

      expect(pbType.fields.items!.repeated).toBe(true);
      expect(pbType.fields.items!.type).toBe('string');
    });

    it('should convert z.optional() to optional field', () => {
      const schema = z.object({
        optional: z.string().optional(),
      });

      const pbType = zodToProtobuf(schema);

      expect(pbType.fields.optional!.optional).toBe(true);
    });

    it('should convert nested objects to nested messages', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          age: z.number(),
        }),
      });

      const pbType = zodToProtobuf(schema);

      expect(pbType.fields.user!.type).toBe('UserMessage');

      // Check if the nested message was created
      const root = pbType.parent as protobuf.Namespace;
      const userMessage = root.lookupType('UserMessage');
      expect(userMessage).toBeDefined();
      expect(userMessage.fields.name).toBeDefined();
      expect(userMessage.fields.age).toBeDefined();
    });

    it('should convert z.record() to map field', () => {
      const schema = z.object({
        metadata: z.record(z.string()),
      });

      const pbType = zodToProtobuf(schema);

      expect(pbType.fields.metadata).toBeInstanceOf(protobuf.MapField);
      expect((pbType.fields.metadata as unknown as protobuf.MapField).keyType).toBe('string');
    });

    it('should convert z.enum() to protobuf enum', () => {
      const schema = z.object({
        status: z.enum(['pending', 'active', 'completed']),
      });

      const pbType = zodToProtobuf(schema);

      expect(pbType.fields.status!.type).toBe('StatusEnum');

      // Check if the enum was created
      const root = pbType.parent as protobuf.Namespace;
      const statusEnum = root.lookupEnum('StatusEnum');
      expect(statusEnum).toBeDefined();
      expect(statusEnum.values['pending']).toBe(0);
      expect(statusEnum.values['active']).toBe(1);
      expect(statusEnum.values['completed']).toBe(2);
    });

    it('should handle complex nested structures', () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string(),
            bio: z.string().optional(),
          }),
          tags: z.array(z.string()),
        }),
        settings: z.record(z.boolean()),
      });

      const pbType = zodToProtobuf(schema);

      expect(pbType.fields.user).toBeDefined();
      expect(pbType.fields.settings).toBeInstanceOf(protobuf.MapField);
    });

    it('should handle z.bigint() as int64', () => {
      const schema = z.object({
        bigNumber: z.bigint(),
      });

      const pbType = zodToProtobuf(schema);

      expect(pbType.fields.bigNumber!.type).toBe('int64');
    });

    it('should handle z.default() by extracting inner type', () => {
      const schema = z.object({
        name: z.string().default('default'),
      });

      const pbType = zodToProtobuf(schema);

      expect(pbType.fields.name!.type).toBe('string');
    });

    it('should handle z.nullable() as optional field', () => {
      const schema = z.object({
        value: z.string().nullable(),
      });

      const pbType = zodToProtobuf(schema);

      expect(pbType.fields.value!.optional).toBe(true);
    });

    it('should encode and decode data correctly', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().int(),
        active: z.boolean(),
        tags: z.array(z.string()),
      });

      const pbType = zodToProtobuf(schema);

      const data = {
        name: 'John Doe',
        age: 30,
        active: true,
        tags: ['developer', 'designer'],
      };

      // Encode
      const message = pbType.fromObject(data);
      const buffer = pbType.encode(message).finish();

      // Decode
      const decoded = pbType.decode(buffer) as any;

      // Version field is now in protobuf schema (with default value 0 when not set)
      expect(decoded._encodedStateVersion).toBe(0);
      expect(decoded.name).toBe('John Doe');
      expect(decoded.age).toBe(30);
      expect(decoded.active).toBe(true);
      expect(decoded.tags).toEqual(['developer', 'designer']);
    });

    it('should throw error for non-object root schema', () => {
      const schema = z.string();

      expect(() => zodToProtobuf(schema)).toThrow('Root schema must be a ZodObject');
    });

    it('should handle array of objects', () => {
      const schema = z.object({
        users: z.array(
          z.object({
            name: z.string(),
            age: z.number(),
          })
        ),
      });

      const pbType = zodToProtobuf(schema);

      expect(pbType.fields.users!.repeated).toBe(true);
      expect(pbType.fields.users!.type).toBe('UsersMessage');
    });

    it('should handle optional arrays', () => {
      const schema = z.object({
        items: z.array(z.string()).optional(),
      });

      const pbType = zodToProtobuf(schema);

      expect(pbType.fields.items!.repeated).toBe(true);
      expect(pbType.fields.items!.type).toBe('string');
    });

    it('should handle literal types', () => {
      const schema = z.object({
        constant: z.literal('value'),
        numberConstant: z.literal(42),
        boolConstant: z.literal(true),
      });

      const pbType = zodToProtobuf(schema);

      expect(pbType.fields.constant!.type).toBe('string');
      expect(pbType.fields.numberConstant!.type).toBe('double');
      expect(pbType.fields.boolConstant!.type).toBe('bool');
    });
  });

  describe('Cache', () => {
    beforeEach(() => {
      // Note: We can't actually clear the WeakMap, but we can test with fresh schemas
    });

    it('should cache generated protobuf types', () => {
      const schema = z.object({
        name: z.string(),
      });

      const first = getOrCreateProtobuf(schema);
      const second = getOrCreateProtobuf(schema);

      // Should return the same instance
      expect(first).toBe(second);
    });

    it('should return true for cached schemas', () => {
      const schema = z.object({
        name: z.string(),
      });

      expect(isCached(schema)).toBe(false);
      getOrCreateProtobuf(schema);
      expect(isCached(schema)).toBe(true);
    });

    it('should clear cache for specific schema', () => {
      const schema = z.object({
        name: z.string(),
      });

      getOrCreateProtobuf(schema);
      expect(isCached(schema)).toBe(true);

      clearCacheForSchema(schema);
      expect(isCached(schema)).toBe(false);
    });

    it('should create different protobuf types for different schemas', () => {
      const schema1 = z.object({
        name: z.string(),
      });

      const schema2 = z.object({
        age: z.number(),
      });

      const pb1 = getOrCreateProtobuf(schema1);
      const pb2 = getOrCreateProtobuf(schema2);

      expect(pb1).not.toBe(pb2);
      expect(pb1.fields.name).toBeDefined();
      expect(pb2.fields.age).toBeDefined();
    });

    it('should regenerate protobuf type after cache clear', () => {
      const schema = z.object({
        name: z.string(),
      });

      const first = getOrCreateProtobuf(schema);
      clearCacheForSchema(schema);
      const second = getOrCreateProtobuf(schema);

      // Should be different instances after clearing cache
      expect(first).not.toBe(second);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty object schema', () => {
      const schema = z.object({});

      const pbType = zodToProtobuf(schema);

      // Empty schema still has version field
      expect(Object.keys(pbType.fields)).toEqual(['_encodedStateVersion']);
    });

    it('should handle deeply nested objects', () => {
      const schema = z.object({
        level1: z.object({
          level2: z.object({
            level3: z.object({
              value: z.string(),
            }),
          }),
        }),
      });

      const pbType = zodToProtobuf(schema);

      expect(pbType.fields.level1).toBeDefined();
    });

    it('should handle mixed optional and required fields', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional(),
        nullableOptional: z.string().nullable().optional(),
      });

      const pbType = zodToProtobuf(schema);

      // All fields in protobuf3 have optional set to true by default
      // The key difference is that optional fields in Zod are marked as optional
      expect(pbType.fields.required).toBeDefined();
      expect(pbType.fields.optional!.optional).toBe(true);
      expect(pbType.fields.nullableOptional!.optional).toBe(true);
    });

    it('should handle map with complex value types', () => {
      const schema = z.object({
        complexMap: z.record(
          z.object({
            name: z.string(),
            count: z.number(),
          })
        ),
      });

      const pbType = zodToProtobuf(schema);

      expect(pbType.fields.complexMap).toBeInstanceOf(protobuf.MapField);
    });

    it('should handle union types by using first option', () => {
      const schema = z.object({
        value: z.union([z.string(), z.number()]),
      });

      const pbType = zodToProtobuf(schema);

      // Should use the first type in the union
      expect(pbType.fields.value!.type).toBe('string');
    });

    it('should handle z.effects (refined schemas)', () => {
      const schema = z.object({
        email: z.string().email(),
        url: z.string().url(),
      });

      const pbType = zodToProtobuf(schema);

      // Effects should be unwrapped to underlying string type
      expect(pbType.fields.email!.type).toBe('string');
      expect(pbType.fields.url!.type).toBe('string');
    });
  });
});
