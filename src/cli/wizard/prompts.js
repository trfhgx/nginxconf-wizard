import inquirer from 'inquirer';
import chalk from 'chalk';

/**
 * Global settings prompts
 */
export async function promptGlobalSettings() {
  return inquirer.prompt([
    {
      type: 'list',
      name: 'workerProcesses',
      message: 'Worker processes:',
      choices: [
        { name: 'auto (recommended - one per CPU core)', value: 'auto' },
        { name: '1 (single process)', value: 1 },
        { name: '2', value: 2 },
        { name: '4', value: 4 },
        { name: '8', value: 8 },
        { name: 'Custom', value: 'custom' }
      ],
      default: 'auto'
    },
    {
      type: 'number',
      name: 'customWorkers',
      message: 'Enter number of workers:',
      when: a => a.workerProcesses === 'custom',
      validate: n => n > 0 && n <= 128 ? true : 'Must be between 1 and 128'
    },
    {
      type: 'number',
      name: 'workerConnections',
      message: 'Worker connections:',
      default: 1024
    },
    {
      type: 'confirm',
      name: 'compression',
      message: 'Enable gzip compression globally?',
      default: true
    },
    {
      type: 'confirm',
      name: 'securityHeaders',
      message: 'Add security headers by default?',
      default: true
    }
  ]);
}

/**
 * Server configuration prompts
 */
export async function promptServerConfig(validator) {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'domain',
      message: 'Domain name:',
      default: 'example.com',
      validate: input => {
        validator.clear();
        return validator.validateDomain(input) || validator.getErrors()[0];
      }
    },
    {
      type: 'input',
      name: 'aliases',
      message: `Domain aliases ${chalk.dim('(comma-separated, empty for none)')}:`,
      default: '',
      filter: input => input ? input.split(',').map(s => s.trim()).filter(Boolean) : []
    },
    {
      type: 'confirm',
      name: 'ssl',
      message: 'Enable SSL/HTTPS?',
      default: true
    },
    {
      type: 'list',
      name: 'sslProvider',
      message: 'SSL certificate provider:',
      when: a => a.ssl,
      choices: [
        { name: "Let's Encrypt (recommended)", value: 'letsencrypt' },
        { name: 'Cloudflare Origin Certificate', value: 'cloudflare' },
        { name: 'Custom certificate', value: 'custom' },
        { name: 'Self-signed (development only)', value: 'self-signed' }
      ],
      default: 'letsencrypt'
    },
    {
      type: 'confirm',
      name: 'http2',
      message: 'Enable HTTP/2?',
      when: a => a.ssl,
      default: true
    }
  ]);
}

/**
 * Location type selection
 */
export async function promptLocationType() {
  const { type } = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: 'Location type:',
      choices: [
        { name: '📁 Static files - Serve files from a directory', value: 'static' },
        { name: '🎯 SPA fallback - Single Page App (fallback to index.html)', value: 'spa' },
        { name: '↗️  Proxy pass - Forward requests to backend server', value: 'proxy' },
        { name: '⚡ API endpoint - API with optional CORS & rate limiting', value: 'api' },
        { name: '🔌 WebSocket - WebSocket connection support', value: 'websocket' },
        { name: '↪️  Redirect - Redirect to another URL', value: 'redirect' },
        { name: '💚 Health check - Health check endpoint', value: 'health' },
        { name: '💾 Cached proxy - Proxy with caching', value: 'cache' },
        { name: '📍 Custom - Custom location block', value: 'custom' }
      ]
    }
  ]);
  return type;
}

/**
 * Static location prompts
 */
export async function promptStaticLocation() {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'path',
      message: 'Location path:',
      default: '/'
    },
    {
      type: 'input',
      name: 'root',
      message: 'Root directory:',
      default: '/var/www/html'
    },
    {
      type: 'input',
      name: 'index',
      message: `Index files ${chalk.dim('(space-separated)')}:`,
      default: 'index.html index.htm'
    },
    {
      type: 'confirm',
      name: 'autoindex',
      message: 'Enable directory listing?',
      default: false
    },
    {
      type: 'confirm',
      name: 'caching',
      message: 'Enable browser caching for assets?',
      default: true
    },
    {
      type: 'input',
      name: 'cacheExpires',
      message: 'Cache duration:',
      default: '1y',
      when: a => a.caching
    }
  ]);
}

/**
 * SPA location prompts
 */
export async function promptSPALocation() {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'path',
      message: 'Location path:',
      default: '/'
    },
    {
      type: 'input',
      name: 'root',
      message: 'Root directory (where index.html is):',
      default: '/var/www/html'
    },
    {
      type: 'input',
      name: 'fallback',
      message: 'Fallback file:',
      default: '/index.html'
    },
    {
      type: 'confirm',
      name: 'caching',
      message: 'Enable asset caching?',
      default: true
    }
  ]);
}

/**
 * Proxy location prompts
 */
export async function promptProxyLocation(upstreamChoices) {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'path',
      message: 'Location path:',
      default: '/'
    },
    {
      type: 'list',
      name: 'target',
      message: 'Proxy target:',
      choices: upstreamChoices
    },
    {
      type: 'input',
      name: 'directUrl',
      message: 'Backend URL (e.g., http://localhost:3000):',
      when: a => a.target.type === 'direct',
      validate: input => input.startsWith('http://') || input.startsWith('https://') ? true : 'URL must start with http:// or https://'
    },
    {
      type: 'confirm',
      name: 'websocket',
      message: 'Support WebSocket upgrade?',
      default: false
    },
    {
      type: 'number',
      name: 'timeout',
      message: 'Proxy timeout (seconds):',
      default: 60
    }
  ]);
}

/**
 * API location prompts
 */
export async function promptAPILocation(upstreamChoices) {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'path',
      message: 'API path:',
      default: '/api'
    },
    {
      type: 'list',
      name: 'target',
      message: 'API backend:',
      choices: upstreamChoices
    },
    {
      type: 'input',
      name: 'directUrl',
      message: 'Backend URL:',
      when: a => a.target.type === 'direct',
      default: 'http://localhost:3000'
    },
    {
      type: 'confirm',
      name: 'cors',
      message: 'Enable CORS?',
      default: true
    },
    {
      type: 'input',
      name: 'corsOrigin',
      message: 'CORS allowed origin (* for all):',
      when: a => a.cors,
      default: '*'
    },
    {
      type: 'confirm',
      name: 'rateLimit',
      message: 'Enable rate limiting?',
      default: true
    },
    {
      type: 'input',
      name: 'rateLimitValue',
      message: 'Rate limit (e.g., 100r/s):',
      when: a => a.rateLimit,
      default: '100r/s'
    },
    {
      type: 'number',
      name: 'rateLimitBurst',
      message: 'Burst allowance:',
      when: a => a.rateLimit,
      default: 20
    }
  ]);
}

/**
 * WebSocket location prompts
 */
export async function promptWebSocketLocation(upstreamChoices) {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'path',
      message: 'WebSocket path:',
      default: '/ws'
    },
    {
      type: 'list',
      name: 'target',
      message: 'WebSocket backend:',
      choices: upstreamChoices
    },
    {
      type: 'input',
      name: 'directUrl',
      message: 'Backend URL:',
      when: a => a.target.type === 'direct',
      default: 'http://localhost:3000'
    },
    {
      type: 'number',
      name: 'timeout',
      message: 'Connection timeout (seconds, 0 for no timeout):',
      default: 3600
    }
  ]);
}

/**
 * Redirect location prompts
 */
export async function promptRedirectLocation() {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'path',
      message: 'Source path (use ~ for regex):',
      default: '/old-path'
    },
    {
      type: 'input',
      name: 'destination',
      message: 'Redirect destination:',
      default: '/new-path'
    },
    {
      type: 'list',
      name: 'code',
      message: 'Redirect type:',
      choices: [
        { name: '301 - Permanent redirect', value: 301 },
        { name: '302 - Temporary redirect', value: 302 },
        { name: '307 - Temporary (preserve method)', value: 307 },
        { name: '308 - Permanent (preserve method)', value: 308 }
      ],
      default: 301
    }
  ]);
}

/**
 * Health check location prompts
 */
export async function promptHealthLocation() {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'path',
      message: 'Health check path:',
      default: '/health'
    },
    {
      type: 'input',
      name: 'response',
      message: 'Response body:',
      default: 'OK'
    },
    {
      type: 'confirm',
      name: 'noLog',
      message: 'Disable access logging for health checks?',
      default: true
    }
  ]);
}

/**
 * Cached proxy location prompts
 */
export async function promptCacheSettings() {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'cacheDuration',
      message: 'Cache duration:',
      default: '10m'
    },
    {
      type: 'input',
      name: 'cacheZone',
      message: 'Cache zone name:',
      default: 'proxy_cache'
    },
    {
      type: 'confirm',
      name: 'bypassCookie',
      message: 'Bypass cache for requests with session cookies?',
      default: true
    }
  ]);
}

/**
 * Upstream configuration prompts
 */
export async function promptUpstreamConfig() {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Upstream name:',
      default: 'backend',
      validate: input => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(input) ? true : 'Invalid upstream name'
    },
    {
      type: 'input',
      name: 'servers',
      message: `Backend servers ${chalk.dim('(comma-separated, e.g., localhost:3000,localhost:3001)')}:`,
      default: 'localhost:3000',
      filter: input => input.split(',').map(s => {
        const parts = s.trim().split(':');
        return { host: parts[0], port: parseInt(parts[1]) || 3000 };
      })
    },
    {
      type: 'list',
      name: 'loadBalancing',
      message: 'Load balancing method:',
      choices: [
        { name: 'Round Robin (default)', value: 'round_robin' },
        { name: 'Least Connections', value: 'least_conn' },
        { name: 'IP Hash (sticky sessions)', value: 'ip_hash' },
        { name: 'Random', value: 'random' }
      ],
      default: 'round_robin'
    },
    {
      type: 'number',
      name: 'keepalive',
      message: 'Keepalive connections:',
      default: 32
    },
    {
      type: 'number',
      name: 'maxFails',
      message: 'Max fails before marking server down:',
      default: 3
    },
    {
      type: 'number',
      name: 'failTimeout',
      message: 'Fail timeout (seconds):',
      default: 30
    }
  ]);
}

/**
 * Domain edit prompts
 */
export async function promptDomainEdit(currentDomain) {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'domain',
      message: 'Domain name:',
      default: currentDomain.primary
    },
    {
      type: 'input',
      name: 'aliases',
      message: 'Domain aliases (comma-separated):',
      default: currentDomain.aliases?.join(', ') || '',
      filter: input => input ? input.split(',').map(s => s.trim()).filter(Boolean) : []
    },
    {
      type: 'number',
      name: 'port',
      message: 'HTTP port:',
      default: currentDomain.port || 80
    },
    {
      type: 'number',
      name: 'httpsPort',
      message: 'HTTPS port:',
      default: currentDomain.httpsPort || 443
    }
  ]);
}

/**
 * SSL edit prompts
 */
export async function promptSSLEdit(currentSSL) {
  return inquirer.prompt([
    {
      type: 'confirm',
      name: 'enabled',
      message: 'Enable SSL?',
      default: currentSSL?.enabled ?? true
    },
    {
      type: 'list',
      name: 'provider',
      message: 'SSL provider:',
      when: a => a.enabled,
      choices: [
        { name: "Let's Encrypt", value: 'letsencrypt' },
        { name: 'Cloudflare', value: 'cloudflare' },
        { name: 'Custom', value: 'custom' },
        { name: 'Self-signed', value: 'self-signed' }
      ],
      default: currentSSL?.provider || 'letsencrypt'
    },
    {
      type: 'confirm',
      name: 'http2',
      message: 'Enable HTTP/2?',
      when: a => a.enabled,
      default: currentSSL?.http2 ?? true
    },
    {
      type: 'confirm',
      name: 'http3',
      message: 'Enable HTTP/3 (QUIC)?',
      when: a => a.enabled && a.http2,
      default: currentSSL?.http3 ?? false
    },
    {
      type: 'input',
      name: 'certPath',
      message: 'Certificate path:',
      when: a => a.enabled && a.provider === 'custom',
      default: currentSSL?.certPath
    },
    {
      type: 'input',
      name: 'keyPath',
      message: 'Key path:',
      when: a => a.enabled && a.provider === 'custom',
      default: currentSSL?.keyPath
    }
  ]);
}

/**
 * Confirmation prompts
 */
export async function promptConfirm(message, defaultValue = true) {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message,
      default: defaultValue
    }
  ]);
  return confirm;
}

/**
 * Selection from list
 */
export async function promptSelect(message, choices) {
  const { selection } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selection',
      message,
      choices
    }
  ]);
  return selection;
}
