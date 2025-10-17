# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report security vulnerabilities by email to:

**security@example.com** (Update this with your actual security contact)

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information:

- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue

## Security Considerations

When using this library:

1. **Encryption Keys**: Store encryption keys securely (environment variables, secret managers)
2. **Key Length**: Use minimum 32 bytes (256 bits) for AES-256-GCM encryption
3. **Server-Side Only**: Never expose encryption keys to the client
4. **HTTPS**: Always use HTTPS when transmitting encoded state
5. **Input Validation**: Validate decoded data before use
6. **Version Management**: Keep the library updated to receive security patches

## Disclosure Policy

When we receive a security report, we will:

1. Confirm the issue and determine affected versions
2. Audit code to find similar issues
3. Prepare fixes for all supported versions
4. Release new versions with fixes
5. Publicly disclose the vulnerability after fixes are available

Thank you for helping keep encoded-state and our users safe!
