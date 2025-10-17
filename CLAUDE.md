# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**encoded-state** (internal name, external TBD) is a TypeScript library for type-safe, versioned query parameters with compression and encryption. Zero build step required for users - they define schemas with Zod at runtime.

**Key principle**: The library must be **polymorphic** - work seamlessly in ESM/CommonJS, browser/Node.js, and as drop-in URLSearchParams replacement.

## Monorepo Structure

```
packages/
├── core/                # Main package (@encoded-state/core)
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── crypto/              # Encryption (@encoded-state/crypto)
├── migrations/          # Versioning system (@encoded-state/migrations)
├── router/              # Route state encoding (@encoded-state/router)
├── react/               # React hooks (@encoded-state/react)
├── nextjs/              # Next.js integration (@encoded-state/nextjs)
├── remix/               # Remix integration (@encoded-state/remix)
└── sveltekit/           # SvelteKit integration (@encoded-state/sveltekit)
```

**Package scope**: `@encoded-state/*` (internal name, may change before public release)

## Commands

### Development
```bash
# Install dependencies
pnpm install

# Run tests across all packages
pnpm test

# Run tests for specific package
pnpm test core
pnpm test crypto

# Watch mode (tests, lint, type-check)
pnpm dev

# Build all packages
pnpm build

# Build specific package
pnpm build --filter @encoded-state/core

# Lint
pnpm lint

# Type check
pnpm type-check
```

### Testing
- **Framework**: Vitest
- **Location**: `packages/*/tests/`
- **Run single test**: `pnpm test core -- my-test.test.ts`
- **Watch mode**: `pnpm test --watch`

## Architecture

### Core Technical Stack

**Runtime Dependencies**:
- `zod` - Schema definition and validation (peer dependency)
- `protobufjs` - Protocol Buffer serialization (dynamic message creation)
- `pako` - Compression for browser (zlib wrapper)
- Node.js `zlib` - Compression for Node.js

**Build**:
- TypeScript 5.0+ with strict mode
- Must output both ESM and CommonJS
- Must work in browser and Node.js without changes

### Polymorphic Requirements

The library MUST be polymorphic in multiple dimensions:

**1. Module Systems**
- ESM: `import { createQueryParams } from '@encoded-state/core'`
- CommonJS: `const { createQueryParams } = require('@encoded-state/core')`

**2. Runtime Environments**
- Browser (modern browsers, last 2 versions)
- Node.js 18+
- Edge runtimes (Cloudflare Workers, Vercel Edge, Deno)

**3. String Coercion**
```typescript
const params = createQueryParams(schema);
params.toString()           // ✅ Must work
String(params)              // ✅ Must work
`/search?${params}`         // ✅ Must work in template literals
'' + params                 // ✅ Must work with concatenation
```

Implement `toString()` and `[Symbol.toPrimitive]` for full polymorphism.

**4. URLSearchParams Drop-in Replacement**
Must implement ALL URLSearchParams methods:
- `get(key)`, `set(key, value)`, `has(key)`, `delete(key)`
- `append(key, value)`, `getAll(key)`
- `entries()`, `keys()`, `values()`, `forEach(callback)`
- `toString()`, `sort()`

### Zod to Protobuf Conversion

**Challenge**: Convert Zod schemas to protobuf schemas at runtime.

**Approach**:
1. Use `protobufjs` with dynamic message creation
2. Walk Zod schema using internal Zod APIs (or schema introspection)
3. Map Zod types to protobuf types:
   - `z.string()` → `string`
   - `z.number()` → `double` (or `int32` for integers)
   - `z.boolean()` → `bool`
   - `z.array(T)` → `repeated T`
   - `z.object({})` → nested message
   - `z.optional()` → `optional` field
   - `z.union()` → `oneof` or multiple optional fields
   - `z.enum()` → `enum` or `string` with validation
   - `z.record()` → `map<string, T>`

**Implementation considerations**:
- Cache protobuf message types per schema (don't regenerate)
- Handle nested objects recursively
- Support Zod refinements/transforms at validation layer (not in protobuf)

### Compression Strategy

**Default**: Automatic compression (always on)

**Flow**:
1. Validate with Zod
2. Convert to protobuf message
3. Serialize to binary (protobuf)
4. Compress with zlib/pako
5. Encode as base64url (URL-safe, no padding)

**Platform-specific**:
- **Browser**: Use `pako` (smaller bundle, pure JS)
- **Node.js**: Use native `zlib` (faster, native bindings)
- Auto-detect environment and use appropriate implementation

**Optimization**: For very small payloads (<50 bytes?), compression may increase size. Add tests to determine threshold and potentially skip compression. Document behavior.

### Versioning System

**Version Storage**:
- Add internal field: `_encodedStateVersion` (number)
- This field name is reserved and cannot be used in user schemas
- Range: 0 to 1023 (2^10 = 1024 versions max)
- Store as part of the protobuf message (not header byte)

**Structure**:
```protobuf
message EncodedState {
  uint32 _encodedStateVersion = 1;
  // User fields start at field number 2
}
```

**Migration Behavior**:
- When parsing, detect version from `_encodedStateVersion`
- If version < current version: Run up migrations
- If version > current version: Run down migrations
- If no migration defined: Throw error with clear message
- TypeScript: Require all migration paths at compile time

**Example**:
```typescript
// v1 -> v2 (up): newer code reading old data
// v2 -> v1 (down): older code reading new data
migrations: {
  'v1->v2': {
    up: (v1) => ({ ...v1, newField: 'default' }),
    down: (v2) => ({ oldField: v2.newField })
  }
}
```

### Encryption (Secure Mode)

**Algorithm**: AES-256-GCM (authenticated encryption)
- Provides both confidentiality and integrity
- Prevents tampering and replay attacks

**Key Management**:
- Accept encryption key via:
  1. Function parameter: `{ encryptionKey: string }`
  2. Environment variable: `process.env.ENCODED_STATE_KEY` (fallback)
- **No key rotation support** (future feature)

**Flow (Secure Mode)**:
1. Encode as normal (Zod → protobuf → compress → base64url)
2. Encrypt the entire encoded string with AES-GCM
3. Return opaque token (IV + ciphertext + auth tag)

**Important**: Encrypted tokens are NOT decodeable in browser without key.

### Error Handling

**Philosophy**: Throw errors by default, with safe parse option.

**API Design**:
```typescript
// Default: throws on error
const data = params.parse(encoded);

// Safe parse: returns { success, data, error }
const result = params.safeParse(encoded);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

**Error Types**:
1. **ValidationError**: Zod validation failure
2. **VersionMismatchError**: No migration defined for version
3. **DecryptionError**: Failed to decrypt (wrong key or corrupted)
4. **DecodingError**: Invalid base64url or corrupted data
5. **CompressionError**: Decompression failed

**TypeScript Safety**:
- If migrations not defined for all version pairs, should be TS error
- Use template literal types to enforce migration keys: `'v1->v2'`

## Build Configuration

### TypeScript

**tsconfig.json** (base):
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true
  }
}
```

**Dual Package** (ESM + CJS):
- Use `tsup` or `unbuild` for dual builds
- Ensure `package.json` has correct exports:
```json
{
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts"
}
```

### Vitest Configuration

**vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // or 'jsdom' for browser tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.test.ts']
    }
  }
});
```

**Test locations**: Co-located with source files (e.g., `src/encoder.test.ts` next to `src/encoder.ts`)

## Development Workflow

### Adding a New Package

1. Create directory: `packages/my-package/`
2. Add `package.json` with scope: `@encoded-state/my-package`
3. Add `tsconfig.json` extending base config
4. Add `src/index.ts` with exports
5. Add test files co-located with source: `src/my-feature.test.ts`
6. Update root `pnpm-workspace.yaml` if needed
7. Run `pnpm install` to link workspace packages

### Running Tests

**All packages**:
```bash
pnpm test
```

**Single package**:
```bash
pnpm test core
```

**Watch mode** (recommended during development):
```bash
pnpm dev
# This should run tests, lint, and type-check in watch mode
```

**Specific test file**:
```bash
pnpm test core -- encoding.test.ts
```

### Code Style

- **Prettier**: Format code automatically
- **ESLint**: Enforce code quality rules
- **No semicolons** (if using Prettier standard config)
- **2 spaces** for indentation
- **Single quotes** for strings

### Testing Strategy

**Test Coverage Goals**: >90% for core packages

**Test Location**: Co-located with source files
```
packages/core/src/
├── encoder.ts
├── encoder.test.ts          ← Test next to implementation
├── decoder.ts
├── decoder.test.ts          ← Test next to implementation
└── compression/
    ├── compress.ts
    └── compress.test.ts     ← Test next to implementation
```

**Test Types**:
1. **Unit tests**: Individual functions and classes
2. **Integration tests**: Full encode/decode flows
3. **Compatibility tests**: ESM/CJS, Browser/Node
4. **Performance tests**: Benchmark compression ratios
5. **Security tests**: Encryption/decryption correctness

**Test UI**: Run `pnpm test:ui` for interactive web-based test viewer (helpful for debugging)

**Important test scenarios**:
- String coercion (toString, template literals, String())
- URLSearchParams method compatibility (ALL methods)
- Version migrations (up/down, missing migrations)
- Compression with various payload sizes
- Encryption/decryption round-trips
- Browser vs Node.js environment detection
- Malformed/corrupted input handling

## Important Implementation Details

### Reserved Field Name

`_encodedStateVersion` is reserved and MUST NOT be allowed in user schemas.

**Validation**: Check Zod schema at encoder creation time:
```typescript
if (schema has field '_encodedStateVersion') {
  throw new Error('Field name "_encodedStateVersion" is reserved');
}
```

### Maximum Versions

Document in README: Maximum 1024 versions (2^10) supported.

### Safe Parse Configuration

The `safeParse` option should be available at encoder creation:
```typescript
const params = createQueryParams(schema, {
  safeParse: true // Returns Result instead of throwing
});
```

Or per-call:
```typescript
const result = params.parse(encoded, { safe: true });
```

Choose one approach and be consistent across all packages.

### Performance Considerations

- **Cache protobuf schemas**: Don't regenerate for same Zod schema
- **Compression threshold**: Test and document when compression is beneficial
- **Bundle size**: Core package should be <10KB gzipped
- **Encoding speed**: Target <1ms for typical payloads (<1KB)

### Platform Detection

Detect environment for compression:
```typescript
const isNode = typeof process !== 'undefined' &&
               process.versions?.node;

const isBrowser = typeof window !== 'undefined';

// Use native zlib in Node, pako in browser
```

## Troubleshooting

### Tests Failing
- Check if all packages are built: `pnpm build`
- Check if dependencies are installed: `pnpm install`
- Check if running correct Node version: `node --version` (18+)

### Type Errors
- Ensure TypeScript 5.0+: `tsc --version`
- Rebuild type definitions: `pnpm build`
- Check workspace links: `pnpm install`

### Import Errors (ESM/CJS)
- Check `package.json` exports field
- Ensure dual build outputs exist in `dist/`
- Test both: `node test.mjs` and `node test.cjs`

## Additional Notes

- This is an **internal project name** (`encoded-state`). External package name TBD.
- Library is MIT licensed and open source
- Focus on **developer experience**: zero config, plug-and-play
- **Type safety** is critical: leverage TypeScript and Zod fully
- **Performance** is key: compression and encoding should be fast
- Document all edge cases and limitations in README

## Future Considerations (Not Now)

- Key rotation for encryption
- Custom compression algorithms
- Streaming encode/decode for large payloads
- Browser extension APIs
- React Native support
- Encryption in browser with Web Crypto API (client-side)
