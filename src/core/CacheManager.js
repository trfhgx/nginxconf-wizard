/**
 * CacheManager - Advanced caching strategies and configuration
 */
class CacheManager {
  constructor() {
    this.cacheZones = new Map();
    this.cachePaths = [];
  }

  /**
   * Create cache zone configuration
   */
  createCacheZone(name, options = {}) {
    const defaults = {
      path: `/var/cache/nginx/${name}`,
      levels: '1:2',
      keysZone: `${name}:10m`,
      maxSize: '1g',
      inactive: '60m',
      useTempPath: false
    };

    const zone = { ...defaults, ...options };
    this.cacheZones.set(name, zone);
    return zone;
  }

  /**
   * Generate cache zone directives for http context
   */
  generateCacheZones() {
    const directives = [];

    for (const [, zone] of this.cacheZones) {
      directives.push(
        `proxy_cache_path ${zone.path} levels=${zone.levels} keys_zone=${zone.keysZone} max_size=${zone.maxSize} inactive=${zone.inactive}${zone.useTempPath ? '' : ' use_temp_path=off'};`
      );
    }

    return directives.join('\n');
  }

  /**
   * Get cache configuration for location
   */
  getCacheConfig(zoneName, options = {}) {
    const defaults = {
      cacheValid: {
        '200': '60m',
        '404': '1m',
        any: '5m'
      },
      cacheMethods: ['GET', 'HEAD'],
      cacheBypass: ['$http_pragma', '$http_authorization'],
      cacheKey: '$scheme$request_method$host$request_uri',
      cacheUseStale: ['error', 'timeout', 'invalid_header', 'updating', 'http_500', 'http_502', 'http_503', 'http_504'],
      cacheLock: true,
      cacheBackgroundUpdate: true,
      addCacheHeaders: true
    };

    return { ...defaults, ...options };
  }

  /**
   * Generate location cache directives
   */
  generateLocationCache(zoneName, config) {
    const directives = [];

    directives.push(`proxy_cache ${zoneName};`);
    directives.push(`proxy_cache_key ${config.cacheKey};`);

    // Cache methods
    if (config.cacheMethods.length > 0) {
      directives.push(`proxy_cache_methods ${config.cacheMethods.join(' ')};`);
    }

    // Cache valid times
    for (const [code, time] of Object.entries(config.cacheValid)) {
      directives.push(`proxy_cache_valid ${code === 'any' ? 'any' : code} ${time};`);
    }

    // Cache bypass conditions
    if (config.cacheBypass.length > 0) {
      directives.push(`proxy_cache_bypass ${config.cacheBypass.join(' ')};`);
      directives.push(`proxy_no_cache ${config.cacheBypass.join(' ')};`);
    }

    // Use stale
    if (config.cacheUseStale.length > 0) {
      directives.push(`proxy_cache_use_stale ${config.cacheUseStale.join(' ')};`);
    }

    // Cache lock
    if (config.cacheLock) {
      directives.push('proxy_cache_lock on;');
      directives.push('proxy_cache_lock_timeout 5s;');
    }

    // Background update
    if (config.cacheBackgroundUpdate) {
      directives.push('proxy_cache_background_update on;');
    }

    // Add headers showing cache status
    if (config.addCacheHeaders) {
      directives.push('add_header X-Cache-Status $upstream_cache_status;');
    }

    return directives.join('\n        ');
  }

  /**
   * Predefined cache strategies
   */
  getStrategy(strategyName) {
    const strategies = {
      'api': {
        zoneName: 'api_cache',
        zoneOptions: {
          path: '/var/cache/nginx/api',
          keysZone: 'api_cache:50m',
          maxSize: '500m',
          inactive: '10m'
        },
        locationConfig: {
          cacheValid: {
            '200': '5m',
            '404': '1m',
            any: '1m'
          },
          cacheBypass: [
            '$http_pragma',
            '$http_authorization',
            '$arg_nocache',
            '$cookie_session'
          ],
          cacheUseStale: ['error', 'timeout', 'updating', 'http_500', 'http_502', 'http_503'],
          cacheLock: true,
          cacheBackgroundUpdate: true
        }
      },

      'static': {
        zoneName: 'static_cache',
        zoneOptions: {
          path: '/var/cache/nginx/static',
          keysZone: 'static_cache:10m',
          maxSize: '2g',
          inactive: '7d'
        },
        locationConfig: {
          cacheValid: {
            '200': '1d',
            '404': '10m',
            any: '1h'
          },
          cacheBypass: [],
          cacheUseStale: ['error', 'timeout', 'invalid_header'],
          cacheLock: false,
          cacheBackgroundUpdate: false
        }
      },

      'cdn': {
        zoneName: 'cdn_cache',
        zoneOptions: {
          path: '/var/cache/nginx/cdn',
          keysZone: 'cdn_cache:100m',
          maxSize: '10g',
          inactive: '30d'
        },
        locationConfig: {
          cacheValid: {
            '200': '7d',
            '301': '1d',
            '302': '1h',
            '404': '1h',
            any: '10m'
          },
          cacheBypass: [],
          cacheUseStale: ['error', 'timeout', 'invalid_header', 'updating'],
          cacheLock: true,
          cacheBackgroundUpdate: true
        }
      },

      'ssr': {
        zoneName: 'ssr_cache',
        zoneOptions: {
          path: '/var/cache/nginx/ssr',
          keysZone: 'ssr_cache:50m',
          maxSize: '1g',
          inactive: '1h'
        },
        locationConfig: {
          cacheValid: {
            '200': '10m',
            '404': '1m',
            any: '5m'
          },
          cacheBypass: [
            '$http_pragma',
            '$http_authorization',
            '$cookie_session',
            '$http_cookie'
          ],
          cacheKey: '$scheme$request_method$host$request_uri$cookie_session',
          cacheUseStale: ['error', 'timeout', 'updating'],
          cacheLock: true,
          cacheBackgroundUpdate: true
        }
      },

      'microcache': {
        zoneName: 'micro_cache',
        zoneOptions: {
          path: '/var/cache/nginx/micro',
          keysZone: 'micro_cache:10m',
          maxSize: '100m',
          inactive: '1m'
        },
        locationConfig: {
          cacheValid: {
            '200': '1s',
            any: '1s'
          },
          cacheBypass: ['$http_pragma', '$http_authorization'],
          cacheUseStale: ['updating'],
          cacheLock: true,
          cacheBackgroundUpdate: false
        }
      }
    };

    return strategies[strategyName] || null;
  }

  /**
   * Apply caching strategy
   */
  applyStrategy(strategyName) {
    const strategy = this.getStrategy(strategyName);
    if (!strategy) {
      throw new Error(`Unknown cache strategy: ${strategyName}`);
    }

    this.createCacheZone(strategy.zoneName, strategy.zoneOptions);
    return strategy;
  }
}

export default CacheManager;
