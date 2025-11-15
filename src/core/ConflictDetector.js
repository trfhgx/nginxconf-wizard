/**
 * ConflictDetector - Detect configuration conflicts and issues
 */
class ConflictDetector {
  constructor() {
    this.conflicts = [];
    this.warnings = [];
  }

  /**
   * Clear previous detection results
   */
  clear() {
    this.conflicts = [];
    this.warnings = [];
  }

  /**
   * Detect all conflicts in configuration
   */
  detectConflicts(config) {
    this.clear();

    this.checkPortConflicts(config);
    this.checkLocationConflicts(config);
    this.checkSSLConflicts(config);
    this.checkUpstreamConflicts(config);
    this.checkFeatureConflicts(config);
    this.checkPerformanceConflicts(config);
    this.checkSecurityConflicts(config);

    return {
      hasConflicts: this.conflicts.length > 0,
      conflicts: this.conflicts,
      warnings: this.warnings
    };
  }

  /**
   * Check for port conflicts
   */
  checkPortConflicts(config) {
    const { domain, ssl } = config;

    // Check if HTTP and HTTPS ports are the same
    if (ssl?.enabled && domain?.port === domain?.httpsPort) {
      this.conflicts.push({
        type: 'port',
        severity: 'error',
        message: `HTTP port (${domain.port}) and HTTPS port (${domain.httpsPort}) cannot be the same`
      });
    }

    // Check for privileged ports without root
    if (domain?.port < 1024 || (ssl?.enabled && domain?.httpsPort < 1024)) {
      this.warnings.push({
        type: 'port',
        severity: 'warning',
        message: 'Using privileged ports (<1024) requires root/sudo privileges'
      });
    }

    // Check for non-standard ports
    if (ssl?.enabled && domain?.httpsPort !== 443) {
      this.warnings.push({
        type: 'port',
        severity: 'info',
        message: `Non-standard HTTPS port ${domain?.httpsPort} may require users to specify port in URL`
      });
    }
  }

  /**
   * Check for location block conflicts
   */
  checkLocationConflicts(config) {
    const locations = [];

    // Collect all location paths
    if (config.pattern === 'spa-with-api' && config.features?.proxy) {
      locations.push(config.features.proxy.path);
    }

    if (config.pattern === 'ssr-with-api' && config.features?.apiPath) {
      locations.push(config.features.apiPath);
    }

    if (config.pattern === 'microservices' && config.features?.services) {
      config.features.services.forEach(service => {
        locations.push(service.path);
      });
    }

    if (config.pattern === 'hybrid' && config.features?.dynamicRoutes) {
      config.features.dynamicRoutes.forEach(route => {
        locations.push(route.path);
      });
    }

    // Check for duplicate locations
    const duplicates = locations.filter((path, index) => locations.indexOf(path) !== index);
    if (duplicates.length > 0) {
      this.conflicts.push({
        type: 'location',
        severity: 'error',
        message: `Duplicate location paths detected: ${[...new Set(duplicates)].join(', ')}`
      });
    }

    // Check for overlapping regex patterns
    const regexPaths = locations.filter(path => path.includes('~'));
    if (regexPaths.length > 1) {
      this.warnings.push({
        type: 'location',
        severity: 'warning',
        message: 'Multiple regex location patterns may have precedence issues'
      });
    }

    // Check for / location conflicts
    if (locations.filter(path => path === '/').length > 1) {
      this.conflicts.push({
        type: 'location',
        severity: 'error',
        message: 'Multiple root (/) location blocks detected'
      });
    }
  }

  /**
   * Check for SSL/TLS conflicts
   */
  checkSSLConflicts(config) {
    const { ssl } = config;

    if (!ssl?.enabled) return;

    // HTTP/3 without HTTP/2
    if (ssl.http3 && !ssl.http2) {
      this.warnings.push({
        type: 'ssl',
        severity: 'warning',
        message: 'HTTP/3 (QUIC) requires HTTP/2 to be enabled for proper fallback'
      });
    }

    // Custom SSL without cert paths
    if (ssl.provider === 'custom' && (!ssl.certPath || !ssl.keyPath)) {
      this.conflicts.push({
        type: 'ssl',
        severity: 'error',
        message: 'Custom SSL provider requires certPath and keyPath'
      });
    }

    // Self-signed in production
    if (ssl.provider === 'self-signed') {
      this.warnings.push({
        type: 'ssl',
        severity: 'warning',
        message: 'Self-signed certificates should not be used in production'
      });
    }
  }

  /**
   * Check for upstream conflicts
   */
  checkUpstreamConflicts(config) {
    const { features } = config;

    // Check for empty upstream servers
    if (features?.upstream?.servers && features.upstream.servers.length === 0) {
      this.conflicts.push({
        type: 'upstream',
        severity: 'error',
        message: 'Upstream configuration has no servers defined'
      });
    }

    // Check for duplicate upstream servers
    if (features?.upstream?.servers) {
      const serverAddresses = features.upstream.servers.map(s => `${s.host}:${s.port}`);
      const duplicates = serverAddresses.filter((addr, index) => serverAddresses.indexOf(addr) !== index);
      if (duplicates.length > 0) {
        this.warnings.push({
          type: 'upstream',
          severity: 'warning',
          message: `Duplicate upstream servers: ${[...new Set(duplicates)].join(', ')}`
        });
      }
    }

    // SSR pattern without upstream
    if (config.pattern === 'ssr-with-api' && !features?.upstream) {
      this.conflicts.push({
        type: 'upstream',
        severity: 'error',
        message: 'SSR-with-API pattern requires upstream configuration'
      });
    }
  }

  /**
   * Check for feature conflicts
   */
  checkFeatureConflicts(config) {
    const { features, performance } = config;

    // Compression with CDN
    if (performance?.profile === 'cdn-origin' && features?.compression) {
      this.warnings.push({
        type: 'feature',
        severity: 'warning',
        message: 'Compression enabled behind CDN - CDN should handle compression'
      });
    }

    // SPA mode without static pattern
    if (features?.spa && !['static-only', 'spa-with-api'].includes(config.pattern)) {
      this.warnings.push({
        type: 'feature',
        severity: 'warning',
        message: 'SPA mode is typically used with static-only or spa-with-api patterns'
      });
    }

    // Proxy without target
    if (features?.proxy && !features.proxy.target) {
      this.conflicts.push({
        type: 'feature',
        severity: 'error',
        message: 'Proxy configuration missing target URL'
      });
    }
  }

  /**
   * Check for performance conflicts
   */
  checkPerformanceConflicts(config) {
    const { performance } = config;

    // Low-resource profile with high-traffic pattern
    if (performance?.profile === 'low-resource' && config.pattern === 'microservices') {
      this.warnings.push({
        type: 'performance',
        severity: 'warning',
        message: 'Low-resource profile may not handle microservices traffic well'
      });
    }

    // Development profile in production
    if (performance?.profile === 'development' && config.ssl?.enabled) {
      this.warnings.push({
        type: 'performance',
        severity: 'warning',
        message: 'Development profile should not be used with SSL in production'
      });
    }

    // Excessive worker connections
    if (performance?.connections > 4096) {
      this.warnings.push({
        type: 'performance',
        severity: 'warning',
        message: 'Very high worker_connections (>4096) may cause memory issues'
      });
    }
  }

  /**
   * Check for security conflicts
   */
  checkSecurityConflicts(config) {
    const { security, ssl } = config;

    // No security headers with SSL
    if (ssl?.enabled && !security?.headers) {
      this.warnings.push({
        type: 'security',
        severity: 'warning',
        message: 'SSL enabled but security headers disabled - recommended for production'
      });
    }

    // No rate limiting for API
    if (['spa-with-api', 'ssr-with-api', 'microservices'].includes(config.pattern) && !security?.rateLimiting) {
      this.warnings.push({
        type: 'security',
        severity: 'info',
        message: 'API endpoints without rate limiting may be vulnerable to abuse'
      });
    }

    // DDoS protection without rate limiting
    if (security?.ddosProtection && !security?.rateLimiting) {
      this.warnings.push({
        type: 'security',
        severity: 'warning',
        message: 'DDoS protection enabled but rate limiting disabled'
      });
    }
  }

  /**
   * Get conflicts by severity
   */
  getConflictsBySeverity(severity) {
    return this.conflicts.filter(c => c.severity === severity);
  }

  /**
   * Get warnings by type
   */
  getWarningsByType(type) {
    return this.warnings.filter(w => w.type === type);
  }

  /**
   * Format conflicts for display
   */
  formatConflicts() {
    const lines = [];

    if (this.conflicts.length > 0) {
      lines.push('CONFLICTS:');
      this.conflicts.forEach(conflict => {
        lines.push(`  [${conflict.type}] ${conflict.message}`);
      });
    }

    if (this.warnings.length > 0) {
      if (lines.length > 0) lines.push('');
      lines.push('WARNINGS:');
      this.warnings.forEach(warning => {
        lines.push(`  [${warning.type}] ${warning.message}`);
      });
    }

    return lines.join('\n');
  }
}

export default ConflictDetector;
