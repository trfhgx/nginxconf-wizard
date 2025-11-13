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
      // Step 0: Check for preset
      await this.choosePreset();

      // Step 1: Choose pattern
      await this.choosePattern();

      // Step 2: Domain configuration
      await this.configureDomain();

      // Step 3: SSL configuration
      await this.configureSSL();

      // Step 4: Performance optimization
      await this.configurePerformance();

      // Step 5: Security features
      await this.configureSecurity();

      // Step 6: Additional features
      await this.configureFeatures();

      // Step 7: Build configuration
      await this.buildConfiguration();

      // Step 8: Save files
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
        message: 'Domain aliases (comma-separated):',
        default: answers => `www.${answers.primary}`,
        when: answers => answers.hasAliases,
        filter: input =>
          input
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
      }
    ];

    const answers = await inquirer.prompt(questions);

    this.config.setDomain({
      primary: answers.primary,
      aliases: answers.aliases || [],
      port: 80,
      httpsPort: 443
    });

    this.answers.domain = answers;
    console.log(chalk.gray(`\n  Domain configured: ${answers.primary}\n`));
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
        type: 'confirm',
        name: 'http2',
        message: 'Enable HTTP/2?',
        default: true,
        when: answers => answers.enabled
      },
      {
        type: 'confirm',
        name: 'http3',
        message: 'Enable HTTP/3 (QUIC)?',
        default: false,
        when: answers => answers.enabled && answers.http2
      }
    ];

    const answers = await inquirer.prompt(questions);

    this.config.setSSL({
      enabled: answers.enabled || false,
      provider: answers.provider,
      certPath: answers.certPath,
      keyPath: answers.keyPath,
      http2: answers.http2 || false,
      http3: answers.http3 || false
    });

    this.answers.ssl = answers;
    console.log(chalk.gray(`\n  SSL configured: ${answers.enabled ? 'Enabled' : 'Disabled'}\n`));
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
        name: 'caching',
        message: 'Enable browser caching for static assets?',
        default: true
      }
    ];

    const answers = await inquirer.prompt(questions);

    // Apply smart config profile
    const profileConfig = this.smartConfig.getProfile(answers.profile);

    this.config.setPerformance({
      profile: answers.profile,
      workers: profileConfig.workers,
      connections: profileConfig.workerConnections,
      caching: answers.caching,
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
        message: 'Add security headers (X-Frame-Options, CSP, etc.)?',
        default: true
      },
      {
        type: 'confirm',
        name: 'rateLimiting',
        message: 'Enable rate limiting?',
        default: false
      },
      {
        type: 'confirm',
        name: 'ddosProtection',
        message: 'Enable basic DDoS protection?',
        default: false
      }
    ];

    const answers = await inquirer.prompt(questions);

    this.config.setSecurity({
      headers: answers.headers,
      rateLimiting: answers.rateLimiting,
      ddosProtection: answers.ddosProtection
    });

    this.answers.security = answers;
    console.log(chalk.gray('\n  Security configured\n'));
  }

  /**
   * Step 6: Configure additional features
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
        message: 'SSR frontend servers (comma-separated, e.g., localhost:3000,localhost:3001):',
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
        type: 'confirm',
        name: 'cors',
        message: 'Enable CORS headers for API?',
        default: true,
        when: _answers => _answers.hasProxy
      },
      {
        type: 'input',
        name: 'corsOrigin',
        message: 'CORS allowed origin:',
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
        message: 'Keepalive connections:',
        default: 32,
        when: answers => answers.hasUpstream
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
