import protobuf from 'protobufjs';
import { z } from 'zod';
import { RESERVED_FIELD } from '../validation.js';

/**
 * Converts a Zod schema to a Protocol Buffer Type
 * @param schema - The Zod schema to convert
 * @param messageName - Optional name for the generated message type
 * @returns A protobuf.Type that can be used to encode/decode messages
 */
export function zodToProtobuf(
  schema: z.ZodType,
  messageName = 'EncodedState'
): protobuf.Type {
  // Create a new protobuf Root
  const root = new protobuf.Root();

  // Create the main message type
  const messageType = new protobuf.Type(messageName);

  // Add reserved version field (field number 1)
  // This field is added by the encoder for version tracking
  const versionField = new protobuf.Field(
    RESERVED_FIELD,
    1,
    'uint32',
    'optional'
  );
  messageType.add(versionField);

  // Convert the Zod schema to protobuf fields starting at field number 2
  let fieldNumber = 2;

  // Unwrap the schema if it's wrapped in effects
  let unwrappedSchema = schema;
  while (unwrappedSchema instanceof z.ZodEffects) {
    unwrappedSchema = unwrappedSchema._def.schema;
  }

  // Handle object schemas
  if (unwrappedSchema instanceof z.ZodObject) {
    const shape = unwrappedSchema.shape;

    for (const [key, fieldSchema] of Object.entries(shape)) {
      const field = convertZodTypeToProtobufField(
        key,
        fieldNumber++,
        fieldSchema as z.ZodType,
        root
      );
      messageType.add(field);
    }
  } else {
    throw new Error('Root schema must be a ZodObject');
  }

  // Add the message type to the root
  root.add(messageType);

  // Resolve all types to link enum references
  root.resolveAll();

  return messageType;
}

/**
 * Converts a single Zod type to a protobuf field
 */
function convertZodTypeToProtobufField(
  name: string,
  fieldNumber: number,
  schema: z.ZodType,
  root: protobuf.Root
): protobuf.Field | protobuf.MapField {
  // Unwrap effects
  let unwrappedSchema = schema;
  while (unwrappedSchema instanceof z.ZodEffects) {
    unwrappedSchema = unwrappedSchema._def.schema;
  }

  // Handle optional fields
  let isOptional = false;
  if (unwrappedSchema instanceof z.ZodOptional) {
    isOptional = true;
    unwrappedSchema = unwrappedSchema._def.innerType;
  }

  // Handle nullable fields (treat as optional)
  if (unwrappedSchema instanceof z.ZodNullable) {
    isOptional = true;
    unwrappedSchema = unwrappedSchema._def.innerType;
  }

  // Get the protobuf type
  const pbType = zodTypeToProtobufType(unwrappedSchema, name, root);

  // Handle map fields (z.record())
  if (unwrappedSchema instanceof z.ZodRecord) {
    const keyType = unwrappedSchema._def.keyType;
    const valueType = unwrappedSchema._def.valueType;

    // Validate key type is string
    if (!(keyType instanceof z.ZodString)) {
      throw new Error('Map keys must be strings');
    }

    const valuePbType = zodTypeToProtobufType(valueType, `${name}Value`, root);

    return new protobuf.MapField(name, fieldNumber, 'string', valuePbType);
  }

  // Handle repeated fields (arrays)
  let isRepeated = false;
  if (unwrappedSchema instanceof z.ZodArray) {
    isRepeated = true;
  }

  // Create the field with the proper rule
  let rule: 'optional' | 'repeated' | undefined = undefined;
  if (isRepeated) {
    rule = 'repeated';
  } else if (isOptional) {
    rule = 'optional';
  }

  const field = new protobuf.Field(name, fieldNumber, pbType, rule);

  return field;
}

/**
 * Maps Zod types to protobuf type strings
 */
function zodTypeToProtobufType(
  schema: z.ZodType,
  fieldName: string,
  root: protobuf.Root
): string {
  // Unwrap effects
  let unwrappedSchema = schema;
  while (unwrappedSchema instanceof z.ZodEffects) {
    unwrappedSchema = unwrappedSchema._def.schema;
  }

  // Handle optional and nullable
  if (unwrappedSchema instanceof z.ZodOptional || unwrappedSchema instanceof z.ZodNullable) {
    return zodTypeToProtobufType(
      unwrappedSchema._def.innerType || unwrappedSchema._def.innerType,
      fieldName,
      root
    );
  }

  // String
  if (unwrappedSchema instanceof z.ZodString) {
    return 'string';
  }

  // Number
  if (unwrappedSchema instanceof z.ZodNumber) {
    // Check for integer constraints
    const checks = (unwrappedSchema._def as { checks?: Array<{ kind: string }> }).checks || [];
    const hasIntCheck = checks.some((check) => check.kind === 'int');

    if (hasIntCheck) {
      // Use int32 for integers
      return 'int32';
    }

    // Use double for floating point numbers
    return 'double';
  }

  // Boolean
  if (unwrappedSchema instanceof z.ZodBoolean) {
    return 'bool';
  }

  // Array
  if (unwrappedSchema instanceof z.ZodArray) {
    const elementType = unwrappedSchema._def.type;
    return zodTypeToProtobufType(elementType, fieldName, root);
  }

  // Object (nested message)
  if (unwrappedSchema instanceof z.ZodObject) {
    const nestedMessageName = `${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}Message`;
    const nestedMessage = new protobuf.Type(nestedMessageName);

    const shape = unwrappedSchema.shape;
    let nestedFieldNumber = 1;

    for (const [key, fieldSchema] of Object.entries(shape)) {
      const field = convertZodTypeToProtobufField(
        key,
        nestedFieldNumber++,
        fieldSchema as z.ZodType,
        root
      );
      nestedMessage.add(field);
    }

    // Add nested message directly to root
    root.add(nestedMessage);
    return nestedMessageName;
  }

  // Enum
  if (unwrappedSchema instanceof z.ZodEnum) {
    const enumName = `${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}Enum`;
    const enumType = new protobuf.Enum(enumName);

    const values = unwrappedSchema._def.values as string[];
    values.forEach((value, index) => {
      enumType.add(value, index);
    });

    // Add enum directly to root
    root.add(enumType);
    return enumName;
  }

  // Record (map)
  if (unwrappedSchema instanceof z.ZodRecord) {
    const valueType = unwrappedSchema._def.valueType;
    return zodTypeToProtobufType(valueType, fieldName, root);
  }

  // BigInt
  if (unwrappedSchema instanceof z.ZodBigInt) {
    return 'int64';
  }

  // Default
  if (unwrappedSchema instanceof z.ZodDefault) {
    return zodTypeToProtobufType(unwrappedSchema._def.innerType, fieldName, root);
  }

  // Union - convert to optional fields (simple approach)
  if (unwrappedSchema instanceof z.ZodUnion) {
    // For simplicity, use the first type in the union
    // A more sophisticated implementation could use oneof
    const options = unwrappedSchema._def.options;
    if (options.length > 0) {
      return zodTypeToProtobufType(options[0], fieldName, root);
    }
  }

  // Literal
  if (unwrappedSchema instanceof z.ZodLiteral) {
    const value = unwrappedSchema._def.value;
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'double';
    if (typeof value === 'boolean') return 'bool';
  }

  throw new Error(`Unsupported Zod type: ${unwrappedSchema.constructor.name}`);
}
