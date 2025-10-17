/**
 * Global test setup file
 *
 * This file runs once before all tests across all packages.
 * Use it for:
 * - Setting up global test utilities
 * - Configuring test environment variables
 * - Initializing mocks or stubs that apply to all tests
 * - Adding custom matchers
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Global setup - runs once before all tests
beforeAll(() => {
  // Example: Set up test environment
  process.env.NODE_ENV = 'test';

  // Suppress console output during tests (optional)
  // console.log = vi.fn();
  // console.warn = vi.fn();
  // console.error = vi.fn();
});

// Global teardown - runs once after all tests
afterAll(() => {
  // Cleanup any global resources
});

// Setup before each test
beforeEach(() => {
  // Reset any global state before each test
});

// Cleanup after each test
afterEach(() => {
  // Clear all mocks after each test
  // vi.clearAllMocks();
});

// Example: Add custom matchers (optional)
// expect.extend({
//   toBeValidEncoded(received: string) {
//     const pass = /^[A-Za-z0-9_-]+$/.test(received);
//     return {
//       pass,
//       message: () => `expected ${received} to be a valid base64url-encoded string`,
//     };
//   },
// });

// Export any shared test utilities
export const testUtils = {
  // Add shared test utilities here
  delay: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
};
