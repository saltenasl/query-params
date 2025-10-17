# Optimization Guide

Get the most out of @encoded-state by following these best practices.

## Size Optimization Tips

### 1. Use `.int()` for Integer Numbers

Protobuf encodes integers much more efficiently than floating-point numbers:

```typescript
// ❌ Bad: Uses 8 bytes for the number
const schema = z.object({
  page: z.number(),
  count: z.number()
});

// ✅ Good: Uses 1-5 bytes (varint encoding)
const schema = z.object({
  page: z.number().int(),
  count: z.number().int()
});

// Savings: ~6 bytes per number field = ~10-15% for typical payloads
```

### 2. Use Enums Instead of Strings

Enums are encoded as integers (1 byte) instead of full strings:

```typescript
// ❌ Bad: 'ascending' = 9 bytes
const schema = z.object({
  sortOrder: z.string()
});

// ✅ Good: enum value = 1 byte
const schema = z.object({
  sortOrder: z.enum(['asc', 'desc'])
});

// Savings: ~8 bytes per enum field
```

### 3. Keep Field Names Short (in data, not schema)

Protobuf doesn't encode field names, but you still want concise property names:

```typescript
// ❌ OK but verbose for your code
const schema = z.object({
  searchQuery: z.string(),
  filterCategories: z.array(z.string()),
  paginationPageNumber: z.number().int()
});

// ✅ Better: Short but clear
const schema = z.object({
  q: z.string(),
  cats: z.array(z.string()),
  page: z.number().int()
});

// Note: This doesn't affect encoded size, but makes your URLs cleaner
```

### 4. Avoid Deeply Nested Objects

Flat structures compress better:

```typescript
// ❌ Less efficient
const schema = z.object({
  user: z.object({
    profile: z.object({
      settings: z.object({
        theme: z.string()
      })
    })
  })
});

// ✅ More efficient
const schema = z.object({
  userId: z.number().int(),
  theme: z.string()
});
```

### 5. Use Booleans, Not Strings

```typescript
// ❌ Bad: "true" = 4 bytes
const schema = z.object({
  active: z.string()
});

// ✅ Good: true = 1 byte
const schema = z.object({
  active: z.boolean()
});
```

### 6. Array of Objects with Repeated Data

If you have arrays with repeated structure, consider factoring out common data:

```typescript
// ❌ Repetitive
const filters = [
  { type: 'category', value: 'electronics' },
  { type: 'category', value: 'computers' },
  { type: 'price', value: '500' }
];

// ✅ Factored (if applicable)
const filters = {
  categories: ['electronics', 'computers'],
  minPrice: 500
};
```

## Compression Stats

Different data structures compress differently:

| Data Type | Typical Compression |
|-----------|-------------------|
| **Repeated strings** | 60-80% |
| **Arrays of objects** | 40-60% |
| **Nested objects** | 30-50% |
| **Mixed primitive types** | 20-40% |
| **Small payloads (<50 bytes)** | May be larger than JSON |

## When to Use @encoded-state

### ✅ Great For:
- Complex filter states (arrays, nested objects)
- Multi-step form data
- Dashboard/analytics configurations
- Game save states
- Shopping cart contents (excluding sensitive data)
- Map/visualization state

### ❌ Not Ideal For:
- Simple key-value pairs (`?q=search&page=1`)
- Single string values
- Already-compressed data (images, etc.)
- Data that changes on every request

## Version Field Optimization

The library automatically omits the version field for v1 encodings to save ~2-3 bytes:

```typescript
// v1: No version field in encoding (saves space)
encode(data, schema, 1) // or just encode(data, schema)

// v2+: Version field included
encode(data, schema, 2)
```

## Measuring Your Savings

```typescript
import { encode } from '@encoded-state/core';

const data = { /* your data */ };
const schema = z.object({ /* your schema */ });

const encoded = encode(data, schema);
const json = JSON.stringify(data);
const urlParams = new URLSearchParams(/* flattened data */).toString();

console.log('JSON:', json.length);
console.log('URLSearchParams:', urlParams.length);
console.log('Encoded:', encoded.length);
console.log('Savings:', Math.round((1 - encoded.length / json.length) * 100) + '%');
```

## Real-World Results

From our test suite:

```
E-commerce filters: 163 → 116 chars (-29%)
Data table state: 345 → 128 chars (-63%)
Map/dashboard view: 235 → 167 chars (-29%)
Game state snapshot: 277 → 152 chars (-45%)
Large repetitive data: 1109 → 303 chars (-73%)
```

## Advanced: Custom Compression

For very large payloads, you can compress before encoding:

```typescript
// The library already does this automatically!
// Compression is applied adaptively when beneficial.
```

## Troubleshooting Large Sizes

If your encoded string is unexpectedly large:

1. **Check for doubles**: Use `.int()` for integers
2. **Use enums**: Replace string unions with z.enum()
3. **Verify types**: Make sure numbers aren't stored as strings
4. **Remove optional fields**: Don't include undefined values
5. **Check compression**: Small payloads (<50 bytes) may not compress well

## Migration-Safe Optimizations

These optimizations won't break existing encoded URLs:

✅ Adding `.int()` to new schemas (forward compatible)
✅ Using enums in new fields
✅ Removing optional fields from data
✅ Updating to use version 1 (default, no version field)

❌ Don't change field order in existing schemas
❌ Don't change field types in existing schemas (use migrations)
