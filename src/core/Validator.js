import Joi from 'joi';
import validator from 'validator';

/**
 * Validator - Validates configuration inputs
 * Handles domain, path, port, and configuration validation
 */
class Validator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate domain name
   * @param {string} domain - Domain to validate
   * @returns {boolean} - True if valid
   */
  validateDomain(domain) {
    if (!domain || typeof domain !== 'string') {
      this.errors.push('Domain must be a non-empty string');
      return false;
    }

    // Allow localhost for development
    if (domain === 'localhost' || domain === '127.0.0.1') {
      return true;
    }

    // Validate FQDN
    if (!validator.isFQDN(domain)) {
      this.errors.push(`Invalid domain name: ${domain}`);
      return false;
    }

    return true;
  }

  /**
   * Validate port number
   * @param {number} port - Port to validate
   * @returns {boolean} - True if valid
   */
  validatePort(port) {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      this.errors.push(`Invalid port: ${port}. Must be between 1 and 65535`);
      return false;
    }

    // Warn about privileged ports
    if (port < 1024 && port !== 80 && port !== 443) {
      this.warnings.push(`Port ${port} is privileged. Requires root/sudo access`);
    }

    return true;
  }

  /**
   * Validate file path
   * @param {string} filePath - Path to validate
   * @returns {boolean} - True if valid
   */
  validatePath(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      this.errors.push('Path must be a non-empty string');
      return false;
    }

    // Check for absolute path
    if (!filePath.startsWith('/')) {
      this.warnings.push(`Path ${filePath} is relative. Consider using absolute paths`);
    }

    // Check for suspicious patterns
    if (filePath.includes('..')) {
      this.errors.push(`Path ${filePath} contains directory traversal`);
      return false;
    }

    return true;
  }

  /**
   * Validate IP address
   * @param {string} ip - IP to validate
   * @returns {boolean} - True if valid
   */
  validateIP(ip) {
    if (!ip || typeof ip !== 'string') {
      this.errors.push('IP must be a non-empty string');
      return false;
    }

    if (!validator.isIP(ip)) {
      this.errors.push(`Invalid IP address: ${ip}`);
      return false;
    }

    return true;
  }

  /**
   * Validate URL
   * @param {string} url - URL to validate
   * @returns {boolean} - True if valid
   */
  validateURL(url) {
    if (!url || typeof url !== 'string') {
      this.errors.push('URL must be a non-empty string');
      return false;
    }

    if (!validator.isURL(url, { require_protocol: true })) {
      this.errors.push(`Invalid URL: ${url}`);
      return false;
    }

    return true;
  }

  /**
   * Validate upstream server configuration
   * @param {Object} upstream - Upstream config
   * @returns {boolean} - True if valid
   */
  validateUpstream(upstream) {
    const schema = Joi.object({
      host: Joi.string().required(),
      port: Joi.number().integer().min(1).max(65535).required(),
      weight: Joi.number().integer().min(1).optional(),
      maxFails: Joi.number().integer().min(0).optional(),
      failTimeout: Joi.string().pattern(/^\d+[smh]$/).optional()
    });

    const { error } = schema.validate(upstream);
    
    if (error) {
      this.errors.push(`Invalid upstream configuration: ${error.message}`);
      return false;
    }

    return true;
  }

  /**
   * Validate SSL configuration
   * @param {Object} sslConfig - SSL configuration
   * @returns {boolean} - True if valid
   */
  validateSSL(sslConfig) {
    const schema = Joi.object({
      enabled: Joi.boolean().required(),
      provider: Joi.string().valid('letsencrypt', 'cloudflare', 'custom', 'self-signed').optional(),
      certPath: Joi.string().when('provider', {
        is: 'custom',
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
      keyPath: Joi.string().when('provider', {
        is: 'custom',
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
      http2: Joi.boolean().optional(),
      http3: Joi.boolean().optional()
    });

    const { error } = schema.validate(sslConfig);
    
    if (error) {
      this.errors.push(`Invalid SSL configuration: ${error.message}`);
      return false;
    }

    // HTTP/3 requires HTTP/2
    if (sslConfig.http3 && !sslConfig.http2) {
      this.warnings.push('HTTP/3 requires HTTP/2. HTTP/2 will be enabled automatically');
    }

    return true;
  }

  /**
   * Validate rate limiting configuration
   * @param {Object} rateLimitConfig - Rate limit config
   * @returns {boolean} - True if valid
   */
  validateRateLimit(rateLimitConfig) {
    const schema = Joi.object({
      enabled: Joi.boolean().required(),
      zone: Joi.string().optional(),
      rate: Joi.string().pattern(/^\d+r\/[sm]$/).optional(),
      burst: Joi.number().integer().min(0).optional(),
      nodelay: Joi.boolean().optional()
    });

    const { error } = schema.validate(rateLimitConfig);
    
    if (error) {
      this.errors.push(`Invalid rate limit configuration: ${error.message}`);
      return false;
    }

    return true;
  }

  /**
   * Validate complete configuration object
   * @param {Object} config - Full configuration
   * @returns {Object} - Validation result
   */
  validateConfig(config) {
    this.errors = [];
    this.warnings = [];

    // Validate pattern
    const validPatterns = [
      'static-only',
      'spa-with-api',
      'ssr-with-api',
      'combined-server',
      'hybrid',
      'microservices'
    ];

    if (!validPatterns.includes(config.pattern)) {
      this.errors.push(`Invalid pattern: ${config.pattern}`);
    }

    // Validate domain
    if (config.domain?.primary) {
      this.validateDomain(config.domain.primary);
    } else {
      this.errors.push('Primary domain is required');
    }

    // Validate domain aliases
    if (config.domain?.aliases) {
      config.domain.aliases.forEach(alias => {
        this.validateDomain(alias);
      });
    }

    // Validate ports
    if (config.domain?.port) {
      this.validatePort(config.domain.port);
    }
    if (config.domain?.httpsPort) {
      this.validatePort(config.domain.httpsPort);
    }

    // Validate SSL if enabled
    if (config.ssl?.enabled) {
      this.validateSSL(config.ssl);
    }

    return {
      valid: this.errors.length === 0,
      errors: [...this.errors],
      warnings: [...this.warnings]
    };
  }

  /**
   * Get validation errors
   * @returns {Array} - Array of error messages
   */
  getErrors() {
    return [...this.errors];
  }

  /**
   * Get validation warnings
   * @returns {Array} - Array of warning messages
   */
  getWarnings() {
    return [...this.warnings];
  }

  /**
   * Clear errors and warnings
   */
  clear() {
    this.errors = [];
    this.warnings = [];
  }
}

export default Validator;
