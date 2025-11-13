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

### Update Existing Config (Coming in Phase 2/3)

```bash
nginxconf-wizard update
```

### Analyze Logs (Coming in Phase 4)

```bash
nginxconf-wizard analyze-logs /var/log/nginx/access.log
```

### Analyze Benchmarks (Coming in Phase 3)

```bash
nginxconf-wizard analyze-benchmark results.txt
```

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

```bash
# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## License

MIT
