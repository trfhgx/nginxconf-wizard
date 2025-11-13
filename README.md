# nginxconf-wizard

🔧 Generate production-ready Nginx configurations in minutes.

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

### Generate with Options

```bash
# Specify output directory
nginxconf-wizard generate -o ./nginx-config

# Use performance profile
nginxconf-wizard generate --profile high-traffic

# Use preset (coming soon)
nginxconf-wizard generate --preset nextjs-production
```

### Update Existing Config (Coming Soon)

```bash
nginxconf-wizard update
```

### Check for Updates (Coming Soon)

```bash
nginxconf-wizard check-updates
```

### Analyze Logs (Coming Soon)

```bash
nginxconf-wizard analyze-logs /var/log/nginx/access.log
```

### Analyze Benchmarks (Coming Soon)

```bash
nginxconf-wizard analyze-benchmark results.txt
```

## Quick Example

```bash
$ nginxconf-wizard

? Choose your architecture pattern: Static-Only
? Primary domain name: example.com
? Add domain aliases: Yes
? Domain aliases: www.example.com
? Enable SSL/TLS (HTTPS)? Yes
? SSL certificate provider: Let's Encrypt
? Enable HTTP/2? Yes
? Enable HTTP/3 (QUIC)? No
? Performance profile: Balanced
? Enable browser caching? Yes
? Add security headers? Yes
? Enable rate limiting? No
? Enable Gzip compression? Yes

✅ Configuration generated successfully!

Files created:
  nginx.conf
  nginx-wizard.json
```

## Output Files

- **nginx.conf** - Your nginx configuration
- **nginx-wizard.json** - State file for future updates

## Requirements

- Node.js 18+
- nginx 1.18+

## License

MIT
