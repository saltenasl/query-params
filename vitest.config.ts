import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment - defaults to node, can be overridden per package
    environment: 'node',

    // Enable global test APIs (describe, it, expect, etc.) without imports
    globals: true,

    // Workspace configuration - test all packages in the monorepo
    projects: [
      // Root tests
      {
        test: {
          name: 'root',
          include: ['tests/**/*.{test,spec}.{ts,tsx}'],
          environment: 'node',
          globals: true,
          setupFiles: ['./tests/setup.ts'],
        },
      },
      // Individual packages - they can have their own vitest.config.ts
      // which will override these settings
      'packages/*',
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],

      // Coverage thresholds - enforce minimum 90% coverage
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },

      // Files to exclude from coverage
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/test-utils.ts',
        '**/*.config.*',
        '**/examples/**',
        '**/benchmarks/**',
      ],
    },

    // Include test files - tests live next to source files
    include: ['**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],

    // Global setup file (runs once before all tests)
    setupFiles: ['./tests/setup.ts'],

    // Test timeout (5 seconds default)
    testTimeout: 5000,

    // Hook timeout
    hookTimeout: 10000,
  },
});
