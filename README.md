# nginxconf-wizard

🔧 Generate production-ready Nginx configurations in minutes.

## Features

✨ **Smart Config Profiles** - Auto-detect optimal performance settings for your workload
🎯 **Framework Presets** - Instant configs for Next.js, React, WordPress, Laravel, and more
🔍 **Config Validation** - Syntax checking and best practice recommendations
🧪 **nginx -t Wrapper** - Test configs before deployment
📊 **6 Architecture Patterns** - Static, SPA, SSR, Combined, Microservices, Hybrid
🔒 **Security by Default** - SSL/TLS, security headers, rate limiting
⚡ **Performance Optimized** - Profiles for high-traffic, CDN, API gateway, development

## Installation

```bash
npm install -g nginxconf-wizard
```

Or use locally:

```bash
git clone https://github.com/trfhgx/nginxconf-wizard.git
cd nginxconf-wizard
npm install
npm link
```

## Usage

### Generate Configuration (Interactive)

```bash
nginxconf-wizard
```

Or:

```bash
nginxconf-wizard generate
```

### Generate with Preset

```bash
# Use framework preset
nginxconf-wizard generate --preset nextjs
nginxconf-wizard generate --preset react-spa
nginxconf-wizard generate --preset wordpress
nginxconf-wizard generate --preset laravel
nginxconf-wizard generate --preset fastapi
nginxconf-wizard generate --preset django
```

Available presets: `nextjs`, `nuxtjs`, `react-spa`, `vue-spa`, `wordpress`, `laravel`, `fastapi`, `django`, `express`, `static-html`

### Generate with Performance Profile

```bash
# Specify performance profile
nginxconf-wizard generate --profile high-traffic
nginxconf-wizard generate --profile cdn-origin
nginxconf-wizard generate --profile api-gateway
nginxconf-wizard generate --profile low-resource
nginxconf-wizard generate --profile development
```

### Validate Configuration

```bash
# Validate syntax and best practices
nginxconf-wizard validate nginx.conf
```

Checks for:
- Syntax errors (missing semicolons, unmatched braces)
- Common issues (duplicate server_name, missing SSL redirect)
- Security best practices (headers, TLS versions, server_tokens)

### Test Configuration

```bash
# Test with nginx -t
nginxconf-wizard test nginx.conf
```

Runs `nginx -t` and provides helpful error messages.

### Update Existing Config

```bash
# Check for available updates
nginxconf-wizard check-updates

# Apply updates interactively
nginxconf-wizard update

# Auto-apply all updates
nginxconf-wizard update --auto-apply

# Use custom state file location
nginxconf-wizard update --state /path/to/nginx-wizard.json
```

The update system tracks your configuration in `nginx-wizard.json` and recommends:
- **Security updates**: Outdated TLS versions, missing security headers, rate limiting
- **Performance updates**: HTTP/3, compression, caching optimizations
- **Feature updates**: DDoS protection, CORS, new capabilities

### Analyze Logs

```bash
# Analyze access logs
nginxconf-wizard analyze-logs /var/log/nginx/access.log

# Analyze error logs
nginxconf-wizard analyze-logs /var/log/nginx/error.log --type error

# Analyze both
nginxconf-wizard analyze-logs access.log --error error.log
```

Provides insights on:
- Status code distribution (2xx, 4xx, 5xx rates)
- Response time statistics (avg, median, P95, P99)
- Top requested paths
- Bot traffic detection
- Security issues (SQL injection, path traversal attempts)
- Performance and security recommendations

### Analyze Benchmarks

```bash
# Analyze wrk results
nginxconf-wizard analyze-benchmark results.txt

# Specify tool explicitly
nginxconf-wizard analyze-benchmark results.txt --tool wrk

# Auto-apply recommendations (coming soon)
nginxconf-wizard analyze-benchmark results.txt --apply
```

Supports benchmark tools:
- **wrk** - Modern HTTP benchmarking tool
- **ab** (ApacheBench) - Apache HTTP server benchmarking
- **k6** - Modern load testing tool
- **autocannon** - Node.js HTTP benchmarking
- **siege** - HTTP load testing and benchmarking

Provides:
- Performance grade (A-F)
- Latency analysis (avg, P95, P99)
- Throughput metrics
- Error rate analysis
- Actionable recommendations for nginx tuning

## Performance Profiles

The wizard automatically suggests the best profile for your architecture:

- **Balanced** - Good defaults for most sites
- **High-Traffic** - Optimized for high concurrency (2048 connections)
- **Low-Resource** - Minimal resource usage (512 connections)
- **CDN Origin** - Behind Cloudflare/CDN (long keepalive, no compression)
- **API Gateway** - High upstream connections with proxy buffering
- **Static Site** - Optimized file serving with open_file_cache
- **Development** - Fast reloads, minimal resources

## Architecture Patterns

### 1. Static-Only
Pure static files (HTML, CSS, JS). Perfect for:
- Static websites
- Landing pages
- Documentation sites

### 2. SPA + API
Single Page App with separate API backend. Perfect for:
- React/Vue/Angular apps
- API proxying
- CORS configuration

### 3. SSR + API
Server-Side Rendered frameworks. Perfect for:
- Next.js
- Nuxt.js
- SvelteKit

### 4. Combined Server
Fullstack apps on one server. Perfect for:
- WordPress + PHP-FPM
- Laravel + PHP-FPM
- Django + Gunicorn
- Express.js

### 5. Microservices
API gateway for multiple services. Perfect for:
- Service mesh
- Multiple backend APIs
- Per-service routing and rate limiting

### 6. Hybrid
Mix of static and dynamic content. Perfect for:
- Partially static sites
- Mixed content delivery

## Quick Example

```bash
$ nginxconf-wizard

? Would you like to use a framework preset for quick setup? Yes
? Choose a preset: Next.js

✓ Next.js preset loaded
  You can still customize the configuration in the following steps.

? Choose your architecture pattern: SSR + API - Server-Side Rendered (Next.js, Nuxt)
? Primary domain name: myapp.com
? Add domain aliases: No
? Enable SSL/TLS (HTTPS)? Yes
? SSL certificate provider: Let's Encrypt
? Enable HTTP/2? Yes
? Enable HTTP/3 (QUIC)? No
? Performance profile: (suggested: api-gateway) api-gateway
? Enable browser caching? Yes
? Add security headers? Yes
? Enable rate limiting? Yes
? Enable Gzip compression? Yes

✅ Configuration generated successfully!

Files created:
  nginx.conf
  nginx-wizard.json

Next steps:
  1. Review the generated configuration
  2. Test: nginx -t -c nginx.conf
  3. Setup SSL: certbot --nginx -d myapp.com
  4. Deploy: sudo cp nginx.conf /etc/nginx/sites-available/myapp.com
  5. Enable: sudo ln -s /etc/nginx/sites-available/myapp.com /etc/nginx/sites-enabled/
  6. Reload: sudo nginx -s reload
```

## Output Files

- **nginx.conf** - Your nginx configuration
- **nginx-wizard.json** - State file for managed updates (Phase 2/3)

## Requirements

- Node.js 18+
- nginx 1.18+ (optional, for `test` command)

## Development

### Local Setup

Clone and set up the project for local development:

```bash
# Clone the repository
git clone https://github.com/trfhgx/nginxconf-wizard.git
cd nginxconf-wizard

# Install dependencies
npm install

# Link for local development (allows you to run `nginxconf-wizard` globally)
npm link

# Now you can use it locally
nginxconf-wizard --help
```

### Running Locally

After linking with `npm link`, you can run the wizard from anywhere:

```bash
# Interactive mode (recommended)
nginxconf-wizard

# Or use the generate command
nginxconf-wizard generate

# With a preset
nginxconf-wizard generate --preset nextjs

# With a performance profile
nginxconf-wizard generate --profile high-traffic

# Validate a configuration
nginxconf-wizard validate nginx.conf

# Test with nginx
nginxconf-wizard test nginx.conf
```

### Development Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (during development)
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Lint code (check for issues)
npm run lint

# Lint and auto-fix issues
npm run lint -- --fix

# Format code (if formatter is configured)
npm run format

# Run a single test file
npm test -- ConfigBuilder.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="SSL configuration"
```

### Testing Your Changes

After making changes to the code:

```bash
# 1. Run tests to ensure nothing broke
npm test

# 2. Fix any linting issues
npm run lint -- --fix

# 3. Generate a test config to verify output
nginxconf-wizard generate --preset nextjs

# 4. Validate the generated config
nginxconf-wizard validate nginx.conf

# 5. Test with nginx (requires nginx installed)
nginxconf-wizard test nginx.conf
```

### Project Structure

```
nginxconf-wizard/
├── src/
│   ├── cli/              # CLI commands and wizard
│   │   ├── index.js      # Main CLI entry point
│   │   └── Wizard.js     # Interactive wizard
│   ├── core/             # Core functionality
│   │   ├── ConfigBuilder.js      # Main config builder
│   │   ├── TemplateEngine.js     # Handlebars template engine
│   │   ├── Validator.js          # Config validation
│   │   ├── SmartConfigManager.js # Performance profiles
│   │   ├── CacheManager.js       # Caching strategies (Phase 2)
│   │   ├── DDoSProtection.js     # DDoS protection (Phase 2)
│   │   └── ConflictDetector.js   # Conflict detection (Phase 2)
│   ├── presets/          # Framework presets
│   └── utils/            # Utility functions
├── templates/            # Handlebars templates
│   └── patterns/         # Pattern-specific templates
├── tests/                # Jest test suites
├── docs/                 # Comprehensive documentation
└── package.json
```

### Debugging

Enable debug output during development:

```bash
# Set debug environment variable (if implemented)
DEBUG=nginxconf-wizard:* nginxconf-wizard generate

# Or run with Node.js debugging
node --inspect bin/nginxconf-wizard.js generate
```

### Adding New Features

1. **Create/modify core module** in `src/core/`
2. **Add tests** in `tests/` (aim for >80% coverage)
3. **Update templates** in `templates/patterns/` if needed
4. **Update documentation** in `docs/`
5. **Run test suite**: `npm test`
6. **Test manually**: Generate configs with your changes

### Contributing

When submitting changes:

```bash
# 1. Create a feature branch
git checkout -b feature/my-new-feature

# 2. Make your changes
# ... edit files ...

# 3. Run tests and linting
npm test
npm run lint -- --fix

# 4. Commit changes
git add .
git commit -m "feat: add new feature"

# 5. Push and create PR
git push origin feature/my-new-feature
```

### Commit Message Convention

Follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Adding/updating tests
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `chore:` - Build/tooling changes

Examples:
```bash
git commit -m "feat: add HTTP/3 support"
git commit -m "fix: resolve port conflict detection"
git commit -m "docs: update SSL configuration guide"
git commit -m "test: add CacheManager test suite"
```

### Unlink Development Version

When you're done with local development:

```bash
# Unlink the local version
npm unlink

# Or unlink globally
npm unlink -g nginxconf-wizard

# Then reinstall the published version (when available)
npm install -g nginxconf-wizard
```

## License

MIT
