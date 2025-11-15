import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { promises as fs } from 'fs';
import path from 'path';
import ConfigBuilder from '../core/ConfigBuilder.js';
import Validator from '../core/Validator.js';
import SmartConfigManager from '../core/SmartConfigManager.js';
import { getPresets, applyPreset } from '../presets/index.js';

/**
 * Wizard - Interactive CLI wizard for configuration generation
 */
class Wizard {
  constructor(options = {}) {
    this.options = options;
    this.config = new ConfigBuilder();
    this.validator = new Validator();
    this.smartConfig = new SmartConfigManager();
    this.answers = {};
  }

  /**
   * Run the wizard
   */
  async run() {
    console.log(chalk.cyan('\n🚀 Welcome to Nginx Configuration Wizard!\n'));
    console.log(chalk.gray("Let's create your production-ready nginx configuration.\n"));

    try {
      // Step 0: Advanced mode selection
      await this.chooseMode();

      // Step 1: Check for preset
      await this.choosePreset();

      // Step 2: Choose pattern
      await this.choosePattern();

      // Step 3: Domain configuration
      await this.configureDomain();

      // Step 4: SSL configuration
      await this.configureSSL();

      // Step 5: Performance optimization
      await this.configurePerformance();

      // Step 6: Advanced performance tuning (if advanced mode)
      if (this.advancedMode) {
        await this.configureAdvancedPerformance();
      }

      // Step 7: Security features
      await this.configureSecurity();

      // Step 8: Additional features
      await this.configureFeatures();

      // Step 9: Advanced features (if advanced mode)
      if (this.advancedMode) {
        await this.configureAdvancedFeatures();
        await this.configureCustomHeaders();
      }

      // Step 10: Build configuration
      await this.buildConfiguration();

      // Step 11: Save files
      await this.saveConfiguration();

      console.log(chalk.green('\n✅ Configuration generated successfully!\n'));
      this.showNextSteps();
    } catch (error) {
      if (error.isTtyError) {
        console.error(chalk.red("Prompt couldn't be rendered in the current environment"));
      } else {
        throw error;
      }
    }
  }

  /**
   * Step 0: Choose wizard mode
   */
  async chooseMode() {
    const { advancedMode } = await inquirer.prompt([
      {
        type: 'list',
        name: 'advancedMode',
        message: 'Configuration mode:',
        choices: [
          { 
            name: '🎯 Quick Setup - Recommended settings with minimal questions', 
            value: false 
          },
          { 
            name: '⚡ Advanced Mode - Full control with detailed customization', 
            value: true 
          }
        ],
        default: false
      }
    ]);

    this.advancedMode = advancedMode;
    
    if (advancedMode) {
      console.log(chalk.yellow('\n  ⚡ Advanced mode enabled'));
      console.log(chalk.gray('  You\'ll see recommended values and can customize everything.\n'));
    } else {
      console.log(chalk.green('\n  🎯 Quick setup mode'));
      console.log(chalk.gray('  Using smart defaults. Run with --advanced for more control.\n'));
    }
  }

  /**
   * Step 0: Choose preset (optional)
   */
  async choosePreset() {
    const presets = getPresets();

    const { usePreset } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'usePreset',
        message: 'Would you like to use a framework preset for quick setup?',
        default: false
      }
    ]);

    if (!usePreset) {
      return;
    }

    const { preset } = await inquirer.prompt([
      {
        type: 'list',
        name: 'preset',
        message: 'Choose a preset:',
        choices: [
          ...presets.map(p => ({ name: p.name, value: p.value })),
          new inquirer.Separator(),
          { name: 'Custom (configure manually)', value: null }
        ]
      }
    ]);

    if (preset) {
      const presetConfig = applyPreset(preset);
      this.presetConfig = presetConfig;
      console.log(
        chalk.green(`\n  ✓ ${presets.find(p => p.value === preset).name} preset loaded\n`)
      );
      console.log(
        chalk.gray('  You can still customize the configuration in the following steps.\n')
      );
    }
  }

  /**
   * Step 1: Choose architecture pattern
   */
  async choosePattern() {
    const { pattern } = await inquirer.prompt([
      {
        type: 'list',
        name: 'pattern',
        message: 'Choose your architecture pattern:',
        choices: [
          {
            name: 'Static-Only - Pure static files (HTML, CSS, JS)',
            value: 'static-only'
          },
          {
            name: 'SPA + API - Single Page App with separate API backend',
            value: 'spa-with-api'
          },
          {
            name: 'SSR + API - Server-Side Rendered (Next.js, Nuxt)',
            value: 'ssr-with-api'
          },
          {
            name: 'Combined Server - Fullstack app (one server for both)',
            value: 'combined-server'
          },
          {
            name: 'Hybrid - Mix of static and dynamic content',
            value: 'hybrid'
          },
          {
            name: 'Microservices - Multiple service routing',
            value: 'microservices'
          }
        ],
        default: this.presetConfig?.pattern || 'static-only'
      }
    ]);

    this.config.setPattern(pattern);
    this.answers.pattern = pattern;

    console.log(chalk.gray(`\n  Selected pattern: ${pattern}\n`));
  }

  /**
   * Step 2: Configure domain
   */
  async configureDomain() {
    const questions = [
      {
        type: 'input',
        name: 'primary',
        message: 'Primary domain name:',
        default: 'example.com',
        validate: input => {
          this.validator.clear();
          return this.validator.validateDomain(input) || this.validator.getErrors()[0];
        }
      },
      {
        type: 'confirm',
        name: 'hasAliases',
        message: 'Add domain aliases (www, etc.)?',
        default: true
      },
      {
        type: 'input',
        name: 'aliases',
        message: `Domain aliases ${chalk.dim('(comma-separated, e.g., www.example.com,alt.example.com)')}:`,
        default: answers => `www.${answers.primary}`,
        when: answers => answers.hasAliases,
        filter: input =>
          input
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
      },
      {
        type: 'confirm',
        name: 'wwwRedirect',
        message: `Redirect www to non-www ${chalk.dim('(or vice versa)')}?`,
        default: true,
        when: () => this.advancedMode
      },
      {
        type: 'list',
        name: 'redirectDirection',
        message: 'Redirect direction:',
        choices: [
          { name: 'www.example.com → example.com', value: 'to-non-www' },
          { name: 'example.com → www.example.com', value: 'to-www' }
        ],
        default: 'to-non-www',
        when: answers => this.advancedMode && answers.wwwRedirect
      },
      {
        type: 'number',
        name: 'httpPort',
        message: `HTTP port ${chalk.dim('(default: 80)')}:`,
        default: 80,
        when: () => this.advancedMode,
        validate: input => input > 0 && input < 65536 ? true : 'Invalid port number'
      },
      {
        type: 'number',
        name: 'httpsPort',
        message: `HTTPS port ${chalk.dim('(default: 443)')}:`,
        default: 443,
        when: () => this.advancedMode,
        validate: input => input > 0 && input < 65536 ? true : 'Invalid port number'
      }
    ];

    const answers = await inquirer.prompt(questions);

    this.config.setDomain({
      primary: answers.primary,
      aliases: answers.aliases || [],
      port: answers.httpPort || 80,
      httpsPort: answers.httpsPort || 443,
      wwwRedirect: answers.wwwRedirect,
      redirectDirection: answers.redirectDirection
    });

    this.answers.domain = answers;
    
    const domainInfo = answers.aliases?.length > 0 
      ? `${answers.primary} + ${answers.aliases.length} alias(es)` 
      : answers.primary;
    console.log(chalk.gray(`\n  Domain configured: ${domainInfo}\n`));
  }

  /**
   * Step 3: Configure SSL/TLS
   */
  async configureSSL() {
    const questions = [
      {
        type: 'confirm',
        name: 'enabled',
        message: 'Enable SSL/TLS (HTTPS)?',
        default: true
      },
      {
        type: 'list',
        name: 'provider',
        message: 'SSL certificate provider:',
        choices: [
          { name: "Let's Encrypt (recommended)", value: 'letsencrypt' },
          { name: 'Cloudflare Origin Certificate', value: 'cloudflare' },
          { name: 'Custom certificate', value: 'custom' },
          { name: 'Self-signed (development only)', value: 'self-signed' }
        ],
        default: 'letsencrypt',
        when: answers => answers.enabled
      },
      {
        type: 'input',
        name: 'certPath',
        message: 'Certificate file path:',
        when: answers => answers.provider === 'custom',
        validate: input => (input ? true : 'Certificate path is required')
      },
      {
        type: 'input',
        name: 'keyPath',
        message: 'Private key file path:',
        when: answers => answers.provider === 'custom',
        validate: input => (input ? true : 'Private key path is required')
      },
      {
        type: 'list',
        name: 'cipherSuite',
        message: 'Cipher suite (security vs compatibility):',
        choices: [
          { name: 'Modern - TLS 1.3 only, highest security (may break old clients)', value: 'modern' },
          { name: 'Intermediate - TLS 1.2+, balanced (recommended)', value: 'intermediate' },
          { name: 'Old - TLS 1.0+, maximum compatibility (less secure)', value: 'old' }
        ],
        default: 'intermediate',
        when: answers => answers.enabled
      },
      {
        type: 'confirm',
        name: 'http2',
        message: 'Enable HTTP/2?',
        default: true,
        when: answers => answers.enabled
      },
      {
        type: 'confirm',
        name: 'http3',
        message: 'Enable HTTP/3 (QUIC) for faster mobile/poor networks?',
        default: false,
        when: answers => answers.enabled && answers.http2
      },
      {
        type: 'confirm',
        name: 'ocspStapling',
        message: 'Enable OCSP stapling for faster SSL handshakes?',
        default: true,
        when: answers => answers.enabled && answers.provider !== 'self-signed'
      },
      {
        type: 'confirm',
        name: 'hsts',
        message: 'Enable HSTS (HTTP Strict Transport Security)?',
        default: true,
        when: answers => answers.enabled
      },
      {
        type: 'confirm',
        name: 'hstsPreload',
        message: 'Include in HSTS preload list (recommended for production)?',
        default: false,
        when: answers => answers.hsts
      }
    ];

    const answers = await inquirer.prompt(questions);

    this.config.setSSL({
      enabled: answers.enabled || false,
      provider: answers.provider,
      certPath: answers.certPath,
      keyPath: answers.keyPath,
      cipherSuite: answers.cipherSuite || 'intermediate',
      http2: answers.http2 || false,
      http3: answers.http3 || false,
      ocspStapling: answers.ocspStapling,
      hsts: answers.hsts,
      hstsPreload: answers.hstsPreload
    });

    this.answers.ssl = answers;
    const sslDetails = answers.enabled 
      ? `${answers.provider}${answers.http3 ? ' + HTTP/3' : answers.http2 ? ' + HTTP/2' : ''}`
      : 'Disabled';
    console.log(chalk.gray(`\n  SSL configured: ${sslDetails}\n`));
  }

  /**
   * Step 4: Configure performance
   */
  async configurePerformance() {
    // Get auto-detected profile recommendation
    const currentConfig = {
      pattern: this.answers.pattern,
      ssl: this.answers.ssl,
      features: this.answers.features || {}
    };
    const suggestedProfile = this.smartConfig.detectProfile(currentConfig);

    const questions = [
      {
        type: 'list',
        name: 'profile',
        message: `Performance profile: ${chalk.dim(`(suggested: ${suggestedProfile})`)}`,
        choices: [
          { name: 'Balanced - Good defaults for most sites', value: 'balanced' },
          { name: 'High-traffic - Optimized for high concurrency', value: 'high-traffic' },
          { name: 'Low-resource - Minimal resource usage', value: 'low-resource' },
          { name: 'CDN Origin - Behind Cloudflare/CDN', value: 'cdn-origin' },
          { name: 'API Gateway - High upstream connections', value: 'api-gateway' },
          { name: 'Static Site - Optimized for static files', value: 'static-site' },
          { name: 'Development - Local development', value: 'development' }
        ],
        default: suggestedProfile
      },
      {
        type: 'confirm',
        name: 'browserCaching',
        message: 'Enable browser caching for static assets (1 year for CSS/JS/images)?',
        default: true
      },
      {
        type: 'confirm',
        name: 'proxyCaching',
        message: 'Enable proxy caching for dynamic content?',
        default: this.answers.pattern.includes('api') || this.answers.pattern.includes('ssr'),
        when: () => this.answers.pattern !== 'static-only'
      },
      {
        type: 'list',
        name: 'cacheStrategy',
        message: 'Caching strategy:',
        choices: [
          { name: 'API - 5min cache for API responses (500MB zone)', value: 'api' },
          { name: 'Static - 1 day cache for static content (2GB zone)', value: 'static' },
          { name: 'CDN - 7 day cache for CDN origin (10GB zone)', value: 'cdn' },
          { name: 'SSR - 10min cache with session bypass (1GB zone)', value: 'ssr' },
          { name: 'Microcache - 1 second cache for traffic spikes (100MB)', value: 'microcache' },
          { name: 'Custom - Configure manually', value: 'custom' }
        ],
        default: () => {
          if (this.answers.pattern === 'static-only') return 'static';
          if (this.answers.pattern.includes('api')) return 'api';
          if (this.answers.pattern.includes('ssr')) return 'ssr';
          return 'api';
        },
        when: answers => answers.proxyCaching
      },
      {
        type: 'number',
        name: 'cacheTTL',
        message: 'Cache TTL in minutes:',
        default: 10,
        when: answers => answers.cacheStrategy === 'custom'
      },
      {
        type: 'number',
        name: 'cacheZoneSize',
        message: 'Cache zone size in MB:',
        default: 500,
        when: answers => answers.cacheStrategy === 'custom'
      }
    ];

    const answers = await inquirer.prompt(questions);

    // Apply smart config profile
    const profileConfig = this.smartConfig.getProfile(answers.profile);

    this.config.setPerformance({
      profile: answers.profile,
      workers: profileConfig.workers,
      connections: profileConfig.workerConnections,
      browserCaching: answers.browserCaching,
      proxyCaching: answers.proxyCaching,
      cacheStrategy: answers.cacheStrategy,
      cacheTTL: answers.cacheTTL,
      cacheZoneSize: answers.cacheZoneSize,
      keepaliveTimeout: profileConfig.keepaliveTimeout,
      keepaliveRequests: profileConfig.keepaliveRequests,
      ...profileConfig
    });

    this.answers.performance = answers;
    console.log(chalk.gray(`\n  Performance profile: ${answers.profile}\n`));
  }

  /**
   * Step 5: Configure security
   */
  async configureSecurity() {
    const questions = [
      {
        type: 'confirm',
        name: 'headers',
        message: 'Add security headers (HSTS, X-Frame-Options, CSP, etc.)?',
        default: true
      },
      {
        type: 'confirm',
        name: 'rateLimiting',
        message: 'Enable rate limiting for API endpoints?',
        default: this.answers.pattern.includes('api') || this.answers.pattern === 'microservices'
      },
      {
        type: 'confirm',
        name: 'ddosProtection',
        message: 'Enable DDoS protection (connection & request limiting)?',
        default: false
      },
      {
        type: 'list',
        name: 'ddosProfile',
        message: 'DDoS protection profile:',
        choices: [
          { name: 'Strict - 10 conn/IP, 10 req/s (high security)', value: 'strict' },
          { name: 'Balanced - 20 conn/IP, 100 req/s (recommended)', value: 'balanced' },
          { name: 'Permissive - 50 conn/IP, 200 req/s (low restriction)', value: 'permissive' }
        ],
        default: 'balanced',
        when: answers => answers.ddosProtection
      },
      {
        type: 'confirm',
        name: 'fail2ban',
        message: 'Generate fail2ban configuration for nginx?',
        default: false,
        when: answers => answers.ddosProtection
      }
    ];

    const answers = await inquirer.prompt(questions);

    this.config.setSecurity({
      headers: answers.headers,
      rateLimiting: answers.rateLimiting,
      ddosProtection: answers.ddosProtection ? answers.ddosProfile : false,
      fail2ban: answers.fail2ban || false
    });

    this.answers.security = answers;
    console.log(chalk.gray('\n  Security configured\n'));
  }

  /**
   * Step 6.5: Advanced Performance Tuning (Advanced Mode Only)
   */
  async configureAdvancedPerformance() {
    console.log(chalk.cyan('\n⚙️  Advanced Performance Tuning\n'));
    console.log(chalk.gray('  Fine-tune worker processes, buffers, and timeouts.\n'));

    // Calculate recommended values based on system
    const cpuCores = 4; // In real app, detect with os.cpus().length
    const recommendedWorkers = cpuCores;
    const recommendedConnections = this.answers.performance?.profile === 'high-traffic' ? 2048 : 1024;

    const questions = [
      {
        type: 'number',
        name: 'workerProcesses',
        message: `Worker processes ${chalk.dim(`(recommended: ${recommendedWorkers} = CPU cores)`)}:`,
        default: recommendedWorkers,
        validate: input => input > 0 && input <= 128 ? true : 'Must be between 1 and 128'
      },
      {
        type: 'number',
        name: 'workerConnections',
        message: `Worker connections ${chalk.dim(`(recommended: ${recommendedConnections})`)}:`,
        default: recommendedConnections,
        validate: input => input >= 512 && input <= 65536 ? true : 'Must be between 512 and 65536'
      },
      {
        type: 'confirm',
        name: 'customizeBuffers',
        message: 'Customize buffer sizes (for high-traffic or large uploads)?',
        default: false
      },
      {
        type: 'input',
        name: 'clientBodyBufferSize',
        message: `Client body buffer size ${chalk.dim('(default: 16k, increase for file uploads)')}:`,
        default: '16k',
        when: answers => answers.customizeBuffers,
        validate: input => /^\d+[kmKM]$/.test(input) ? true : 'Must be in format like 16k or 1M'
      },
      {
        type: 'input',
        name: 'clientMaxBodySize',
        message: `Max upload size ${chalk.dim('(default: 10m, set to 0 for unlimited)')}:`,
        default: '10m',
        when: answers => answers.customizeBuffers,
        validate: input => /^\d+[kmgKMG]$|^0$/.test(input) ? true : 'Must be in format like 10m, 1g, or 0'
      },
      {
        type: 'input',
        name: 'clientHeaderBufferSize',
        message: `Client header buffer size ${chalk.dim('(default: 1k)')}:`,
        default: '1k',
        when: answers => answers.customizeBuffers
      },
      {
        type: 'input',
        name: 'largeClientHeaderBuffers',
        message: `Large client header buffers ${chalk.dim('(default: 4 8k = 4 buffers of 8KB)')}:`,
        default: '4 8k',
        when: answers => answers.customizeBuffers
      },
      {
        type: 'confirm',
        name: 'customizeTimeouts',
        message: 'Customize timeout values?',
        default: false
      },
      {
        type: 'number',
        name: 'clientBodyTimeout',
        message: `Client body timeout in seconds ${chalk.dim('(default: 60s)')}:`,
        default: 60,
        when: answers => answers.customizeTimeouts,
        validate: input => input >= 5 && input <= 300 ? true : 'Must be between 5 and 300 seconds'
      },
      {
        type: 'number',
        name: 'clientHeaderTimeout',
        message: `Client header timeout in seconds ${chalk.dim('(default: 60s)')}:`,
        default: 60,
        when: answers => answers.customizeTimeouts
      },
      {
        type: 'number',
        name: 'sendTimeout',
        message: `Send timeout in seconds ${chalk.dim('(default: 60s)')}:`,
        default: 60,
        when: answers => answers.customizeTimeouts
      },
      {
        type: 'number',
        name: 'keepaliveTimeout',
        message: `Keepalive timeout in seconds ${chalk.dim('(default: 65s, increase for CDN origin)')}:`,
        default: 65,
        when: answers => answers.customizeTimeouts,
        validate: input => input >= 5 && input <= 600 ? true : 'Must be between 5 and 600 seconds'
      },
      {
        type: 'confirm',
        name: 'enableOpenFileCache',
        message: `Enable open file cache ${chalk.dim('(recommended for static sites)')}?`,
        default: this.answers.pattern === 'static-only'
      },
      {
        type: 'number',
        name: 'openFileCacheMax',
        message: `Open file cache max files ${chalk.dim('(default: 1000)')}:`,
        default: 1000,
        when: answers => answers.enableOpenFileCache
      },
      {
        type: 'number',
        name: 'openFileCacheInactive',
        message: `Remove from cache after N seconds inactive ${chalk.dim('(default: 20s)')}:`,
        default: 20,
        when: answers => answers.enableOpenFileCache
      }
    ];

    const answers = await inquirer.prompt(questions);
    
    this.answers.advancedPerformance = answers;
    console.log(chalk.gray(`\n  Workers: ${answers.workerProcesses}, Connections: ${answers.workerConnections}\n`));
  }

  /**
   * Step 8.5: Advanced Features (Advanced Mode Only)
   */
  async configureAdvancedFeatures() {
    console.log(chalk.cyan('\n🔧 Advanced Features\n'));

    const questions = [
      {
        type: 'confirm',
        name: 'websocket',
        message: 'Enable WebSocket support?',
        default: false
      },
      {
        type: 'input',
        name: 'websocketPath',
        message: `WebSocket path ${chalk.dim('(e.g., /ws or /socket.io)')}:`,
        default: '/ws',
        when: answers => answers.websocket
      },
      {
        type: 'confirm',
        name: 'customErrorPages',
        message: 'Configure custom error pages?',
        default: false
      },
      {
        type: 'input',
        name: 'errorPagesPath',
        message: `Error pages directory ${chalk.dim('(e.g., /var/www/errors)')}:`,
        default: '/var/www/errors',
        when: answers => answers.customErrorPages
      },
      {
        type: 'list',
        name: 'logFormat',
        message: 'Access log format:',
        choices: [
          { name: 'Combined - Standard Apache format', value: 'combined' },
          { name: 'Main - Nginx default format', value: 'main' },
          { name: 'JSON - Structured JSON logs (for log aggregators)', value: 'json' },
          { name: 'Detailed - With response times and upstream info', value: 'detailed' }
        ],
        default: 'combined'
      },
      {
        type: 'list',
        name: 'errorLogLevel',
        message: 'Error log level:',
        choices: [
          { name: 'error - Only errors (production)', value: 'error' },
          { name: 'warn - Warnings and errors (recommended)', value: 'warn' },
          { name: 'notice - Notable events', value: 'notice' },
          { name: 'info - Informational messages', value: 'info' },
          { name: 'debug - Debug information (development only)', value: 'debug' }
        ],
        default: 'warn'
      },
      {
        type: 'confirm',
        name: 'gzipStatic',
        message: `Enable gzip_static ${chalk.dim('(serve pre-compressed .gz files)')}?`,
        default: false
      },
      {
        type: 'number',
        name: 'gzipLevel',
        message: `Gzip compression level ${chalk.dim('(1=fast/less, 9=slow/more, recommended: 6)')}:`,
        default: 6,
        when: () => this.answers.features?.compression,
        validate: input => input >= 1 && input <= 9 ? true : 'Must be between 1 and 9'
      },
      {
        type: 'confirm',
        name: 'serverTokens',
        message: `Hide nginx version in headers ${chalk.dim('(security best practice)')}?`,
        default: true
      },
      {
        type: 'confirm',
        name: 'realIPFromCloudflare',
        message: 'Behind Cloudflare? (restore real client IPs)',
        default: false
      },
      {
        type: 'confirm',
        name: 'monitoring',
        message: 'Enable stub_status for monitoring?',
        default: false
      },
      {
        type: 'input',
        name: 'monitoringPath',
        message: `Monitoring endpoint path ${chalk.dim('(e.g., /nginx_status)')}:`,
        default: '/nginx_status',
        when: answers => answers.monitoring
      },
      {
        type: 'checkbox',
        name: 'allowedIPs',
        message: 'Allowed IPs for monitoring (leave empty for local only):',
        choices: [
          { name: '127.0.0.1 - Localhost', value: '127.0.0.1', checked: true },
          { name: '::1 - IPv6 localhost', value: '::1', checked: true },
          new inquirer.Separator(),
          { name: 'Add custom IP (enter manually after)', value: 'custom' }
        ],
        when: answers => answers.monitoring
      },
      {
        type: 'input',
        name: 'customIP',
        message: 'Enter custom IP address:',
        when: answers => answers.allowedIPs?.includes('custom'),
        validate: input => {
          const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
          return ipRegex.test(input) ? true : 'Invalid IP address format';
        }
      }
    ];

    const answers = await inquirer.prompt(questions);
    
    this.answers.advancedFeatures = answers;
    
    const enabledFeatures = [];
    if (answers.websocket) enabledFeatures.push('WebSocket');
    if (answers.customErrorPages) enabledFeatures.push('Custom errors');
    if (answers.monitoring) enabledFeatures.push('Monitoring');
    if (answers.realIPFromCloudflare) enabledFeatures.push('Cloudflare');
    
    console.log(chalk.gray(`\n  Advanced features: ${enabledFeatures.length > 0 ? enabledFeatures.join(', ') : 'None'}\n`));
  }

  /**
   * Step 8.6: Configure custom headers (Advanced Mode Only)
   */
  async configureCustomHeaders() {
    if (!this.advancedMode) return;

    console.log(chalk.cyan('\n📝 Custom Headers Configuration\n'));

    const questions = [
      {
        type: 'confirm',
        name: 'addCustomHeaders',
        message: 'Add custom HTTP headers?',
        default: false
      },
      {
        type: 'confirm',
        name: 'securityHeaders',
        message: `Add security headers ${chalk.dim('(X-Frame-Options, X-Content-Type-Options, etc.)')}?`,
        default: true,
        when: answers => answers.addCustomHeaders
      },
      {
        type: 'list',
        name: 'xFrameOptions',
        message: 'X-Frame-Options (clickjacking protection):',
        choices: [
          { name: 'DENY - Never allow framing', value: 'DENY' },
          { name: 'SAMEORIGIN - Allow same-origin framing', value: 'SAMEORIGIN' },
          { name: 'None - No protection', value: null }
        ],
        default: 'SAMEORIGIN',
        when: answers => answers.securityHeaders
      },
      {
        type: 'confirm',
        name: 'xContentTypeOptions',
        message: `Add X-Content-Type-Options: nosniff ${chalk.dim('(MIME type security)')}?`,
        default: true,
        when: answers => answers.securityHeaders
      },
      {
        type: 'confirm',
        name: 'referrerPolicy',
        message: 'Add Referrer-Policy header?',
        default: true,
        when: answers => answers.securityHeaders
      },
      {
        type: 'list',
        name: 'referrerPolicyValue',
        message: 'Referrer-Policy value:',
        choices: [
          { name: 'no-referrer - Never send referrer', value: 'no-referrer' },
          { name: 'no-referrer-when-downgrade - Default browser behavior', value: 'no-referrer-when-downgrade' },
          { name: 'origin - Send only origin', value: 'origin' },
          { name: 'origin-when-cross-origin - Full URL for same-origin', value: 'origin-when-cross-origin' },
          { name: 'same-origin - Only for same-origin requests', value: 'same-origin' },
          { name: 'strict-origin - HTTPS-only origin', value: 'strict-origin' },
          { name: 'strict-origin-when-cross-origin - Recommended', value: 'strict-origin-when-cross-origin' }
        ],
        default: 'strict-origin-when-cross-origin',
        when: answers => answers.referrerPolicy
      },
      {
        type: 'confirm',
        name: 'permissionsPolicy',
        message: `Add Permissions-Policy ${chalk.dim('(control browser features)')}?`,
        default: false,
        when: answers => answers.securityHeaders
      },
      {
        type: 'checkbox',
        name: 'permissionsPolicyFeatures',
        message: 'Disable which browser features?',
        choices: [
          { name: 'camera - Camera access', value: 'camera' },
          { name: 'microphone - Microphone access', value: 'microphone' },
          { name: 'geolocation - Location tracking', value: 'geolocation' },
          { name: 'payment - Payment APIs', value: 'payment' },
          { name: 'usb - USB device access', value: 'usb' },
          { name: 'interest-cohort - FLoC tracking', value: 'interest-cohort' }
        ],
        when: answers => answers.permissionsPolicy
      },
      {
        type: 'input',
        name: 'customHeadersInput',
        message: `Custom headers ${chalk.dim('(format: "Header: Value", comma-separated)')}:`,
        default: '',
        when: answers => answers.addCustomHeaders,
        filter: input => {
          if (!input || input.trim() === '') return [];
          return input.split(',').map(h => {
            const [name, ...valueParts] = h.trim().split(':');
            return {
              name: name.trim(),
              value: valueParts.join(':').trim()
            };
          }).filter(h => h.name && h.value);
        }
      },
      {
        type: 'confirm',
        name: 'addCacheControlHeaders',
        message: `Override cache-control headers ${chalk.dim('(per-location basis)')}?`,
        default: false,
        when: answers => answers.addCustomHeaders
      },
      {
        type: 'input',
        name: 'staticCacheControl',
        message: `Cache-Control for static files ${chalk.dim('(e.g., public, max-age=31536000, immutable)')}:`,
        default: 'public, max-age=31536000, immutable',
        when: answers => answers.addCacheControlHeaders
      },
      {
        type: 'input',
        name: 'dynamicCacheControl',
        message: `Cache-Control for dynamic content ${chalk.dim('(e.g., no-cache, no-store, must-revalidate)')}:`,
        default: 'no-cache, no-store, must-revalidate',
        when: answers => answers.addCacheControlHeaders
      }
    ];

    const answers = await inquirer.prompt(questions);
    
    this.answers.customHeaders = answers;
    
    const headerCount = (answers.customHeadersInput?.length || 0) + 
                       (answers.securityHeaders ? 3 : 0);
    console.log(chalk.gray(`\n  Custom headers: ${headerCount > 0 ? `${headerCount} configured` : 'None'}\n`));
  }

  /**
   * Step 6: Configure additional features
```
   */
  async configureFeatures() {
    const questions = [
      {
        type: 'confirm',
        name: 'compression',
        message: 'Enable Gzip compression?',
        default: true
      },
      {
        type: 'confirm',
        name: 'spa',
        message: 'Is this a Single Page Application (fallback to index.html)?',
        default: this.answers.pattern === 'static-only',
        when: () => this.answers.pattern === 'static-only'
      },
      // SSR with API pattern
      {
        type: 'input',
        name: 'ssrServers',
        message: 'SSR application servers (comma-separated, e.g., localhost:3000,localhost:3001):',
        default: 'localhost:3000',
        when: () => this.answers.pattern === 'ssr-with-api',
        filter: input => {
          return input.split(',').map(s => {
            const [host, port] = s.trim().split(':');
            return { host, port: parseInt(port) || 3000 };
          });
        }
      },
      {
        type: 'input',
        name: 'staticAssetsPath',
        message: `Static assets path ${chalk.dim('(e.g., /_next/static for Next.js, /_nuxt for Nuxt, /static for custom, empty to skip)')}:`,
        default: '',
        when: () => this.answers.pattern === 'ssr-with-api'
      },
      {
        type: 'input',
        name: 'apiUrl',
        message: 'API URL (path like /api, subdomain like api.example.com, or full URL like https://api.example.com):',
        default: '/api',
        when: () => this.answers.pattern === 'ssr-with-api',
        validate: input => {
          if (!input || input.trim() === '') {
            return 'API URL cannot be empty';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'apiServers',
        message: 'API backend servers (comma-separated, e.g., localhost:8000,localhost:8001):',
        default: 'localhost:8000',
        when: answers => {
          // Only ask for backend servers if it's a path (not external domain)
          return this.answers.pattern === 'ssr-with-api' && 
                 answers.apiUrl && 
                 answers.apiUrl.startsWith('/');
        },
        filter: input => {
          return input.split(',').map(s => {
            const [host, port] = s.trim().split(':');
            return { host, port: parseInt(port) || 8000 };
          });
        }
      },
      // SPA with API pattern
      {
        type: 'confirm',
        name: 'hasProxy',
        message: 'Configure API proxy?',
        default: true,
        when: () => this.answers.pattern === 'spa-with-api'
      },
      {
        type: 'input',
        name: 'proxyPath',
        message: 'API proxy path (e.g., /api):',
        default: '/api',
        when: answers => answers.hasProxy
      },
      {
        type: 'input',
        name: 'proxyTarget',
        message: 'API backend URL (e.g., http://localhost:3000):',
        default: 'http://localhost:3000',
        when: answers => answers.hasProxy,
        validate: input => {
          if (!input.startsWith('http://') && !input.startsWith('https://')) {
            return 'URL must start with http:// or https://';
          }
          return true;
        }
      },
      {
        type: 'list',
        name: 'loadBalancingMethod',
        message: 'Load balancing method (if multiple backend servers):',
        choices: [
          { name: 'Round Robin - Distribute evenly (default)', value: 'round_robin' },
          { name: 'Least Connections - Send to server with fewest active connections', value: 'least_conn' },
          { name: 'IP Hash - Same client always goes to same server', value: 'ip_hash' },
          { name: 'Random - Random selection', value: 'random' }
        ],
        default: 'round_robin',
        when: answers => (answers.hasProxy && answers.proxyTarget.includes(',')) || 
                         (this.answers.pattern === 'ssr-with-api' && answers.ssrServers && answers.ssrServers.length > 1)
      },
      {
        type: 'confirm',
        name: 'cors',
        message: 'Enable CORS headers for API?',
        default: true,
        when: _answers => _answers.hasProxy
      },
      {
        type: 'input',
        name: 'corsOrigin',
        message: 'CORS allowed origin (or * for all):',
        default: _answers => `https://${this.answers.domain.primary}`,
        when: _answers => _answers.cors
      },
      // Combined server pattern
      {
        type: 'confirm',
        name: 'hasUpstream',
        message: 'Configure upstream servers (load balancing)?',
        default: false,
        when: () => this.answers.pattern === 'combined-server'
      },
      {
        type: 'input',
        name: 'upstreamName',
        message: 'Upstream name:',
        default: 'backend',
        when: answers => answers.hasUpstream
      },
      {
        type: 'input',
        name: 'upstreamServers',
        message: 'Backend servers (comma-separated, e.g., localhost:3000,localhost:3001):',
        default: 'localhost:3000',
        when: answers => answers.hasUpstream,
        filter: input => {
          return input.split(',').map(s => {
            const [host, port] = s.trim().split(':');
            return { host, port: parseInt(port) || 3000 };
          });
        }
      },
      {
        type: 'number',
        name: 'keepalive',
        message: `Keepalive connections ${chalk.dim('(recommended: 32-64 for better connection reuse)')}:`,
        default: 32,
        when: answers => answers.hasUpstream
      },
      {
        type: 'number',
        name: 'maxFails',
        message: `Max failed attempts before marking server down ${chalk.dim('(recommended: 3)')}:`,
        default: 3,
        when: answers => this.advancedMode && answers.hasUpstream
      },
      {
        type: 'number',
        name: 'failTimeout',
        message: `Fail timeout in seconds ${chalk.dim('(server recovery time, recommended: 30s)')}:`,
        default: 30,
        when: answers => this.advancedMode && answers.hasUpstream
      },
      {
        type: 'number',
        name: 'maxConns',
        message: `Max connections per server ${chalk.dim('(0 = unlimited, recommended: 0 or 100)')}:`,
        default: 0,
        when: answers => this.advancedMode && answers.hasUpstream
      },
      {
        type: 'confirm',
        name: 'backupServer',
        message: `Configure backup server ${chalk.dim('(used only when primary servers are down)')}?`,
        default: false,
        when: answers => this.advancedMode && answers.hasUpstream
      },
      {
        type: 'input',
        name: 'backupServerAddress',
        message: 'Backup server address (e.g., localhost:4000):',
        when: answers => answers.backupServer,
        filter: input => {
          const [host, port] = input.trim().split(':');
          return { host, port: parseInt(port) || 3000 };
        }
      },
      // Microservices pattern
      {
        type: 'input',
        name: 'servicesInput',
        message: 'Enter services in format: name:host:port:path (comma-separated)\n  Example: users:localhost:3001:/users,products:localhost:3002:/products\n  Services:',
        when: () => this.answers.pattern === 'microservices',
        filter: input => {
          return input.split(',').map(s => {
            const [name, host, port, path] = s.trim().split(':');
            return {
              name: name || 'service',
              servers: [{ host: host || 'localhost', port: parseInt(port) || 3000 }],
              path: path || `/${name}`,
              timeout: 60,
              cors: true,
              corsOrigin: '*'
            };
          });
        },
        validate: input => {
          if (!input || input.trim() === '') {
            return 'At least one service is required';
          }
          return true;
        }
      },
      // Hybrid pattern
      {
        type: 'input',
        name: 'staticRoot',
        message: 'Static files root directory (e.g., /var/www/html):',
        default: '/var/www/html',
        when: () => this.answers.pattern === 'hybrid'
      },
      {
        type: 'input',
        name: 'dynamicRoutesInput',
        message: 'Enter dynamic routes in format: path:target (comma-separated)\n  Example: /api:http://localhost:3000,/admin:http://localhost:4000\n  Routes:',
        when: () => this.answers.pattern === 'hybrid',
        filter: input => {
          if (!input || input.trim() === '') return [];
          return input.split(',').map(s => {
            const [path, target] = s.trim().split(':');
            return {
              path: path || '/',
              target: target || 'http://localhost:3000'
            };
          });
        }
      }
    ];

    const answers = await inquirer.prompt(questions);

    const features = {
      compression: answers.compression,
      spa: answers.spa || this.answers.pattern === 'spa-with-api'
    };

    // Add SSR with API configuration
    if (this.answers.pattern === 'ssr-with-api') {
      features.upstream = {
        ssrServers: answers.ssrServers
      };
      
      // Add static assets path if provided
      if (answers.staticAssetsPath && answers.staticAssetsPath.trim()) {
        features.staticAssetsPath = answers.staticAssetsPath.trim();
      }
      
      // Parse API URL
      const apiUrl = answers.apiUrl;
      if (apiUrl.startsWith('/')) {
        // It's a path - set up upstream
        features.apiPath = apiUrl;
        if (answers.apiServers) {
          features.upstream.apiServers = answers.apiServers;
        }
      } else if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
        // It's a full URL - proxy directly
        features.apiPath = '/api'; // default path
        features.apiTarget = apiUrl;
      } else {
        // It's a domain/subdomain - convert to https URL
        features.apiPath = '/api'; // default path
        features.apiTarget = `https://${apiUrl}`;
      }
    }

    // Add proxy configuration if enabled
    if (answers.hasProxy) {
      features.proxy = {
        path: answers.proxyPath,
        target: answers.proxyTarget,
        cors: answers.cors,
        corsOrigin: answers.corsOrigin || '*'
      };
    }

    // Add upstream configuration if enabled
    if (answers.hasUpstream) {
      features.upstream = {
        name: answers.upstreamName,
        servers: answers.upstreamServers,
        keepalive: answers.keepalive
      };
    }

    // Add microservices configuration
    if (this.answers.pattern === 'microservices' && answers.servicesInput) {
      features.services = answers.servicesInput;
    }

    // Add hybrid configuration
    if (this.answers.pattern === 'hybrid') {
      features.staticRoot = answers.staticRoot;
      if (answers.dynamicRoutesInput && answers.dynamicRoutesInput.length > 0) {
        features.dynamicRoutes = answers.dynamicRoutesInput;
      }
    }

    this.config.setFeatures(features);
    this.answers.features = answers;
  }

  /**
   * Step 7: Build the configuration
   */
  async buildConfiguration() {
    const spinner = ora('Generating nginx configuration...').start();

    try {
      // Validate
      if (this.options.validation !== false) {
        const validation = this.config.validate();

        if (!validation.valid) {
          spinner.fail('Configuration validation failed');
          validation.errors.forEach(error => {
            console.log(chalk.red(`  ✗ ${error}`));
          });
          throw new Error('Validation failed');
        }

        if (validation.warnings.length > 0) {
          spinner.warn('Configuration has warnings');
          validation.warnings.forEach(warning => {
            console.log(chalk.yellow(`  ⚠ ${warning}`));
          });
          spinner.start('Continuing with configuration generation...');
        }
      }

      // Build
      this.generatedConfig = await this.config.build();

      spinner.succeed('Configuration generated');
    } catch (error) {
      spinner.fail('Failed to generate configuration');
      throw error;
    }
  }

  /**
   * Step 8: Save configuration files
   */
  async saveConfiguration() {
    const outputDir = this.options.output || './';
    const configPath = path.join(outputDir, 'nginx.conf');
    const statePath = path.join(outputDir, 'nginx-wizard.json');

    const spinner = ora('Saving configuration files...').start();

    try {
      // Create output directory if it doesn't exist
      await fs.mkdir(outputDir, { recursive: true });

      // Save nginx.conf
      await fs.writeFile(configPath, this.generatedConfig, 'utf-8');

      // Save state file for managed updates
      const state = this.config.exportState();
      await fs.writeFile(statePath, JSON.stringify(state, null, 2), 'utf-8');

      spinner.succeed('Configuration files saved');

      console.log(chalk.gray('\n  Files created:'));
      console.log(chalk.gray(`    ${configPath}`));
      console.log(chalk.gray(`    ${statePath}`));
    } catch (error) {
      spinner.fail('Failed to save configuration');
      throw error;
    }
  }

  /**
   * Show next steps to user
   */
  showNextSteps() {
    console.log(chalk.cyan('\n📋 Next Steps:\n'));
    console.log(chalk.white('  1. Review the generated configuration:'));
    console.log(chalk.gray(`     cat ${this.options.output || '.'}nginx.conf\n`));

    console.log(chalk.white('  2. Test the configuration:'));
    console.log(
      chalk.gray(
        `     sudo nginx -t -c ${path.resolve(this.options.output || '.', 'nginx.conf')}\n`
      )
    );

    console.log(chalk.white('  3. Copy to nginx directory:'));
    console.log(
      chalk.gray(
        `     sudo cp nginx.conf /etc/nginx/sites-available/${this.answers.domain.primary}.conf`
      )
    );
    console.log(
      chalk.gray(
        `     sudo ln -s /etc/nginx/sites-available/${this.answers.domain.primary}.conf /etc/nginx/sites-enabled/\n`
      )
    );

    if (this.answers.ssl?.enabled && this.answers.ssl?.provider === 'letsencrypt') {
      console.log(chalk.white('  4. Obtain SSL certificate:'));
      console.log(
        chalk.gray(
          `     sudo certbot --nginx -d ${this.answers.domain.primary}${this.answers.domain.aliases ? ' -d ' + this.answers.domain.aliases.join(' -d ') : ''}\n`
        )
      );
    }

    console.log(chalk.white('  5. Reload nginx:'));
    console.log(chalk.gray('     sudo nginx -s reload\n'));

    console.log(chalk.cyan('💡 Tip: Keep nginx-wizard.json for future updates!\n'));
  }
}

export default Wizard;
