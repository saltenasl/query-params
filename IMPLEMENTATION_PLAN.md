# Implementation Plan: encoded-state Library

**Goal**: Build a production-ready, open-source TypeScript library for type-safe, versioned query parameters with compression and encryption.

**Strategy**: Maximize parallel work through independent tasks that can be executed by multiple subagents simultaneously.

---

## Phase 1: Foundation & Infrastructure (Parallel Tasks)

All tasks in this phase can be executed simultaneously by different agents.

### 1.1 Monorepo Setup
**Agent**: Infrastructure Agent
**Dependencies**: None
**Deliverables**:
- [ ] Initialize pnpm workspace (`pnpm-workspace.yaml`)
- [ ] Root `package.json` with workspace scripts
- [ ] Root `tsconfig.json` (base configuration)
- [ ] `.gitignore` (node_modules, dist, coverage, .turbo)
- [ ] `.npmrc` (workspace settings)
- [ ] Prettier config (`.prettierrc`)
- [ ] ESLint config (`eslint.config.js`)
- [ ] EditorConfig (`.editorconfig`)

**Files to create**:
```
pnpm-workspace.yaml
package.json
tsconfig.json
.gitignore
.npmrc
.prettierrc
eslint.config.js
.editorconfig
```

---

### 1.2 Build System Setup
**Agent**: Build Agent
**Dependencies**: 1.1 (Monorepo Setup)
**Deliverables**:
- [ ] Configure `tsup` for dual ESM/CJS builds
- [ ] Root `tsup.config.ts` with shared settings
- [ ] Build scripts in root `package.json`
- [ ] `pnpm build` command (all packages)
- [ ] `pnpm build --filter @encoded-state/core` (single package)
- [ ] Verify dual output: `.mjs`, `.cjs`, `.d.ts`

**Files to create**:
```
tsup.config.ts
```

---

### 1.3 Testing Infrastructure
**Agent**: Testing Agent
**Dependencies**: 1.1 (Monorepo Setup)
**Deliverables**:
- [ ] Vitest configuration (`vitest.config.ts`)
- [ ] Test setup file (`tests/setup.ts`)
- [ ] Coverage configuration (>90% target)
- [ ] `pnpm test` command (all packages)
- [ ] `pnpm test core` command (single package)
- [ ] `pnpm test --watch` command
- [ ] `pnpm dev` command (watch: test + lint + type-check)

**Files to create**:
```
vitest.config.ts
vitest.workspace.ts (for monorepo)
tests/setup.ts
```

---

### 1.4 CI/CD Pipeline
**Agent**: CI/CD Agent
**Dependencies**: 1.1, 1.2, 1.3
**Deliverables**:
- [ ] GitHub Actions workflow (`.github/workflows/ci.yml`)
- [ ] Run tests on PR
- [ ] Run lint on PR
- [ ] Run type-check on PR
- [ ] Build all packages
- [ ] Coverage reporting
- [ ] Test on Node 18, 20, 22
- [ ] Test on Ubuntu, macOS, Windows

**Files to create**:
```
.github/workflows/ci.yml
.github/workflows/release.yml
```

---

### 1.5 Documentation Setup
**Agent**: Documentation Agent
**Dependencies**: None
**Deliverables**:
- [ ] LICENSE file (MIT)
- [ ] CONTRIBUTING.md
- [ ] CODE_OF_CONDUCT.md
- [ ] SECURITY.md
- [ ] Update README.md with badges
- [ ] Changelog template (CHANGELOG.md)
- [ ] Issue templates (bug, feature, question)
- [ ] PR template

**Files to create**:
```
LICENSE
CONTRIBUTING.md
CODE_OF_CONDUCT.md
SECURITY.md
CHANGELOG.md
.github/ISSUE_TEMPLATE/bug_report.md
.github/ISSUE_TEMPLATE/feature_request.md
.github/pull_request_template.md
```

---

## Phase 2: Core Package Foundation (Parallel Tasks)

All tasks in this phase can be executed simultaneously after Phase 1 completes.

### 2.1 Core Package Structure
**Agent**: Core Structure Agent
**Dependencies**: Phase 1 complete
**Deliverables**:
- [ ] Create `packages/core/` directory
- [ ] `packages/core/package.json` (with dual exports)
- [ ] `packages/core/tsconfig.json`
- [ ] `packages/core/tsup.config.ts`
- [ ] `packages/core/src/index.ts` (main export)
- [ ] `packages/core/tests/` directory
- [ ] Basic folder structure:
  ```
  packages/core/
  ├── src/
  │   ├── index.ts
  │   ├── types.ts
  │   ├── errors.ts
  │   └── utils/
  ├── tests/
  └── package.json
  ```

**Files to create**:
```
packages/core/package.json
packages/core/tsconfig.json
packages/core/tsup.config.ts
packages/core/src/index.ts
packages/core/src/types.ts
packages/core/src/errors.ts
```

---

### 2.2 Error Classes
**Agent**: Error Handling Agent
**Dependencies**: 2.1 (Core Package Structure)
**Deliverables**:
- [ ] `ValidationError` class
- [ ] `VersionMismatchError` class
- [ ] `DecodingError` class
- [ ] `CompressionError` class
- [ ] Base `EncodedStateError` class
- [ ] Error factory functions
- [ ] Tests for all error types

**Files to create**:
```
packages/core/src/errors.ts
packages/core/tests/errors.test.ts
```

---

### 2.3 Zod Schema Validator
**Agent**: Validation Agent
**Dependencies**: 2.1 (Core Package Structure)
**Deliverables**:
- [ ] Validate Zod schema doesn't use `_encodedStateVersion`
- [ ] Schema validation utilities
- [ ] Type guards for Zod schemas
- [ ] Tests for schema validation
- [ ] Tests for reserved field detection

**Files to create**:
```
packages/core/src/validation.ts
packages/core/tests/validation.test.ts
```

---

### 2.4 Zod to Protobuf Converter
**Agent**: Protobuf Conversion Agent
**Dependencies**: 2.1 (Core Package Structure)
**Deliverables**:
- [ ] Walk Zod schema and extract structure
- [ ] Map Zod types to protobuf types:
  - `z.string()` → `string`
  - `z.number()` → `double` (or `int32` for integers)
  - `z.boolean()` → `bool`
  - `z.array(T)` → `repeated T`
  - `z.object({})` → nested message
  - `z.optional()` → `optional` field
  - `z.union()` → multiple optional fields or `oneof`
  - `z.enum()` → `enum` or `string`
  - `z.record()` → `map<string, T>`
- [ ] Generate protobuf schema dynamically using `protobufjs`
- [ ] Cache generated schemas (WeakMap keyed by Zod schema)
- [ ] Add `_encodedStateVersion` field automatically
- [ ] Comprehensive tests for all type mappings

**Files to create**:
```
packages/core/src/protobuf/converter.ts
packages/core/src/protobuf/cache.ts
packages/core/tests/protobuf-converter.test.ts
```

---

### 2.5 Compression Layer
**Agent**: Compression Agent
**Dependencies**: 2.1 (Core Package Structure)
**Deliverables**:
- [ ] Platform detection (Node.js vs Browser)
- [ ] Node.js compression (native `zlib`)
- [ ] Browser compression (`pako`)
- [ ] Decompression for both platforms
- [ ] Compression threshold testing (determine if worth compressing)
- [ ] Base64url encoding/decoding (URL-safe, no padding)
- [ ] Tests for both platforms
- [ ] Performance benchmarks

**Files to create**:
```
packages/core/src/compression/compress.ts
packages/core/src/compression/decompress.ts
packages/core/src/compression/base64url.ts
packages/core/src/compression/platform.ts
packages/core/tests/compression.test.ts
packages/core/tests/compression-browser.test.ts (jsdom)
```

---

### 2.6 Encoder/Decoder Core
**Agent**: Encoding Agent
**Dependencies**: 2.3, 2.4, 2.5
**Deliverables**:
- [ ] `encode(data, schema)` function
  - Validate with Zod
  - Convert to protobuf message
  - Serialize to binary
  - Compress
  - Base64url encode
- [ ] `decode(encoded, schema)` function
  - Base64url decode
  - Decompress
  - Parse protobuf
  - Validate with Zod
- [ ] `safeParse` option support
- [ ] Full encode/decode round-trip tests
- [ ] Invalid input handling tests

**Files to create**:
```
packages/core/src/encoder.ts
packages/core/src/decoder.ts
packages/core/tests/encode-decode.test.ts
```

---

## Phase 3: Core Package API (Parallel Tasks)

All tasks in this phase can be executed simultaneously after Phase 2 completes.

### 3.1 URLSearchParams-Compatible API
**Agent**: URLSearchParams Agent
**Dependencies**: 2.6 (Encoder/Decoder Core)
**Deliverables**:
- [ ] Implement ALL URLSearchParams methods:
  - `get(key)`
  - `set(key, value)`
  - `has(key)`
  - `delete(key)`
  - `append(key, value)`
  - `getAll(key)`
  - `entries()`
  - `keys()`
  - `values()`
  - `forEach(callback)`
  - `sort()`
- [ ] Internal state management
- [ ] Tests for each method
- [ ] Compatibility tests with native URLSearchParams

**Files to create**:
```
packages/core/src/query-params.ts
packages/core/tests/urlsearchparams.test.ts
```

---

### 3.2 Polymorphic String Conversion
**Agent**: Polymorphism Agent
**Dependencies**: 3.1 (URLSearchParams API)
**Deliverables**:
- [ ] Implement `toString()` method
- [ ] Implement `[Symbol.toPrimitive]` for coercion
- [ ] Test `String(params)`
- [ ] Test `` `?${params}` `` (template literal)
- [ ] Test `'' + params` (concatenation)
- [ ] Test `params.toString()`

**Files to create**:
```
packages/core/src/polymorphic.ts
packages/core/tests/polymorphic.test.ts
```

---

### 3.3 Main API: createQueryParams
**Agent**: API Agent
**Dependencies**: 3.1, 3.2
**Deliverables**:
- [ ] `createQueryParams(schema, options?)` function
- [ ] Returns URLSearchParams-compatible object
- [ ] Options: `safeParse`, custom config
- [ ] Full type inference via Zod
- [ ] Integration tests
- [ ] API documentation

**Files to create**:
```
packages/core/src/create-query-params.ts
packages/core/tests/create-query-params.test.ts
```

---

### 3.4 Versioning System
**Agent**: Versioning Agent
**Dependencies**: 2.6 (Encoder/Decoder Core)
**Deliverables**:
- [ ] `versioned()` function for multi-version schemas
- [ ] Version detection from encoded data
- [ ] Up migration execution (old → new)
- [ ] Down migration execution (new → old)
- [ ] TypeScript: Enforce migration paths at compile time
- [ ] Migration chain validation
- [ ] Error on missing migration
- [ ] Tests for all migration paths
- [ ] Tests for version mismatch errors

**Files to create**:
```
packages/core/src/versioning/versioned.ts
packages/core/src/versioning/migrate.ts
packages/core/tests/versioning.test.ts
```

---

## Phase 4: Additional Packages (Parallel Tasks)

All tasks in this phase can be executed simultaneously after Phase 3 completes.

### 4.1 Crypto Package
**Agent**: Crypto Agent
**Dependencies**: Phase 3 complete
**Deliverables**:
- [ ] Create `packages/crypto/` structure
- [ ] AES-256-GCM encryption
- [ ] AES-256-GCM decryption
- [ ] Key management (param vs env var)
- [ ] `createSecureQueryParams(schema, options)` API
- [ ] Platform detection (Node.js crypto vs Web Crypto API)
- [ ] Encryption/decryption round-trip tests
- [ ] Wrong key tests
- [ ] Corrupted data tests

**Files to create**:
```
packages/crypto/package.json
packages/crypto/src/index.ts
packages/crypto/src/encrypt.ts
packages/crypto/src/decrypt.ts
packages/crypto/tests/crypto.test.ts
```

---

### 4.2 Migrations Package
**Agent**: Migrations Agent
**Dependencies**: Phase 3 complete
**Deliverables**:
- [ ] Create `packages/migrations/` structure
- [ ] Advanced migration helpers:
  - `addField(name, defaultValue)`
  - `removeField(name)`
  - `renameField(oldName, newName)`
  - `transformField(name, transform)`
- [ ] Migration validation utilities
- [ ] Migration testing helpers
- [ ] Tests for all helpers

**Files to create**:
```
packages/migrations/package.json
packages/migrations/src/index.ts
packages/migrations/src/helpers.ts
packages/migrations/tests/helpers.test.ts
```

---

### 4.3 Router Package
**Agent**: Router Agent
**Dependencies**: Phase 3, 4.1 (Crypto)
**Deliverables**:
- [ ] Create `packages/router/` structure
- [ ] `createRouteEncoder(schema, options)` API
- [ ] Route state schema (path, params, query)
- [ ] `encode({ path, params, query })` → token
- [ ] `decode(token)` → route state
- [ ] `toUrl(routeState)` → full URL string
- [ ] URL shortening examples
- [ ] Tests for route encoding/decoding

**Files to create**:
```
packages/router/package.json
packages/router/src/index.ts
packages/router/src/route-encoder.ts
packages/router/tests/router.test.ts
```

---

### 4.4 React Package
**Agent**: React Agent
**Dependencies**: Phase 3 complete
**Deliverables**:
- [ ] Create `packages/react/` structure
- [ ] `useQueryParams(schema)` hook
- [ ] `useSecureState(schema)` hook
- [ ] React Router integration
- [ ] Type-safe parameter access
- [ ] Update URL on state change
- [ ] Parse URL on mount
- [ ] Tests with @testing-library/react

**Files to create**:
```
packages/react/package.json
packages/react/src/index.ts
packages/react/src/use-query-params.ts
packages/react/src/use-secure-state.ts
packages/react/tests/hooks.test.tsx
```

---

### 4.5 Next.js Package
**Agent**: Next.js Agent
**Dependencies**: Phase 3, 4.1 (Crypto)
**Deliverables**:
- [ ] Create `packages/nextjs/` structure
- [ ] `createSecureParams(schema)` for server
- [ ] Server Actions integration
- [ ] API Route helpers
- [ ] Middleware for route shortening
- [ ] App Router support
- [ ] Pages Router support
- [ ] Tests (mock Next.js environment)

**Files to create**:
```
packages/nextjs/package.json
packages/nextjs/src/index.ts
packages/nextjs/src/server.ts
packages/nextjs/src/client.ts
packages/nextjs/tests/nextjs.test.ts
```

---

### 4.6 Remix Package
**Agent**: Remix Agent
**Dependencies**: Phase 3, 4.1 (Crypto)
**Deliverables**:
- [ ] Create `packages/remix/` structure
- [ ] Loader helpers
- [ ] Action helpers
- [ ] Server-side encoding
- [ ] Client-side decoding (public mode)
- [ ] Tests (mock Remix environment)

**Files to create**:
```
packages/remix/package.json
packages/remix/src/index.ts
packages/remix/src/loaders.ts
packages/remix/src/actions.ts
packages/remix/tests/remix.test.ts
```

---

### 4.7 SvelteKit Package
**Agent**: SvelteKit Agent
**Dependencies**: Phase 3, 4.1 (Crypto)
**Deliverables**:
- [ ] Create `packages/sveltekit/` structure
- [ ] Load function helpers
- [ ] Form actions integration
- [ ] Server-side utilities
- [ ] Tests (mock SvelteKit environment)

**Files to create**:
```
packages/sveltekit/package.json
packages/sveltekit/src/index.ts
packages/sveltekit/src/load.ts
packages/sveltekit/src/actions.ts
packages/sveltekit/tests/sveltekit.test.ts
```

---

## Phase 5: Integration & Polish (Parallel Tasks)

All tasks in this phase can be executed simultaneously after Phase 4 completes.

### 5.1 End-to-End Tests
**Agent**: E2E Testing Agent
**Dependencies**: Phase 4 complete
**Deliverables**:
- [ ] Cross-package integration tests
- [ ] Real-world usage examples as tests
- [ ] Browser compatibility tests (Playwright)
- [ ] Node.js compatibility tests
- [ ] Edge runtime tests (miniflare for Cloudflare Workers)
- [ ] ESM/CJS compatibility tests

**Files to create**:
```
tests/e2e/browser.test.ts
tests/e2e/node.test.ts
tests/e2e/edge.test.ts
tests/e2e/esm-cjs.test.ts
```

---

### 5.2 Performance Benchmarks
**Agent**: Performance Agent
**Dependencies**: Phase 4 complete
**Deliverables**:
- [ ] Encoding speed benchmarks
- [ ] Decoding speed benchmarks
- [ ] Compression ratio benchmarks
- [ ] Bundle size analysis
- [ ] Memory usage profiling
- [ ] Comparison with alternatives (plain JSON, etc.)
- [ ] Results documented in README

**Files to create**:
```
benchmarks/encode.bench.ts
benchmarks/decode.bench.ts
benchmarks/compression.bench.ts
benchmarks/bundle-size.ts
```

---

### 5.3 Documentation
**Agent**: Documentation Agent
**Dependencies**: Phase 4 complete
**Deliverables**:
- [ ] API documentation for all packages
- [ ] Usage examples for each package
- [ ] Migration guide (how to add versions)
- [ ] Security best practices
- [ ] Troubleshooting guide
- [ ] FAQ
- [ ] Update main README with final examples
- [ ] Add JSDocs to all exported functions

**Files to create**:
```
docs/api/core.md
docs/api/crypto.md
docs/api/migrations.md
docs/api/router.md
docs/api/react.md
docs/api/nextjs.md
docs/api/remix.md
docs/api/sveltekit.md
docs/guides/migrations.md
docs/guides/security.md
docs/guides/troubleshooting.md
docs/FAQ.md
```

---

### 5.4 Examples & Demos
**Agent**: Examples Agent
**Dependencies**: Phase 4 complete
**Deliverables**:
- [ ] Example: Next.js App Router
- [ ] Example: Next.js Pages Router
- [ ] Example: Remix app
- [ ] Example: SvelteKit app
- [ ] Example: Vanilla React
- [ ] Example: Node.js API
- [ ] Example: Edge function (Cloudflare Worker)
- [ ] Example: URL shortener service

**Files to create**:
```
examples/nextjs-app/
examples/nextjs-pages/
examples/remix-app/
examples/sveltekit-app/
examples/react-app/
examples/node-api/
examples/edge-function/
examples/url-shortener/
```

---

### 5.5 Package Publishing Prep
**Agent**: Publishing Agent
**Dependencies**: Phase 4 complete
**Deliverables**:
- [ ] Verify all `package.json` files
- [ ] Add proper `keywords`, `description`, `repository`
- [ ] Add `files` field (only include `dist/`)
- [ ] Add `publishConfig` for npm
- [ ] Create `.npmignore` files
- [ ] Test publishing to npm (dry run)
- [ ] Changesets configuration for versioning
- [ ] Release script (`pnpm release`)

**Files to create**:
```
.changeset/config.json
scripts/release.sh
```

---

## Phase 6: Launch Preparation (Sequential)

These tasks should be done sequentially as final checks.

### 6.1 Security Audit
**Agent**: Security Agent
**Dependencies**: Phase 5 complete
**Deliverables**:
- [ ] Run `npm audit` on all packages
- [ ] Review encryption implementation
- [ ] Review input validation
- [ ] Check for injection vulnerabilities
- [ ] Verify no secrets in code
- [ ] Add security policy (SECURITY.md)

---

### 6.2 Final Testing
**Agent**: QA Agent
**Dependencies**: 6.1 (Security Audit)
**Deliverables**:
- [ ] Run full test suite
- [ ] Verify >90% coverage
- [ ] Test all examples
- [ ] Test all commands work
- [ ] Test in fresh clone (simulate user)
- [ ] Test npm install from tarball

---

### 6.3 Release v0.1.0
**Agent**: Release Agent
**Dependencies**: 6.2 (Final Testing)
**Deliverables**:
- [ ] Create git tags for all packages
- [ ] Publish to npm (all packages)
- [ ] Create GitHub release
- [ ] Announce on Twitter/Reddit/HN
- [ ] Update CHANGELOG.md

---

## Parallelization Strategy

### Phase 1: 5 agents in parallel
- Infrastructure Agent
- Build Agent
- Testing Agent
- CI/CD Agent
- Documentation Agent

### Phase 2: 6 agents in parallel
- Core Structure Agent
- Error Handling Agent
- Validation Agent
- Protobuf Conversion Agent
- Compression Agent
- Encoding Agent (waits for 3-5)

### Phase 3: 4 agents in parallel
- URLSearchParams Agent
- Polymorphism Agent
- API Agent
- Versioning Agent

### Phase 4: 7 agents in parallel
- Crypto Agent
- Migrations Agent
- Router Agent
- React Agent
- Next.js Agent
- Remix Agent
- SvelteKit Agent

### Phase 5: 5 agents in parallel
- E2E Testing Agent
- Performance Agent
- Documentation Agent
- Examples Agent
- Publishing Agent

### Phase 6: Sequential (1 agent at a time)
- Security Agent → QA Agent → Release Agent

---

## Critical Path

The critical path (longest sequence) is:
1. Phase 1: Infrastructure (any agent)
2. Phase 2: Core Structure → Encoder/Decoder
3. Phase 3: URLSearchParams → API
4. Phase 4: Any framework package
5. Phase 5: E2E Testing
6. Phase 6: Security → QA → Release

**Estimated parallel speedup**: ~5-7x faster than sequential

---

## Getting Started

To maximize parallelization:

1. **Assign Phase 1 tasks** to 5 different agents immediately
2. Once Phase 1 completes, **assign Phase 2 tasks** to 6 agents
3. Continue pattern for each phase
4. Agents can work independently within their task scope
5. Integration happens naturally as dependencies are met

**Total agents needed**: Up to 7 concurrent agents for maximum speed.

---

## Success Metrics

- [ ] All tests passing (>90% coverage)
- [ ] All packages build successfully (ESM + CJS)
- [ ] All examples run without errors
- [ ] Documentation complete
- [ ] Published to npm
- [ ] GitHub release created
- [ ] Zero security vulnerabilities
