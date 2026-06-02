# nginxconf-wizard

[![npm version](https://img.shields.io/npm/v/nginxconf-wizard.svg)](https://www.npmjs.com/package/nginxconf-wizard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/nginxconf-wizard)](https://nodejs.org/)
[![Downloads](https://img.shields.io/npm/dm/nginxconf-wizard.svg)](https://www.npmjs.com/package/nginxconf-wizard)
[![GitHub stars](https://img.shields.io/github/stars/trfhgx/nginxconf-wizard.svg)](https://github.com/trfhgx/nginxconf-wizard/stargazers)

<div align="center">

## Intelligent Nginx Configuration Generator

*Generate production-ready Nginx configurations with (Upcoming) AI-powered performance profiles and framework presets*


</div>

---

## Features

<table>
<tr>
<td>

### Smart Configuration
- **AI-Powered Profiles**: Automatically detect and apply optimal performance settings
- **Framework Presets**: Ready-to-use configs for Next.js, React, WordPress, Laravel, etc.
- **Configuration Validation**: Comprehensive syntax checking and best practice recommendations
- **Nginx Testing**: Built-in `nginx -t` wrapper with enhanced error reporting

</td>
<td>

### Security & Performance
- **Security Hardening**: SSL/TLS, security headers, and rate limiting by default
- **Performance Optimization**: Tuned profiles for high-traffic, CDN, API gateway environments
- **Log Analysis**: Access and error log parsing with actionable insights
- **Benchmark Analysis**: Performance analysis for wrk, ApacheBench, k6, and other tools

</td>
</tr>
</table>


---

## Installation

### Global Installation (Recommended)
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

### Verify Installation
```bash
nginxconf-wizard --version
```

---

## Quick Start

### Interactive Wizard
```bash
nginxconf-wizard
```
*Follow the prompts to generate your first configuration!*

### Framework Presets
```bash
# Next.js Application
nginxconf-wizard generate --preset nextjs --profile api-gateway

# React SPA with API
nginxconf-wizard generate --preset react-spa

# WordPress Site
nginxconf-wizard generate --preset wordpress --profile high-traffic
```

### Validate Configuration
```bash
nginxconf-wizard validate nginx.conf
```

---

## Usage

### Generate Configuration

```bash
nginxconf-wizard generate [options]
```

| Option | Description | Example |
|--------|-------------|---------|
| `--preset <name>` | Framework preset | `--preset nextjs` |
| `--profile <name>` | Performance profile | `--profile high-traffic` |
| `--output <file>` | Output file | `--output my-nginx.conf` |

### Available Presets
- `nextjs` - Next.js applications
- `react-spa` - React Single Page Apps
- `wordpress` - WordPress sites
- `laravel` - Laravel applications
- `static-html` - Static websites
- `fastapi` - FastAPI backends

### Performance Profiles
- `balanced` - Default settings
- `high-traffic` - 2048+ connections
- `low-resource` - Constrained environments
- `cdn-origin` - Behind Cloudflare
- `api-gateway` - High upstream connections

### Advanced Commands

```bash
# Update existing configuration
nginxconf-wizard update --auto-apply

# Analyze logs for insights
nginxconf-wizard analyze-logs /var/log/nginx/access.log

# Benchmark analysis
nginxconf-wizard analyze-benchmark results.txt --apply

# Test configuration
nginxconf-wizard test nginx.conf
```


---

## Roadmap

### Phase 1: Stabilize the Nginx Core

* [x] Interactive CLI wizard
* [x] Core Nginx configuration generation
* [x] SSL/TLS configuration
* [x] Reverse proxy support
* [x] Framework presets
* [x] Security headers and rate limiting
* [x] Performance profiles
* [x] `nginx -t` testing wrapper
* [ ] Expand generated config test fixtures
* [ ] Add snapshot tests for every preset/profile combination
* [ ] Improve error messages for invalid configs
* [ ] Add CI checks for generated Nginx configs

### Phase 2: Safer Update Workflow

* [ ] Add config diff preview before applying changes
* [ ] Add automatic backup before config updates
* [ ] Add rollback command
* [ ] Add dry-run mode
* [ ] Add warnings for destructive or risky changes
* [ ] Add config explanation output
* [ ] Add safer defaults for production deployments

### Phase 3: Log and Benchmark Analysis

* [ ] Parse Nginx access logs
* [ ] Parse Nginx error logs
* [ ] Detect common upstream failures
* [ ] Detect slow routes and high-error endpoints
* [ ] Analyze benchmark output from `wrk`
* [ ] Analyze benchmark output from ApacheBench
* [ ] Analyze benchmark output from k6
* [ ] Recommend safer performance profile changes
* [ ] Generate before/after tuning reports

### Phase 4: Agentic Configuration Analysis

* [ ] Build an agentic analysis mode for complex config review
* [ ] Add deterministic rule checks as safety boundaries
* [ ] Detect hidden interactions between directives
* [ ] Detect risky combinations involving caching, proxying, headers, TLS, buffers, and timeouts
* [ ] Use logs, benchmarks, and deployment context to improve recommendations
* [ ] Validate AI-generated suggestions before showing them to users
* [ ] Add test cases for known dangerous configuration patterns

### Phase 5: Multi-Server Support

* [ ] Refactor the config engine to support multiple server backends
* [ ] Add server adapter interface
* [ ] Add Caddy support
* [ ] Add Apache support
* [ ] Add Traefik support
* [ ] Add HAProxy support
* [ ] Add OpenResty support
* [ ] Add comparison mode to help users choose the right server

### Phase 6: Plugin System and Community Presets

* [ ] Add plugin API for new web servers
* [ ] Add plugin API for framework presets
* [ ] Add custom validation rules
* [ ] Add custom organization presets
* [ ] Add community deployment recipes
* [ ] Add preset publishing guidelines
* [ ] Add contribution templates for new adapters

### Phase 7: Developer Experience

* [ ] Improve documentation
* [ ] Add beginner deployment guides
* [ ] Add advanced production guides
* [ ] Add troubleshooting examples
* [ ] Add real-world deployment examples
* [ ] Add more CLI examples
* [ ] Improve npm package metadata
* [ ] Add demo videos or GIFs


## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Quality
- ESLint configuration
- Jest test coverage
- Prettier formatting
- Conventional commits

---

## Requirements

- **Node.js**: 18.0.0 or higher
- **Nginx**: 1.18.0 or higher (optional, for testing)
---


### Getting Help
- [Documentation](docs/README.md)
- [Issue Tracker](https://github.com/trfhgx/nginxconf-wizard/issues)
ALso checkout
- [Troubleshoot](docsp/troubleshooting.md)
- [Roadmap](ROADMAP.md)
---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file.

<div align="center">

**Made with love for the Nginx community**

[Star us on GitHub](https://github.com/trfhgx/nginxconf-wizard) •
[Install from npm](https://www.npmjs.com/package/nginxconf-wizard) •
[Read the docs](docs/README.md)

</div>
