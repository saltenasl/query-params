# Requirements Specification: Secure Query Parameters & Route State Library

## Project Overview

A full-stack TypeScript library for securely encoding, decoding, and versioning query parameters and route state using Protocol Buffers and compression, with automatic migration generation from TypeScript types. Enables secure storage of any route information (paths, params, query strings) with URL shortening capabilities for sharing.

## Core Requirements

### 1. API Design

#### 1.1 URLSearchParams Compatibility
- **MUST** match URLSearchParams API surface where applicable
- Methods: `get()`, `set()`, `has()`, `delete()`, `append()`, `entries()`, `keys()`, `values()`, `forEach()`
- **MUST** be polymorphic and work with standard URL construction patterns
- **MUST** allow to serialize and deserialize anything not only URLSearchParams
- **RECOMMENDED** usage: `URI?${queryParams}` and serialize to URLSearchParams (default)

#### 1.2 Type Safety
- **MUST** be fully type-safe with TypeScript
- **MUST** infer types from schema definitions
- **MUST** provide compile-time type checking for all operations

### 2. Encoding & Security

#### 2.1 Encoding Strategy
- **MUST** use Protocol Buffers (protobuf) for serialization
- **MUST** use zlib compression after protobuf encoding
- **MUST** use base64url encoding for URL safety (no padding characters)
- **MUST** handle binary data efficiently

#### 2.2 Security Modes

**Client Mode (Public)**
- Encoded data readable by both client and server
- Suitable for non-sensitive query parameters
- Can be decoded client-side for navigation state

**Server Mode (Secure)**
- State encrypted and only readable on server
- **MUST** use authenticated encryption (e.g., AES-GCM)
- **MUST** prevent tampering and replay attacks
- **MUST** support server-side decryption keys
- Client receives opaque token only (NOT decodeable in frontend)
- **MUST** support encoding entire route information (path, params, query strings)
- Enables URL shortening: complex URLs can be reduced to short tokens for sharing
- Server-side only: decryption and decoding only possible on server

### 3. Versioning & Migrations

#### 3.1 Schema Versioning
- **MUST** support multiple schema versions simultaneously
- **MUST** embed version information in encoded data
- **MUST** automatically detect version from encoded parameters
- **MUST** support forward compatibility (newer code reading older data)
- **MUST** support backward compatibility (older code with graceful degradation)

#### 3.2 Migration System (Runtime)
- **MUST** define migrations at runtime alongside Zod schema definitions
- **MUST** support both up and down migration functions
- **MUST** apply up migrations when reading older versions
- **MUST** apply down migrations when reading newer versions (backward compatibility)
- **MUST** register multiple schema versions with migration functions
- **MUST** apply appropriate migration based on detected version
- **MUST** support custom migration logic for any schema change
- **SHOULD** provide helpers for common migration patterns (add field, rename, etc.)
- **SHOULD** validate migration correctness at runtime (up then down equals original)

#### 3.3 Schema Versioning Pattern
- **MUST** support defining multiple versions of same schema
- **MUST** allow migration functions between versions
- **SHOULD** provide utilities for common transformations:
  - Adding optional fields with default values
  - Removing fields (with data loss warnings)
  - Renaming fields
  - Type transformations
  - Nested object changes
- **SHOULD** warn at runtime if unknown version detected

### 4. Developer Experience (Maximum Priority)

#### 4.1 Setup & Configuration
- **MUST** be plug-and-play with minimal configuration
- **MUST** work with zero config for common cases
- **MUST** integrate with popular frameworks (Next.js, Remix, SvelteKit, etc.)
- **MUST** provide clear error messages with actionable fixes
- **MUST** include comprehensive TypeScript types with IntelliSense support

#### 4.2 Schema-First Development with Zod (Runtime Only)
- **MUST** use Zod for runtime schema definition (no build step required)
- **MUST** provide full TypeScript type inference via Zod
- **MUST** support schema versioning with runtime up/down migrations
- **MUST** leverage all Zod schema types:
  - Primitives (z.string(), z.number(), z.boolean())
  - Arrays (z.array()) and objects (z.object())
  - Optional fields (z.optional())
  - Union types (z.union())
  - Enums (z.enum()) and literal types (z.literal())
  - Nested structures
  - All other Zod features (refinements, transforms, etc.)
- **OPTIONAL**: Provide build-time codegen for teams that want it (separate package)

#### 4.3 Zero Build Configuration
- **MUST** work with zero build steps - pure runtime solution
- **MUST** be import-and-use ready
- **MUST** schemas defined inline with full type inference
- **SHOULD** optionally provide build plugins for advanced use cases
- **MUST** tree-shake unused functionality

### 5. Runtime Requirements

#### 5.1 Client-Side
- **MUST** work in all modern browsers
- **MUST** have minimal bundle size impact (<10KB gzipped baseline)
- **MUST** be tree-shakeable
- **SHOULD** support lazy loading of migrations
- **MUST** handle decoding errors gracefully

#### 5.2 Server-Side
- **MUST** work in Node.js environments
- **MUST** work in edge runtimes (Cloudflare Workers, Vercel Edge, etc.)
- **MUST** support server-only decryption keys
- **MUST** provide middleware helpers for popular frameworks
- **MUST** support encoding/decoding entire route state (path, params, query)
- **MUST** enable URL shortening by encoding full route information

#### 5.3 Performance
- **MUST** encode/decode within 1ms for typical payloads (<1KB)
- **MUST** handle payloads up to 10KB efficiently
- **SHOULD** warn when approaching URL length limits (~2000 chars)
- **MUST** be memory-efficient (no unnecessary copies)

### 6. API Examples

#### 6.1 Basic Usage (Client Mode) - No Build Step
```typescript
// Install: npm install @query-params/core zod
// No build configuration needed!

import { z } from 'zod';
import { createQueryParams } from '@query-params/core';

// Define schema with Zod - full type inference
const SearchParams = z.object({
  query: z.string(),
  filters: z.array(z.string()),
  page: z.number()
});

// Create encoder - TypeScript infers the type automatically
const params = createQueryParams(SearchParams);

// Set values (URLSearchParams-compatible API)
params.set('query', 'test');
params.set('filters', ['a', 'b']);
params.set('page', 1);

// Use in URL - polymorphic toString()
const url = `/search?${params}`;

// Decode anywhere (client or server)
const decoded = params.parse(searchString);
// Type: { query: string, filters: string[], page: number }
// Value: { query: 'test', filters: ['a', 'b'], page: 1 }
```

#### 6.2 Server Mode (Secure) - No Build Step
```typescript
// Install: npm install @query-params/core @query-params/crypto zod
// No build configuration needed!

import { z } from 'zod';
import { createSecureQueryParams } from '@query-params/crypto';

// Define schema with Zod
const SecureState = z.object({
  userId: z.string(),
  permissions: z.array(z.string())
});

// Server-only encoding - NOT decodeable in frontend
const params = createSecureQueryParams(SecureState, {
  encryptionKey: process.env.ENCRYPTION_KEY
});

// Server: Encode sensitive data
const token = params.encode({
  userId: '123',
  permissions: ['read', 'write']
});

// Client receives opaque token - CANNOT decode in browser
const url = `/dashboard?state=${token}`;

// Server: Decode (only works server-side with encryption key)
const state = params.decode(token);
// Type: { userId: string, permissions: string[] }
// Value: { userId: '123', permissions: ['read', 'write'] }
```

#### 6.3 Route State & URL Shortening - No Build Step
```typescript
// Install: npm install @query-params/router zod
// No build configuration needed!

import { z } from 'zod';
import { createRouteEncoder } from '@query-params/router';

// Define schema with Zod
const RouteState = z.object({
  path: z.string(),
  params: z.record(z.string()),
  query: z.record(z.any())
});

// Encode entire route information securely
const routeEncoder = createRouteEncoder(RouteState, {
  encryptionKey: process.env.ENCRYPTION_KEY
});

// Server: Long URL with complex state
const longUrl = '/products/123/reviews?sort=date&filter=verified&page=5&pageSize=20';

// Encode entire route as short token (server-side)
const token = routeEncoder.encode({
  path: '/products/123/reviews',
  params: { id: '123' },
  query: { sort: 'date', filter: 'verified', page: 5, pageSize: 20 }
});

// Short shareable URL (client receives this)
const shortUrl = `/r/${token}`; // e.g., /r/eyJhbG...Abc

// Server: Decode and redirect
const route = routeEncoder.decode(token);
// Type: { path: string, params: Record<string, string>, query: Record<string, any> }
// Value: { path: '/products/123/reviews', params: {...}, query: {...} }

// Reconstruct original URL
const reconstructed = routeEncoder.toUrl(route);
// '/products/123/reviews?sort=date&filter=verified&page=5&pageSize=20'
```

#### 6.4 Framework Integration (Next.js) - No Build Step
```typescript
// Install: npm install @query-params/nextjs zod
// No build configuration needed!

import { z } from 'zod';
import { createSecureParams } from '@query-params/nextjs';

// Define schema with Zod
const PageState = z.object({
  userId: z.string(),
  filters: z.array(z.string())
});

// Create secure params encoder
const pageParams = createSecureParams(PageState);

// app/actions.ts - Server Action
export async function generateStateUrl(state: z.infer<typeof PageState>) {
  'use server';
  const token = pageParams.encode(state);
  return `/page?state=${token}`;
}

// app/page/route.ts - API Route
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('state');

  // Decode server-side only
  const state = pageParams.decode(token);

  return Response.json(state);
}

// Client component - receives URL but cannot decode
'use client';
export function MyComponent() {
  const [url, setUrl] = useState('');

  // Generate URL with server action
  const handleGenerate = async () => {
    const url = await generateStateUrl({
      userId: '123',
      filters: ['a', 'b']
    });
    setUrl(url); // Client gets URL but cannot decode token
  };

  return <a href={url}>Go to page</a>;
}
```

#### 6.5 React Hooks - No Build Step
```typescript
// Install: npm install @query-params/react zod
// No build configuration needed!

import { z } from 'zod';
import { useQueryParams } from '@query-params/react';

// Define schema with Zod
const SearchFilters = z.object({
  query: z.string(),
  category: z.string().optional(),
  minPrice: z.number().optional()
});

function SearchPage() {
  // Type-safe query params hook with Zod schema
  const [params, setParams] = useQueryParams(SearchFilters);

  // Access with full type safety
  const query = params.get('query'); // string
  const category = params.get('category'); // string | undefined

  // Update params
  const updateSearch = (newQuery: string) => {
    setParams(prev => {
      prev.set('query', newQuery);
      return prev;
    });
  };

  return (
    <input
      value={params.get('query')}
      onChange={e => updateSearch(e.target.value)}
    />
  );
}
```

#### 6.6 Versioning & Migration with Up/Down - No Build Step
```typescript
// Install: npm install @query-params/migrations zod
// No build configuration needed!

import { z } from 'zod';
import { versioned } from '@query-params/migrations';

// Define v1 schema with Zod
const SearchParamsV1 = z.object({
  query: z.string()
});

// Define v2 schema (added field)
const SearchParamsV2 = z.object({
  query: z.string(),
  filters: z.array(z.string()).optional()
});

// Register versions with up/down migrations at runtime
const SearchParams = versioned({
  versions: {
    v1: SearchParamsV1,
    v2: SearchParamsV2
  },
  migrations: {
    'v1->v2': {
      up: (v1) => ({
        ...v1,
        filters: [] // default value when upgrading
      }),
      down: (v2) => ({
        query: v2.query // drop filters when downgrading
      })
    }
  }
});

// Create encoder with current version (v2)
const params = SearchParams.create('v2');

// Decode old v1 data - automatically runs up migration to v2
const decoded = params.parse(oldV1EncodedString);
// Type: { query: string, filters?: string[] }
// Value: { query: 'test', filters: [] }

// Decode v2 data - no migration needed
const decoded2 = params.parse(v2EncodedString);
// Type: { query: string, filters?: string[] }
// Value: { query: 'test', filters: ['a', 'b'] }

// If v1 code reads v2 data, runs down migration automatically
```

#### 6.7 Optional Build Integration (Advanced)
```typescript
// OPTIONAL: Only for teams that want build-time code generation
// Install: npm install @query-params/compiler

// vite.config.ts
import { defineConfig } from 'vite';
import { queryParamsPlugin } from '@query-params/compiler/vite';

export default defineConfig({
  plugins: [
    queryParamsPlugin({
      // Extract TypeScript interfaces and generate runtime schemas
      include: ['src/**/*.ts'],
      // Watch for type changes
      watch: true,
      // Auto-generate migration boilerplate
      generateMigrations: true
    })
  ]
});

// This allows you to write:
interface SearchParams {
  query: string;
  filters: string[];
}

// And the plugin generates the runtime schema for you
// But this is OPTIONAL - runtime schema definition is the default approach
```

### 7. Non-Functional Requirements

#### 7.1 Documentation
- **MUST** provide comprehensive documentation with examples
- **MUST** document migration patterns and best practices
- **MUST** document security considerations
- **SHOULD** provide interactive examples/playground

#### 7.2 Testing
- **MUST** provide >90% test coverage
- **MUST** test cross-version compatibility
- **MUST** test migration correctness
- **MUST** test security properties

#### 7.3 Compatibility
- **MUST** support TypeScript 5.0+
- **MUST** support Node.js 18+
- **MUST** support all modern browsers (last 2 versions)
- **MUST** support edge runtimes

## Technical Architecture

### Monorepo Structure

This is a **modular TypeScript monorepo** with **zero build step required** - all packages work at runtime.

#### Core Packages (Runtime Only)

**`@query-params/core`**
- Core runtime encoder/decoder logic
- Uses Zod for schema definition and validation
- Protocol Buffer serialization (protobufjs)
- Compression (zlib/pako)
- URLSearchParams-compatible API
- Version detection and routing
- Full TypeScript type inference via Zod
- Platform-agnostic (works in browser, Node.js, edge)
- **No build step required**
- Depends on: zod (peer dependency)

**`@query-params/crypto`**
- Encryption/decryption for server mode
- Authenticated encryption (AES-GCM)
- Platform-specific crypto implementations:
  - Web Crypto API for browsers
  - Node.js crypto for server
  - Edge runtime compatible
- Anti-tampering and replay attack prevention
- NOT decodeable in frontend when used in server mode
- **No build step required**

**`@query-params/migrations`**
- Runtime migration system with up/down functions
- Define migrations inline with Zod schemas
- Applies up migrations when reading older versions
- Applies down migrations when reading newer versions (backward compatibility)
- Migration helpers for common patterns
- Runtime migration validation (up then down equals original)
- **No build step required**

#### Framework Integrations (Runtime Only)

**`@query-params/nextjs`**
- Next.js specific utilities
- Server Actions integration
- Route handlers helpers
- Middleware for route shortening
- App Router and Pages Router support
- **No build step required**

**`@query-params/remix`**
- Remix loader/action helpers
- Server-side encoding utilities
- Client-side decoding for public mode
- **No build step required**

**`@query-params/sveltekit`**
- SvelteKit load function helpers
- Form actions integration
- Server-side utilities
- **No build step required**

**`@query-params/react`**
- React hooks for query params
- `useQueryParams()` hook
- `useSecureState()` for server state
- Type-safe parameter access
- **No build step required**

#### Utility Packages (Runtime Only)

**`@query-params/router`**
- Route state encoding/decoding
- URL shortening utilities
- Path, params, and query string handling
- Route reconstruction from tokens
- **No build step required**

#### Optional Build-Time Packages (Advanced Users Only)

**`@query-params/codegen` (OPTIONAL)**
- Optional build-time code generation for teams that want it
- Extract schemas from TypeScript types
- Generate migration boilerplate
- CLI tool
- **Not required for normal usage**

**`@query-params/compiler` (OPTIONAL)**
- Optional build tool plugins for advanced workflows
- Vite / Webpack / esbuild / Rollup plugins
- Auto-generate schemas from types at build time
- **Not required for normal usage**

### Package Dependencies

```
@query-params/core
  ├─ zod (peer dependency)
  ├─ protobufjs
  ├─ pako

@query-params/crypto
  ├─ @query-params/core
  ├─ zod (peer dependency)

@query-params/migrations
  ├─ @query-params/core
  ├─ zod (peer dependency)

@query-params/router
  ├─ @query-params/core
  ├─ @query-params/crypto
  ├─ zod (peer dependency)

@query-params/nextjs
  ├─ @query-params/core
  ├─ @query-params/crypto
  ├─ @query-params/router
  ├─ zod (peer dependency)
  ├─ next (peer)

@query-params/remix
  ├─ @query-params/core
  ├─ @query-params/crypto
  ├─ @query-params/router
  ├─ zod (peer dependency)
  ├─ @remix-run/react (peer)

@query-params/sveltekit
  ├─ @query-params/core
  ├─ @query-params/crypto
  ├─ @query-params/router
  ├─ zod (peer dependency)
  ├─ @sveltejs/kit (peer)

@query-params/react
  ├─ @query-params/core
  ├─ zod (peer dependency)
  ├─ react (peer)

@query-params/codegen (OPTIONAL - not required)
  ├─ @query-params/core
  ├─ zod (peer dependency)
  ├─ typescript (peer)

@query-params/compiler (OPTIONAL - not required)
  ├─ @query-params/codegen
  ├─ vite/webpack/esbuild (peers)
```

### Stack
- **Language**: TypeScript (5.0+)
- **Monorepo Tool**: pnpm workspaces or Turborepo
- **Runtime Schema Definition**: Zod for schema definition and type inference
- **Serialization**: Protocol Buffers (protobufjs)
- **Compression**: zlib (Node.js) / pako (browser)
- **Encryption**: Web Crypto API / Node.js crypto
- **Build**: **NONE required** - pure runtime solution (optional codegen available)

## Success Criteria

- **Zero build step required** - import and use immediately
- Developers can add library and use with <5 lines of code
- Runtime schema definition with full TypeScript type inference
- Migrations defined at runtime alongside schemas
- Zero runtime errors for version mismatches (graceful degradation)
- Bundle size <10KB for basic usage
- Clear error messages for all failure modes
- Comprehensive documentation and examples
- Server mode tokens are completely opaque and undecodeable in frontend
- URL shortening reduces complex URLs to short shareable tokens
- Full route state (path, params, query) can be securely encoded
- Optional build-time codegen available for advanced users
