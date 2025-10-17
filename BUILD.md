# Build System Documentation

This document explains the build system configuration for the encoded-state library.

## Overview

The encoded-state library uses **tsup** for building packages with dual ESM/CJS output. This ensures compatibility across:

- Node.js (18+)
- Modern browsers
- Edge runtimes (Cloudflare Workers, Vercel Edge Functions, etc.)

## Configuration Files

### `tsconfig.json` (Root)

The root TypeScript configuration provides:

- **Target**: ES2020 for modern JavaScript features
- **Module**: ESNext for optimal tree-shaking
- **Strict mode**: All strict type-checking options enabled
- **Declaration files**: Generated for TypeScript consumers
- **Composite mode**: Supports TypeScript project references

Key compiler options:

```json
{
  "target": "ES2020",
  "module": "ESNext",
  "strict": true,
  "declaration": true,
  "isolatedModules": true
}
```

### `tsup.config.ts` (Root)

The root tsup configuration is a **shared base** that all packages extend. It provides:

- **Dual format output**: ESM (`.mjs`) and CJS (`.cjs`)
- **TypeScript declarations**: `.d.ts`, `.d.mts`, `.d.cts`
- **Sourcemaps**: For debugging
- **Platform-neutral**: Works in Node.js and browsers
- **Tree-shakeable**: Optimized for bundle size

## Package Setup

Each package in the monorepo should follow this structure:

### 1. Package `tsup.config.ts`

```typescript
import { defineConfig } from 'tsup';
import baseConfig from '../../tsup.config.js';

export default defineConfig({
  ...baseConfig,
  entry: ['src/index.ts'],
  // Override settings if needed
});
```

### 2. Package `tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules", "tests"]
}
```

### 3. Package `package.json`

```json
{
  "name": "@encoded-state/core",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": {
        "types": "./dist/index.d.mts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.3.0"
  }
}
```

## Build Commands

### Single Package

```bash
# Build a specific package
pnpm --filter @encoded-state/core build

# Watch mode for development
pnpm --filter @encoded-state/core dev

# Type-check only (no emit)
pnpm --filter @encoded-state/core type-check
```

### All Packages

```bash
# Build all packages (monorepo)
pnpm -r build

# Clean all dist folders
pnpm -r exec rm -rf dist

# Build in watch mode (parallel)
pnpm -r --parallel dev
```

## Output Structure

After building, each package will have:

```
packages/core/
├── dist/
│   ├── index.mjs           # ESM bundle
│   ├── index.cjs           # CommonJS bundle
│   ├── index.d.ts          # Base TypeScript declarations
│   ├── index.d.mts         # ESM-specific declarations
│   ├── index.d.cts         # CJS-specific declarations
│   ├── index.mjs.map       # ESM sourcemap
│   └── index.cjs.map       # CJS sourcemap
├── src/
│   └── index.ts
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

## Module Resolution

The `exports` field in `package.json` ensures proper module resolution:

### ESM Import

```typescript
import { createQueryParams } from '@encoded-state/core';
// Resolves to: dist/index.mjs
```

### CommonJS Require

```javascript
const { createQueryParams } = require('@encoded-state/core');
// Resolves to: dist/index.cjs
```

### TypeScript Types

TypeScript automatically picks the correct declaration file:

- ESM projects: `dist/index.d.mts`
- CJS projects: `dist/index.d.cts`
- Fallback: `dist/index.d.ts`

## Platform Compatibility

### Node.js

Both ESM and CJS work natively:

```javascript
// ESM (package.json with "type": "module")
import { createQueryParams } from '@encoded-state/core';

// CommonJS
const { createQueryParams } = require('@encoded-state/core');
```

### Browsers

Use ESM imports:

```html
<script type="module">
  import { createQueryParams } from '@encoded-state/core';
</script>
```

### Edge Runtimes

Edge functions automatically use the ESM build:

```typescript
// Cloudflare Workers, Vercel Edge, etc.
import { createQueryParams } from '@encoded-state/core';

export default {
  async fetch(request) {
    // ...
  }
};
```

## Customization

Packages can override base config settings:

```typescript
// packages/crypto/tsup.config.ts
import { defineConfig } from 'tsup';
import baseConfig from '../../tsup.config.js';

export default defineConfig({
  ...baseConfig,
  entry: ['src/index.ts'],
  external: [
    ...baseConfig.external,
    /^@encoded-state\/core$/, // Add core as external
  ],
  minify: true, // Enable minification for this package
});
```

## Best Practices

1. **Always extend base config**: Don't recreate settings from scratch
2. **Use `.mjs` and `.cjs` extensions**: Explicit format for clarity
3. **Generate all declaration files**: `.d.ts`, `.d.mts`, `.d.cts`
4. **Include sourcemaps**: Essential for debugging
5. **Set `"type": "module"`**: Modern default
6. **Use `exports` field**: Better than `main` + `module`
7. **List `dist` in `files`**: Only ship built output

## Troubleshooting

### "Cannot find module" errors

Ensure `package.json` has correct `exports`:

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  }
}
```

### TypeScript can't find types

Add `types` to `exports`:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  }
}
```

### Build fails with module resolution errors

Check `tsconfig.json`:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

## References

- [tsup documentation](https://tsup.egoist.dev/)
- [Node.js package.json exports](https://nodejs.org/api/packages.html#exports)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/modules/theory.html)
