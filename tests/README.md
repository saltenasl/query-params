# Testing Infrastructure

This directory contains the global test setup and configuration for the encoded-state monorepo.

## Test Configuration Files

### Root Configuration Files

- **`vitest.config.ts`** - Base Vitest configuration for the entire monorepo
  - Test environment: Node.js by default
  - Globals enabled (no need to import `describe`, `it`, `expect`)
  - Coverage provider: v8
  - Coverage reporters: text, json, html
  - Coverage threshold: 90% (lines, functions, branches, statements)

- **`vitest.workspace.ts`** - Workspace configuration for monorepo testing
  - Supports testing all packages or individual packages
  - Each package can override the base configuration
  - Enables parallel testing across packages

- **`tests/setup.ts`** - Global test setup file
  - Runs once before all tests
  - Configure global test environment
  - Add custom matchers
  - Set up shared test utilities

## Running Tests

### Run all tests
```bash
pnpm test
```

### Run tests in watch mode
```bash
pnpm test:watch
# or
pnpm dev
```

### Run tests with UI
```bash
pnpm test:ui
```

### Run tests with coverage report
```bash
pnpm test:coverage
```

### Run tests for a specific package (when packages are created)
```bash
# Using Vitest workspace filtering
pnpm test --project core
pnpm test --project react

# Or filter by path
pnpm test packages/core
```

### Run a specific test file
```bash
pnpm test packages/core/tests/encode.test.ts
```

### Run tests matching a pattern
```bash
pnpm test -t "encode"
```

## Test Environments

### Node.js Environment (Default)
Most packages use the Node.js environment by default. This is suitable for:
- Core encoding/decoding logic
- Compression utilities
- Server-side packages (Next.js, Remix, SvelteKit)

### Browser Environment (jsdom/happy-dom)
Packages that need browser APIs can override the environment in their `vitest.config.ts`:

```typescript
// packages/react/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // or 'happy-dom'
  },
});
```

This is suitable for:
- React components
- Browser-specific APIs (Web Crypto, localStorage)
- DOM manipulation

## Package-Specific Configuration

Each package can have its own `vitest.config.ts` to override settings:

```typescript
// packages/core/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Override environment for this package
    environment: 'node',

    // Package-specific globals
    globals: true,

    // Package-specific coverage thresholds
    coverage: {
      thresholds: {
        lines: 95, // Higher threshold for core package
      },
    },
  },
});
```

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:
- **`coverage/index.html`** - HTML report (open in browser)
- **`coverage/coverage-final.json`** - JSON report
- **`coverage/lcov.info`** - LCOV report (for CI/CD)

Coverage thresholds are enforced at **90%** for:
- Lines
- Functions
- Branches
- Statements

Tests will fail if coverage falls below this threshold.

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest';

describe('MyFeature', () => {
  it('should do something', () => {
    const result = myFunction();
    expect(result).toBe(expectedValue);
  });
});
```

### Using Globals (Recommended)

With `globals: true`, you don't need to import test functions:

```typescript
describe('MyFeature', () => {
  it('should do something', () => {
    const result = myFunction();
    expect(result).toBe(expectedValue);
  });
});
```

### Test Organization

```
packages/core/
├── src/
│   ├── encoder.ts
│   └── decoder.ts
└── tests/
    ├── encoder.test.ts
    └── decoder.test.ts
```

### Shared Test Utilities

Use the `testUtils` exported from `tests/setup.ts`:

```typescript
import { testUtils } from '@/tests/setup';

it('should wait for async operation', async () => {
  await testUtils.delay(100);
  // test code
});
```

## Best Practices

1. **Use descriptive test names** - Test names should clearly describe what is being tested
2. **One assertion per test** - Keep tests focused and easy to debug
3. **Use `beforeEach` for setup** - Reset state before each test
4. **Mock external dependencies** - Use `vi.mock()` to mock modules
5. **Test edge cases** - Don't just test the happy path
6. **Aim for >90% coverage** - But don't write tests just for coverage

## Troubleshooting

### Tests not running
- Ensure test files match the pattern: `**/*.{test,spec}.{ts,tsx}`
- Check that the package is included in `pnpm-workspace.yaml`

### Coverage too low
- Run `pnpm test:coverage` to see which lines are not covered
- Add tests for uncovered branches and edge cases

### Environment issues
- Node.js tests failing with browser APIs: Use `jsdom` or `happy-dom` environment
- Browser tests failing with Node.js APIs: Use `node` environment

### Watch mode not working
- Try running `pnpm test:watch` directly
- Check for file system issues (permissions, etc.)
