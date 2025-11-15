import TemplateEngine from './TemplateEngine.js';
import ConflictDetector from './ConflictDetector.js';

/**
 * ConfigBuilder - Core class for building Nginx configurations
 * Orchestrates pattern selection, feature application, and template rendering
 */
class ConfigBuilder {
  constructor() {
    this.config = {
      pattern: null,
      domain: {},
      ssl: {},
      performance: {},
      security: {},
      features: {},
      customDirectives: []
    };
    this.errors = [];
    this.warnings = [];
    this.templateEngine = new TemplateEngine();
    this.conflictDetector = new ConflictDetector();
  }

  /**
   * Set the architecture pattern
   * @param {string} pattern - Pattern name (static-only, spa-with-api, etc.)
   */
  setPattern(pattern) {
    const validPatterns = [
      'static-only',
      'spa-with-api',
      'ssr-with-api',
      'combined-server',
      'hybrid',
      'microservices'
    ];

    if (!validPatterns.includes(pattern)) {
      throw new Error(`Invalid pattern: ${pattern}. Valid patterns: ${validPatterns.join(', ')}`);
    }

    this.config.pattern = pattern;
    return this;
  }

  /**
   * Set domain configuration
   * @param {Object} domainConfig - Domain settings
   */
  setDomain(domainConfig) {
    const { primary, aliases = [], port = 80, httpsPort = 443 } = domainConfig;

    if (!primary) {
      throw new Error('Primary domain is required');
    }

    this.config.domain = {
      primary,
      aliases,
      port,
      httpsPort
    };

    return this;
  }

  /**
   * Configure SSL/TLS
   * @param {Object} sslConfig - SSL configuration
   */
  setSSL(sslConfig) {
    const {
      enabled = false,
      provider = 'letsencrypt',
      certPath,
      keyPath,
      http2 = true,
      http3 = false
    } = sslConfig;

    this.config.ssl = {
      enabled,
      provider,
      certPath,
      keyPath,
      http2,
      http3
    };

    return this;
  }

  /**
   * Set performance profile
   * @param {Object} perfConfig - Performance configuration
   */
  setPerformance(perfConfig) {
    const {
      profile = 'balanced',
      workers = 'auto',
      connections = 1024,
      caching = false
    } = perfConfig;

    this.config.performance = {
      profile,
      workers,
      connections,
      caching
    };

    return this;
  }

  /**
   * Configure security features
   * @param {Object} securityConfig - Security settings
   */
  setSecurity(securityConfig) {
    const { headers = true, rateLimiting = false, ddosProtection = false } = securityConfig;

    this.config.security = {
      headers,
      rateLimiting,
      ddosProtection
    };

    return this;
  }

  /**
   * Enable/disable features
   * @param {Object} features - Feature flags
   */
  setFeatures(features) {
    this.config.features = { ...features };
    return this;
  }

  /**
   * Add custom nginx directive
   * @param {string} directive - Raw nginx directive
   */
  addCustomDirective(directive) {
    this.config.customDirectives.push(directive);
    return this;
  }

  /**
   * Validate current configuration
   * @returns {Object} - Validation result with errors and warnings
   */
  validate() {
    this.errors = [];
    this.warnings = [];

    // Check required fields
    if (!this.config.pattern) {
      this.errors.push('Pattern is required');
    }

    if (!this.config.domain.primary) {
      this.errors.push('Primary domain is required');
    }

    // Validate SSL configuration
    if (this.config.ssl.enabled) {
      if (this.config.ssl.provider === 'custom') {
        if (!this.config.ssl.certPath || !this.config.ssl.keyPath) {
          this.errors.push('Custom SSL requires certPath and keyPath');
        }
      }

      if (this.config.ssl.http3 && !this.config.ssl.http2) {
        this.warnings.push('HTTP/3 requires HTTP/2 - enabling HTTP/2');
        this.config.ssl.http2 = true;
      }
    }

    // Validate pattern-specific requirements
    if (['spa-with-api', 'ssr-with-api', 'microservices'].includes(this.config.pattern)) {
      if (!this.config.features.proxy && !this.config.features.upstream) {
        this.warnings.push(`Pattern ${this.config.pattern} typically requires proxy configuration`);
      }
    }

    // Run conflict detection
    const conflictResult = this.conflictDetector.detectConflicts(this.config);
    if (conflictResult.hasConflicts) {
      this.errors.push(...conflictResult.conflicts.map(c => c.message));
    }
    this.warnings.push(...conflictResult.warnings.map(w => w.message));

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      conflicts: conflictResult.conflicts
    };
  }

  /**
   * Get current configuration
   * @returns {Object} - Current config state
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Build nginx configuration from template
   * @returns {Promise<string>} - Generated nginx config
   */
  async build() {
    const validation = this.validate();

    if (!validation.valid) {
      throw new Error(`Configuration validation failed:\n${validation.errors.join('\n')}`);
    }

    // Render template using TemplateEngine
    try {
      const nginxConfig = await this.templateEngine.render(this.config.pattern, this.config);
      return nginxConfig;
    } catch (error) {
      if (error.message.includes('Template not found')) {
        throw new Error(`Template not found for pattern: ${this.config.pattern}`);
      }
      throw error;
    }
  }

  /**
   * Export configuration as state file (for managed updates)
   * @returns {Object} - State file content
   */
  exportState() {
    return {
      version: '1.0.0',
      schemaVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...this.config
    };
  }

  /**
   * Import configuration from state file
   * @param {Object} state - State file content
   */
  importState(state) {
    const { pattern, domain, ssl, performance, security, features, customDirectives } = state;

    if (pattern) this.config.pattern = pattern;
    if (domain) this.config.domain = domain;
    if (ssl) this.config.ssl = ssl;
    if (performance) this.config.performance = performance;
    if (security) this.config.security = security;
    if (features) this.config.features = features;
    if (customDirectives) this.config.customDirectives = customDirectives;

    return this;
  }
}

export default ConfigBuilder;
