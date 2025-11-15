/**
 * Configuration Update Manager
 * Manages configuration updates and migrations based on nginx-wizard.json state file
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import chalk from 'chalk';
import inquirer from 'inquirer';

class UpdateManager {
  constructor(stateFilePath = './nginx-wizard.json') {
    this.stateFilePath = stateFilePath;
    this.state = null;
    this.updates = [];
  }

  /**
   * Load state file
   */
  loadState() {
    if (!existsSync(this.stateFilePath)) {
      throw new Error(`State file not found: ${this.stateFilePath}\nGenerate a config first to create the state file.`);
    }

    try {
      const content = readFileSync(this.stateFilePath, 'utf-8');
      this.state = JSON.parse(content);
      return this.state;
    } catch (error) {
      throw new Error(`Failed to parse state file: ${error.message}`);
    }
  }

  /**
   * Check for available updates
   */
  checkForUpdates() {
    if (!this.state) {
      this.loadState();
    }

    this.updates = [];

    // Check version
    const currentVersion = this.state.version || '1.0.0';
    const latestVersion = '1.1.0'; // This would come from a remote source in production

    // Add update recommendations based on configuration
    this.addSecurityUpdates();
    this.addPerformanceUpdates();
    this.addFeatureUpdates();

    return {
      hasUpdates: this.updates.length > 0,
      currentVersion,
      latestVersion,
      updates: this.updates
    };
  }

  /**
   * Check for security-related updates
   */
  addSecurityUpdates() {
    const config = this.state.config || {};

    // Check for old TLS versions
    if (config.ssl && config.ssl.provider !== 'none') {
      const protocols = config.ssl.protocols || [];
      if (protocols.includes('TLSv1') || protocols.includes('TLSv1.1')) {
        this.updates.push({
          type: 'security',
          severity: 'high',
          title: 'Outdated TLS versions detected',
          description: 'TLS 1.0 and 1.1 are deprecated and should be disabled',
          changes: {
            before: 'ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;',
            after: 'ssl_protocols TLSv1.2 TLSv1.3;'
          },
          action: () => {
            // Remove old TLS versions
            this.state.config.ssl.protocols = this.state.config.ssl.protocols.filter(
              p => p !== 'TLSv1' && p !== 'TLSv1.1'
            );
          }
        });
      }

      // Check for weak ciphers
      if (!config.ssl.cipherSuite || config.ssl.cipherSuite === 'old') {
        this.updates.push({
          type: 'security',
          severity: 'medium',
          title: 'Weak cipher suite detected',
          description: 'Using modern cipher suite will improve security',
          changes: {
            before: 'Cipher suite: old',
            after: 'Cipher suite: modern'
          },
          action: () => {
            this.state.config.ssl.cipherSuite = 'modern';
          }
        });
      }
    }

    // Check for missing security headers
    if (!config.features || !config.features.securityHeaders) {
      this.updates.push({
        type: 'security',
        severity: 'high',
        title: 'Security headers not enabled',
        description: 'Enable security headers for better protection',
        changes: {
          before: 'Security headers: disabled',
          after: 'Security headers: enabled (HSTS, X-Frame-Options, CSP, etc.)'
        },
        action: () => {
          this.state.config.features = this.state.config.features || {};
          this.state.config.features.securityHeaders = true;
        }
      });
    }

    // Check for missing rate limiting on API endpoints
    if (config.pattern === 'spa-with-api' || config.pattern === 'ssr-with-api' || config.pattern === 'microservices') {
      if (!config.security || !config.security.rateLimiting) {
        this.updates.push({
          type: 'security',
          severity: 'medium',
          title: 'Rate limiting not enabled for API',
          description: 'Enable rate limiting to protect against abuse',
          changes: {
            before: 'Rate limiting: disabled',
            after: 'Rate limiting: enabled'
          },
          action: () => {
            this.state.config.security = this.state.config.security || {};
            this.state.config.security.rateLimiting = true;
          }
        });
      }
    }
  }

  /**
   * Check for performance updates
   */
  addPerformanceUpdates() {
    const config = this.state.config || {};

    // Suggest HTTP/3 if not enabled
    if (config.ssl && config.ssl.http2 && !config.ssl.http3) {
      this.updates.push({
        type: 'performance',
        severity: 'low',
        title: 'HTTP/3 (QUIC) available',
        description: 'Enable HTTP/3 for better performance over poor networks',
        changes: {
          before: 'HTTP/3: disabled',
          after: 'HTTP/3: enabled with QUIC'
        },
        action: () => {
          this.state.config.ssl.http3 = true;
        }
      });
    }

    // Suggest compression if not enabled
    if (!config.features || !config.features.compression) {
      this.updates.push({
        type: 'performance',
        severity: 'medium',
        title: 'Gzip compression not enabled',
        description: 'Enable compression to reduce bandwidth usage',
        changes: {
          before: 'Gzip: disabled',
          after: 'Gzip: enabled (level 6)'
        },
        action: () => {
          this.state.config.features = this.state.config.features || {};
          this.state.config.features.compression = true;
        }
      });
    }

    // Suggest caching if not enabled
    if (!config.features || !config.features.browserCaching) {
      this.updates.push({
        type: 'performance',
        severity: 'medium',
        title: 'Browser caching not optimized',
        description: 'Enable browser caching for static assets',
        changes: {
          before: 'Browser caching: disabled',
          after: 'Browser caching: enabled (1 year for static assets)'
        },
        action: () => {
          this.state.config.features = this.state.config.features || {};
          this.state.config.features.browserCaching = true;
        }
      });
    }

    // Check for suboptimal performance profile
    if (config.performanceProfile === 'balanced' && config.pattern === 'static-only') {
      this.updates.push({
        type: 'performance',
        severity: 'low',
        title: 'Suboptimal performance profile',
        description: 'Static site profile would be more efficient',
        changes: {
          before: 'Profile: balanced',
          after: 'Profile: static-site'
        },
        action: () => {
          this.state.config.performanceProfile = 'static-site';
        }
      });
    }
  }

  /**
   * Check for new feature recommendations
   */
  addFeatureUpdates() {
    const config = this.state.config || {};

    // Suggest DDoS protection for public sites
    if (!config.security || !config.security.ddosProtection) {
      this.updates.push({
        type: 'feature',
        severity: 'low',
        title: 'DDoS protection available',
        description: 'Enable DDoS protection for better security',
        changes: {
          before: 'DDoS protection: none',
          after: 'DDoS protection: balanced profile'
        },
        action: () => {
          this.state.config.security = this.state.config.security || {};
          this.state.config.security.ddosProtection = 'balanced';
        }
      });
    }

    // Suggest CORS for API patterns
    if ((config.pattern === 'spa-with-api' || config.pattern === 'ssr-with-api') &&
        (!config.features || !config.features.cors)) {
      this.updates.push({
        type: 'feature',
        severity: 'low',
        title: 'CORS configuration available',
        description: 'Configure CORS for better API security',
        changes: {
          before: 'CORS: not configured',
          after: 'CORS: configured with origin restrictions'
        },
        action: () => {
          this.state.config.features = this.state.config.features || {};
          this.state.config.features.cors = true;
        }
      });
    }
  }

  /**
   * Display available updates
   */
  displayUpdates(updateInfo) {
    console.log(chalk.bold('\n📦 Configuration Update Check\n'));
    console.log(`Current version: ${chalk.cyan(updateInfo.currentVersion)}`);
    console.log(`Latest version: ${chalk.green(updateInfo.latestVersion)}\n`);

    if (!updateInfo.hasUpdates) {
      console.log(chalk.green('✅ Your configuration is up to date!'));
      return;
    }

    console.log(chalk.yellow(`Found ${updateInfo.updates.length} available updates:\n`));

    // Group updates by type
    const grouped = {
      security: [],
      performance: [],
      feature: []
    };

    updateInfo.updates.forEach(update => {
      grouped[update.type].push(update);
    });

    // Display by type
    Object.entries(grouped).forEach(([type, updates]) => {
      if (updates.length === 0) return;

      const icon = type === 'security' ? '🔒' : type === 'performance' ? '⚡' : '✨';
      console.log(chalk.bold(`${icon} ${type.toUpperCase()} Updates:`));

      updates.forEach((update, idx) => {
        const severityColor = update.severity === 'high' ? chalk.red : update.severity === 'medium' ? chalk.yellow : chalk.gray;
        console.log(`\n  ${idx + 1}. ${severityColor(`[${update.severity.toUpperCase()}]`)} ${update.title}`);
        console.log(`     ${chalk.gray(update.description)}`);
        console.log(`     ${chalk.gray('Before:')} ${update.changes.before}`);
        console.log(`     ${chalk.gray('After:')}  ${chalk.green(update.changes.after)}`);
      });

      console.log('');
    });
  }

  /**
   * Apply updates interactively
   */
  async applyUpdates(autoApply = false) {
    const updateInfo = this.checkForUpdates();

    if (!updateInfo.hasUpdates) {
      console.log(chalk.green('✅ No updates available'));
      return;
    }

    this.displayUpdates(updateInfo);

    // Ask user which updates to apply
    if (!autoApply) {
      const choices = updateInfo.updates.map((update, idx) => ({
        name: `[${update.severity.toUpperCase()}] ${update.title}`,
        value: idx,
        checked: update.severity === 'high'
      }));

      const answers = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'selected',
          message: 'Select updates to apply:',
          choices,
          validate: (answer) => {
            if (answer.length < 1) {
              return 'You must choose at least one update.';
            }
            return true;
          }
        }
      ]);

      // Apply selected updates
      answers.selected.forEach(idx => {
        updateInfo.updates[idx].action();
      });

      console.log(chalk.green(`\n✅ Applied ${answers.selected.length} updates`));
    } else {
      // Apply all updates automatically
      updateInfo.updates.forEach(update => update.action());
      console.log(chalk.green(`\n✅ Applied ${updateInfo.updates.length} updates automatically`));
    }

    // Save updated state
    this.saveState();

    console.log(chalk.yellow('\n⚠️  State file updated. Regenerate your nginx config to apply changes:'));
    console.log(chalk.gray('  nginxconf-wizard generate --state nginx-wizard.json'));
  }

  /**
   * Save state file
   */
  saveState() {
    this.state.updatedAt = new Date().toISOString();
    writeFileSync(this.stateFilePath, JSON.stringify(this.state, null, 2));
    console.log(chalk.gray(`\nState file saved: ${this.stateFilePath}`));
  }
}

export default UpdateManager;
