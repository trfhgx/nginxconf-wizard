# nginxconf-wizard

[![npm version](https://img.shields.io/npm/v/nginxconf-wizard.svg)](https://www.npmjs.com/package/nginxconf-wizard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/nginxconf-wizard)](https://nodejs.org/)
[![Build Status](https://img.shields.io/github/actions/workflow/status/trfhgx/nginxconf-wizard/ci.yml)](https://github.com/trfhgx/nginxconf-wizard/actions)
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
- [Discord Community](https://discord.gg/example)
- [Issue Tracker](https://github.com/trfhgx/nginxconf-wizard/issues)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file.

<div align="center">

**Made with love for the Nginx community**

[Star us on GitHub](https://github.com/trfhgx/nginxconf-wizard) •
[Install from npm](https://www.npmjs.com/package/nginxconf-wizard) •
[Read the docs](docs/README.md)

</div>
