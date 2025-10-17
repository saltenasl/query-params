import { defineConfig } from 'tsup';

/**
 * Shared tsup configuration for all packages in the encoded-state monorepo.
 *
 * This configuration produces dual ESM/CJS builds that work in:
 * - Node.js (18+)
 * - Browsers (modern)
 * - Edge runtimes (Cloudflare Workers, Vercel Edge, etc.)
 *
 * Output files:
 * - dist/index.mjs (ESM)
 * - dist/index.cjs (CommonJS)
 * - dist/index.d.ts (TypeScript declarations)
 * - dist/index.d.mts (ESM-specific declarations)
 * - dist/index.d.cts (CJS-specific declarations)
 *
 * Usage in packages:
 *
 * 1. Create `packages/<name>/tsup.config.ts`:
 *
 *    ```ts
 *    import { defineConfig } from 'tsup';
 *    import baseConfig from '../../tsup.config.js';
 *
 *    export default defineConfig({
 *      ...baseConfig,
 *      entry: ['src/index.ts'],
 *      // Override any settings if needed
 *    });
 *    ```
 *
 * 2. Add to `packages/<name>/package.json`:
 *
 *    ```json
 *    {
 *      "type": "module",
 *      "main": "./dist/index.cjs",
 *      "module": "./dist/index.mjs",
 *      "types": "./dist/index.d.ts",
 *      "exports": {
 *        ".": {
 *          "types": "./dist/index.d.ts",
 *          "import": {
 *            "types": "./dist/index.d.mts",
 *            "default": "./dist/index.mjs"
 *          },
 *          "require": {
 *            "types": "./dist/index.d.cts",
 *            "default": "./dist/index.cjs"
 *          }
 *        }
 *      },
 *      "files": ["dist"],
 *      "scripts": {
 *        "build": "tsup",
 *        "dev": "tsup --watch"
 *      }
 *    }
 *    ```
 *
 * 3. Build:
 *
 *    ```bash
 *    # Build single package
 *    pnpm --filter @encoded-state/core build
 *
 *    # Build all packages
 *    pnpm -r build
 *
 *    # Watch mode for development
 *    pnpm --filter @encoded-state/core dev
 *    ```
 */
export default defineConfig({
  // Entry point - packages should override this
  entry: ['src/index.ts'],

  // Output both ESM and CJS formats
  format: ['esm', 'cjs'],

  // Generate TypeScript declaration files
  dts: true,

  // Generate sourcemaps for debugging
  sourcemap: true,

  // Clean dist folder before build
  clean: true,

  // Don't use code splitting (better for libraries)
  splitting: false,

  // Platform-neutral build (works in Node.js and browsers)
  platform: 'neutral',

  // Don't bundle dependencies
  external: [
    // Let consumers handle these
    /^zod$/,
    /^protobufjs$/,
    /^pako$/,
  ],

  // Minify in production
  minify: false, // Packages should override for production builds

  // Tree-shakeable output
  treeshake: true,

  // Emit CJS with .cjs extension, ESM with .mjs
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.mjs',
    };
  },

  // Target modern environments
  target: 'es2020',

  // Preserve modules for better tree-shaking
  // (disable for libraries that need single file output)
  // splitting: false already handles this

  // Skip node_modules
  skipNodeModulesBundle: true,

  // Show build info
  silent: false,
});
