/**
 * SmartConfigManager - Intelligent configuration optimization
 * Applies workload-specific optimizations based on detected or selected profile
 */
class SmartConfigManager {
  constructor() {
    this.profiles = {
      balanced: {
        workers: 'auto',
        workerConnections: 1024,
        keepaliveTimeout: 65,
        keepaliveRequests: 100,
        clientBodyTimeout: 30,
        clientHeaderTimeout: 30,
        sendTimeout: 30,
        buffers: {
          clientBodyBufferSize: '8k',
          clientHeaderBufferSize: '1k',
          largeClientHeaderBuffers: '4 8k'
        },
        openFileCache: {
          enabled: true,
          max: 2000,
          inactive: '60s',
          valid: '120s',
          errors: true
        },
        compression: {
          level: 6,
          minLength: 1000
        }
      },

      'high-traffic': {
        workers: 'auto',
        workerConnections: 2048,
        keepaliveTimeout: 120,
        keepaliveRequests: 1000,
        clientBodyTimeout: 12,
        clientHeaderTimeout: 12,
        sendTimeout: 10,
        buffers: {
          clientBodyBufferSize: '16k',
          clientHeaderBufferSize: '1k',
          largeClientHeaderBuffers: '4 8k'
        },
        openFileCache: {
          enabled: true,
          max: 10000,
          inactive: '60s',
          valid: '120s',
          errors: true
        },
        compression: {
          level: 6,
          minLength: 1000
        }
      },

      'low-resource': {
        workers: 1,
        workerConnections: 512,
        keepaliveTimeout: 65,
        keepaliveRequests: 100,
        clientBodyTimeout: 60,
        clientHeaderTimeout: 60,
        sendTimeout: 60,
        buffers: {
          clientBodyBufferSize: '8k',
          clientHeaderBufferSize: '1k',
          largeClientHeaderBuffers: '2 4k'
        },
        openFileCache: {
          enabled: false
        },
        compression: {
          level: 4,
          minLength: 1000
        }
      },

      'cdn-origin': {
        workers: 'auto',
        workerConnections: 1024,
        keepaliveTimeout: 300,
        keepaliveRequests: 10000,
        clientBodyTimeout: 30,
        clientHeaderTimeout: 30,
        sendTimeout: 30,
        buffers: {
          clientBodyBufferSize: '16k',
          clientHeaderBufferSize: '1k',
          largeClientHeaderBuffers: '4 8k'
        },
        openFileCache: {
          enabled: true,
          max: 50000,
          inactive: '120s',
          valid: '300s',
          errors: false
        },
        compression: {
          enabled: false, // CDN handles compression
          level: 0
        },
        realIpFromCloudflare: true
      },

      'api-gateway': {
        workers: 'auto',
        workerConnections: 2048,
        keepaliveTimeout: 75,
        keepaliveRequests: 500,
        clientBodyTimeout: 30,
        clientHeaderTimeout: 30,
        sendTimeout: 30,
        buffers: {
          clientBodyBufferSize: '32k',
          clientHeaderBufferSize: '1k',
          largeClientHeaderBuffers: '4 16k'
        },
        openFileCache: {
          enabled: false
        },
        compression: {
          level: 6,
          minLength: 500
        },
        proxyBuffers: {
          bufferSize: '8k',
          buffers: '16 8k',
          busyBuffersSize: '16k'
        }
      },

      'static-site': {
        workers: 2,
        workerConnections: 1024,
        keepaliveTimeout: 65,
        keepaliveRequests: 100,
        clientBodyTimeout: 60,
        clientHeaderTimeout: 60,
        sendTimeout: 60,
        buffers: {
          clientBodyBufferSize: '8k',
          clientHeaderBufferSize: '1k',
          largeClientHeaderBuffers: '2 4k'
        },
        openFileCache: {
          enabled: true,
          max: 5000,
          inactive: '60s',
          valid: '120s',
          errors: true
        },
        compression: {
          level: 6,
          minLength: 1000
        }
      },

      development: {
        workers: 1,
        workerConnections: 256,
        keepaliveTimeout: 65,
        keepaliveRequests: 100,
        clientBodyTimeout: 60,
        clientHeaderTimeout: 60,
        sendTimeout: 60,
        buffers: {
          clientBodyBufferSize: '8k',
          clientHeaderBufferSize: '1k',
          largeClientHeaderBuffers: '2 4k'
        },
        openFileCache: {
          enabled: false
        },
        compression: {
          level: 1,
          minLength: 1000
        }
      }
    };
  }

  /**
   * Get profile configuration
   */
  getProfile(profileName) {
    return this.profiles[profileName] || this.profiles['balanced'];
  }

  /**
   * Detect optimal profile based on config
   */
  detectProfile(config) {
    // CDN detection
    if (config.ssl?.provider === 'cloudflare') {
      return 'cdn-origin';
    }

    // API-heavy detection
    if (config.pattern === 'microservices' || config.pattern === 'spa-with-api') {
      return 'api-gateway';
    }

    // Static site detection
    if (config.pattern === 'static-only' && !config.features?.proxy) {
      return 'static-site';
    }

    // Default
    return 'balanced';
  }

  /**
   * Apply profile optimizations to config
   */
  applyProfile(config, profileName) {
    const profile = this.getProfile(profileName);

    // Apply performance settings
    config.performance = {
      ...config.performance,
      ...profile
    };

    // Apply buffer settings
    if (profile.buffers) {
      config.buffers = profile.buffers;
    }

    // Apply proxy buffers for API patterns
    if (profile.proxyBuffers && config.features?.proxy) {
      config.proxyBuffers = profile.proxyBuffers;
    }

    return config;
  }

  /**
   * Auto-detect and apply best profile
   */
  autoOptimize(config) {
    const detectedProfile = this.detectProfile(config);
    return this.applyProfile(config, detectedProfile);
  }

  /**
   * Get optimization recommendations
   */
  getRecommendations(config) {
    const recommendations = [];

    // Check if using balanced when better profile available
    const suggested = this.detectProfile(config);
    if (config.performance?.profile !== suggested) {
      recommendations.push({
        type: 'profile',
        message: `Consider using '${suggested}' profile for better performance`,
        impact: 'medium'
      });
    }

    // Check worker connections vs pattern
    if (config.pattern === 'microservices' && config.performance?.connections < 2048) {
      recommendations.push({
        type: 'workers',
        message: 'Microservices pattern benefits from higher worker_connections (2048+)',
        impact: 'high'
      });
    }

    // Check open_file_cache for static content
    if (config.pattern === 'static-only' && !config.performance?.openFileCache?.enabled) {
      recommendations.push({
        type: 'cache',
        message: 'Enable open_file_cache for static sites to improve performance',
        impact: 'high'
      });
    }

    // Check compression for CDN origin
    if (config.performance?.profile === 'cdn-origin' && config.features?.compression) {
      recommendations.push({
        type: 'compression',
        message: 'Disable compression when behind CDN - CDN handles this',
        impact: 'medium'
      });
    }

    return recommendations;
  }
}

export default SmartConfigManager;
