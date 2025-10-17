/**
 * Example Vitest configuration for a package
 *
 * Copy this file to your package directory (e.g., packages/core/vitest.config.ts)
 * and customize as needed.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment
    // - 'node': For server-side code, Node.js APIs
    // - 'jsdom': For browser code, DOM APIs (React, etc.)
    // - 'happy-dom': Faster alternative to jsdom
    environment: 'node',

    // Enable global test APIs (optional, defaults to root config)
    globals: true,

    // Coverage configuration (optional, inherits from root)
    coverage: {
      // You can override coverage thresholds per package
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },

      // Package-specific coverage excludes
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/tests/**',
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
    },

    // Test timeout (optional)
    testTimeout: 5000,

    // Setup files specific to this package
    // setupFiles: ['./tests/setup.ts'],

    // Include patterns (optional)
    // include: ['tests/**/*.test.ts'],
  },
});
