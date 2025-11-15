# nginxconf-wizard

[![npm version](https://img.shields.io/npm/v/nginxconf-wizard.svg)](https://www.npmjs.com/package/nginxconf-wizard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/nginxconf-wizard)](https://nodejs.org/)
[![Build Status](https://img.shields.io/github/actions/workflow/status/trfhgx/nginxconf-wizard/ci.yml)](https://github.com/trfhgx/nginxconf-wizard/actions)

Generate production-ready Nginx configurations with intelligent performance profiles and framework presets.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Examples](#examples)
- [Architecture Patterns](#architecture-patterns)
- [Performance Profiles](#performance-profiles)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Smart Configuration Profiles**: Automatically detect and apply optimal performance settings based on workload
- **Framework Presets**: Ready-to-use configurations for popular frameworks (Next.js, React, WordPress, Laravel, etc.)
- **Configuration Validation**: Comprehensive syntax checking and best practice recommendations
- **Nginx Testing**: Built-in `nginx -t` wrapper with enhanced error reporting
- **Security Hardening**: SSL/TLS configuration, security headers, and rate limiting by default
- **Performance Optimization**: Tuned profiles for high-traffic, CDN, API gateway, and development environments
- **Log Analysis**: Access and error log parsing with actionable insights
- **Benchmark Analysis**: Performance analysis for wrk, ApacheBench, k6, and other tools

## Installation

### Global Installation

```bash
npm install -g nginxconf-wizard
```

### Local Development

```bash
git clone https://github.com/trfhgx/nginxconf-wizard.git
cd nginxconf-wizard
npm install
npm link
```

## Quick Start

Generate a configuration interactively:

```bash
nginxconf-wizard
```

Generate with a framework preset:

```bash
nginxconf-wizard generate --preset nextjs
```

Validate an existing configuration:

```bash
nginxconf-wizard validate nginx.conf
```

## Usage

### Generate Configuration

```bash
nginxconf-wizard generate [options]
```

**Options:**
- `--preset <name>`: Use a framework preset (nextjs, react-spa, wordpress, laravel, etc.)
- `--profile <name>`: Apply a performance profile (high-traffic, cdn-origin, api-gateway, etc.)
- `--output <file>`: Specify output file (default: nginx.conf)

### Validate Configuration

```bash
nginxconf-wizard validate <config-file>
```

Checks for syntax errors, security issues, and best practices.

### Test Configuration

```bash
nginxconf-wizard test <config-file>
```

Runs `nginx -t` with enhanced error reporting.

### Update Configuration

```bash
nginxconf-wizard update [options]
```

**Options:**
- `--auto-apply`: Apply all recommended updates automatically
- `--state <file>`: Use custom state file location (default: nginx-wizard.json)

### Analyze Logs

```bash
nginxconf-wizard analyze-logs <log-file> [options]
```

**Options:**
- `--type <type>`: Log type (access or error)
- `--error <file>`: Error log file for combined analysis

### Analyze Benchmarks

```bash
nginxconf-wizard analyze-benchmark <results-file> [options]
```

**Options:**
- `--tool <name>`: Benchmark tool (wrk, ab, k6, autocannon, siege)
- `--apply`: Auto-apply performance recommendations

## Examples

### Next.js Application

```bash
nginxconf-wizard generate --preset nextjs --profile api-gateway
```

### React SPA with API

```bash
nginxconf-wizard generate --preset react-spa
```

### WordPress Site

```bash
nginxconf-wizard generate --preset wordpress --profile high-traffic
```

### Laravel Application

```bash
nginxconf-wizard generate --preset laravel
```

### Static Website

```bash
nginxconf-wizard generate --preset static-html --profile cdn-origin
```

## Architecture Patterns

The wizard supports six distinct architecture patterns:

1. **Static-Only**: Pure static file serving optimized for HTML, CSS, and JavaScript
2. **SPA + API**: Single Page Applications with separate API backends
3. **SSR + API**: Server-Side Rendered applications with API integration
4. **Combined Server**: Full-stack applications on a single server
5. **Microservices**: API gateway configuration for multiple backend services
6. **Hybrid**: Mixed static and dynamic content delivery

## Performance Profiles

Choose the optimal profile for your use case:

- **Balanced**: Default settings suitable for most applications
- **High-Traffic**: Optimized for high concurrency (2048+ connections)
- **Low-Resource**: Minimal resource usage for constrained environments
- **CDN Origin**: Configuration for servers behind Cloudflare or similar CDNs
- **API Gateway**: High upstream connection handling with proxy buffering
- **Static Site**: Optimized file serving with aggressive caching
- **Development**: Fast reloads and minimal resource allocation

## Requirements

- Node.js 18 or higher
- Nginx 1.18 or higher (optional, required for testing)

## Development

### Setup

```bash
git clone https://github.com/trfhgx/nginxconf-wizard.git
cd nginxconf-wizard
npm install
npm link
```

### Testing

```bash
npm test                    # Run test suite
npm run lint               # Check code style
npm run lint -- --fix      # Auto-fix linting issues
```

### Project Structure

```
nginxconf-wizard/
├── src/
│   ├── cli/               # Command-line interface
│   ├── core/              # Core functionality
│   ├── presets/           # Framework presets
│   └── utils/             # Utility functions
├── templates/             # Configuration templates
├── tests/                 # Test suites
└── docs/                  # Documentation
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
