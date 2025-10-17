# Contributing to @query-params

Thank you for your interest in contributing to @query-params! We welcome contributions from the community and are excited to work with you.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Code Style Guidelines](#code-style-guidelines)
- [Commit Message Conventions](#commit-message-conventions)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a new branch for your contribution
4. Make your changes
5. Push to your fork
6. Submit a pull request

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm, yarn, or pnpm
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/query-params.git
cd query-params
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run tests to verify everything is working:
```bash
npm test
```

### Project Structure

```
query-params/
├── packages/
│   ├── core/           # Core library (@query-params/core)
│   ├── nextjs/         # Next.js integration
│   ├── react/          # React hooks
│   ├── remix/          # Remix integration
│   ├── sveltekit/      # SvelteKit integration
│   ├── migrations/     # Migration utilities
│   └── router/         # Route encoding
├── examples/           # Example applications
├── docs/              # Documentation
└── tests/             # Integration tests
```

### Development Workflow

1. **Start development mode:**
```bash
npm run dev
```

2. **Run tests in watch mode:**
```bash
npm run test:watch
```

3. **Build all packages:**
```bash
npm run build
```

4. **Lint your code:**
```bash
npm run lint
```

5. **Format code:**
```bash
npm run format
```

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check the [existing issues](https://github.com/yourusername/query-params/issues) to avoid duplicates.

When creating a bug report, use the bug report template and include:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Environment details (OS, Node version, package version)
- Code samples or screenshots if applicable

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Use the feature request template and include:
- A clear, descriptive title
- Detailed description of the proposed feature
- Use cases and benefits
- Possible implementation approach (optional)
- Examples of how the API would be used

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:
- `good first issue` - Good for newcomers
- `help wanted` - Issues where we'd appreciate help
- `documentation` - Documentation improvements

### Pull Requests

1. Ensure your PR addresses an existing issue, or create one first
2. Follow the code style guidelines
3. Include tests for new features or bug fixes
4. Update documentation as needed
5. Ensure all tests pass
6. Update the CHANGELOG.md if applicable

## Pull Request Process

1. **Create a branch** with a descriptive name:
   ```bash
   git checkout -b feature/add-new-encoder
   git checkout -b fix/parsing-bug
   git checkout -b docs/improve-readme
   ```

2. **Make your changes** following our code style guidelines

3. **Write or update tests** to cover your changes

4. **Run the test suite:**
   ```bash
   npm test
   ```

5. **Lint and format your code:**
   ```bash
   npm run lint
   npm run format
   ```

6. **Commit your changes** using conventional commits (see below)

7. **Push to your fork:**
   ```bash
   git push origin feature/add-new-encoder
   ```

8. **Open a Pull Request** with:
   - Clear title and description
   - Reference to related issue(s)
   - Description of changes made
   - Screenshots or examples if applicable

9. **Address review feedback** promptly and professionally

10. **Squash commits** if requested by maintainers

## Code Style Guidelines

### TypeScript

- Use TypeScript for all code
- Enable strict mode
- Prefer interfaces over types for object shapes
- Use descriptive variable and function names
- Add JSDoc comments for public APIs
- Export types alongside implementations

### Code Formatting

We use Prettier with the following configuration:
- 2 spaces for indentation
- Single quotes for strings
- Trailing commas where valid in ES5
- No semicolons
- Line length: 100 characters

Run `npm run format` to auto-format your code.

### Linting

We use ESLint with TypeScript. Run `npm run lint` to check your code.

Key rules:
- No unused variables
- No explicit `any` without justification
- Prefer const over let
- Use arrow functions for callbacks
- No console.log in production code

### Naming Conventions

- **Files**: camelCase for utilities, PascalCase for components
- **Classes**: PascalCase
- **Interfaces/Types**: PascalCase
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Private members**: prefix with underscore `_privateMember`

### Code Organization

- Keep files focused and under 300 lines when possible
- One export per file for main APIs
- Group imports: external, internal, types
- Order class members: static, instance, private

## Commit Message Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, missing semi colons, etc)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools
- `ci`: Changes to CI configuration files and scripts

### Scopes

- `core`: Changes to @query-params/core
- `nextjs`: Changes to Next.js integration
- `react`: Changes to React hooks
- `remix`: Changes to Remix integration
- `sveltekit`: Changes to SvelteKit integration
- `migrations`: Changes to migration utilities
- `router`: Changes to route encoding
- `docs`: Documentation changes
- `examples`: Changes to examples

### Examples

```
feat(core): add support for custom encoders

Allows users to provide custom encoding/decoding functions
for special data types that aren't supported by default.

Closes #123
```

```
fix(nextjs): handle edge runtime encryption correctly

The crypto module wasn't available in edge runtime.
Switch to Web Crypto API for universal compatibility.

Fixes #456
```

```
docs(readme): update installation instructions

Add instructions for pnpm and yarn alternatives.
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for specific package
npm test -- packages/core
```

### Writing Tests

- Write tests for all new features and bug fixes
- Aim for 80%+ code coverage
- Use descriptive test names that explain what is being tested
- Follow the AAA pattern: Arrange, Act, Assert (no need for comments)
- Mock external dependencies
- Test edge cases and error conditions

### Test Structure

```typescript
import { describe, it, expect } from 'vitest'
import { createQueryParams } from '../src'

describe('createQueryParams', () => {
  it('should encode simple objects correctly', () => {
    // Arrange
    const schema = z.object({ name: z.string() })
    const params = createQueryParams(schema)

    // Act
    params.set('name', 'test')
    const encoded = params.toString()

    // Assert
    expect(encoded).toBeTruthy()
    expect(params.parse(encoded)).toEqual({ name: 'test' })
  })

  it('should handle validation errors', () => {
    // Test error cases
  })
})
```

## Documentation

### Code Documentation

- Add JSDoc comments to all public APIs
- Include examples in JSDoc for complex functions
- Document parameters, return values, and thrown errors
- Keep comments up-to-date with code changes

### README and Guides

- Update README.md if you change public APIs
- Add examples to demonstrate new features
- Update the API reference section
- Consider adding guides for complex features

### Changelog

- Add entry to CHANGELOG.md for user-facing changes
- Follow Keep a Changelog format
- Include migration notes for breaking changes

## Community

### Getting Help

- GitHub Discussions for questions and ideas
- GitHub Issues for bugs and feature requests
- Discord/Slack for real-time chat (if available)

### Staying Updated

- Watch the repository for updates
- Follow release notes
- Join our community channels

### Recognition

Contributors are recognized in:
- CHANGELOG.md for their contributions
- README.md contributors section
- GitHub's contributor graph

Thank you for contributing to @query-params! Your efforts help make this library better for everyone.
