/**
 * Preset configurations for common frameworks and applications
 */
const presets = {
  nextjs: {
    name: 'Next.js',
    pattern: 'ssr-with-api',
    domain: {
      port: 80,
      httpsPort: 443
    },
    ssl: {
      enabled: true,
      provider: 'letsencrypt',
      http2: true,
      http3: false
    },
    performance: {
      profile: 'api-gateway'
    },
    security: {
      headers: true,
      rateLimiting: true,
      ddosProtection: false
    },
    features: {
      compression: true,
      upstream: {
        ssrServers: [{ host: '127.0.0.1', port: 3000 }],
        apiServers: [{ host: '127.0.0.1', port: 3000 }]
      },
      apiPath: '/api',
      cors: false
    }
  },

  nuxtjs: {
    name: 'Nuxt.js',
    pattern: 'ssr-with-api',
    domain: {
      port: 80,
      httpsPort: 443
    },
    ssl: {
      enabled: true,
      provider: 'letsencrypt',
      http2: true,
      http3: false
    },
    performance: {
      profile: 'api-gateway'
    },
    security: {
      headers: true,
      rateLimiting: true
    },
    features: {
      compression: true,
      upstream: {
        ssrServers: [{ host: '127.0.0.1', port: 3000 }],
        apiServers: [{ host: '127.0.0.1', port: 3000 }]
      },
      apiPath: '/api',
      cors: false
    }
  },

  'react-spa': {
    name: 'React SPA',
    pattern: 'spa-with-api',
    domain: {
      port: 80,
      httpsPort: 443
    },
    ssl: {
      enabled: true,
      provider: 'letsencrypt',
      http2: true
    },
    performance: {
      profile: 'static-site'
    },
    security: {
      headers: true,
      rateLimiting: true
    },
    features: {
      compression: true,
      spa: true,
      proxy: {
        path: '/api',
        target: 'http://localhost:3001',
        cors: true,
        corsOrigin: '*'
      }
    }
  },

  'vue-spa': {
    name: 'Vue.js SPA',
    pattern: 'spa-with-api',
    domain: {
      port: 80,
      httpsPort: 443
    },
    ssl: {
      enabled: true,
      provider: 'letsencrypt',
      http2: true
    },
    performance: {
      profile: 'static-site'
    },
    security: {
      headers: true,
      rateLimiting: true
    },
    features: {
      compression: true,
      spa: true,
      proxy: {
        path: '/api',
        target: 'http://localhost:3000',
        cors: true,
        corsOrigin: '*'
      }
    }
  },

  wordpress: {
    name: 'WordPress',
    pattern: 'combined-server',
    domain: {
      port: 80,
      httpsPort: 443
    },
    ssl: {
      enabled: true,
      provider: 'letsencrypt',
      http2: true
    },
    performance: {
      profile: 'balanced'
    },
    security: {
      headers: true,
      rateLimiting: true,
      ddosProtection: true
    },
    features: {
      compression: true,
      upstream: {
        name: 'wordpress',
        servers: [{ host: '127.0.0.1', port: 9000 }],
        keepalive: 32
      },
      staticPath: '/var/www/html'
    }
  },

  laravel: {
    name: 'Laravel',
    pattern: 'combined-server',
    domain: {
      port: 80,
      httpsPort: 443
    },
    ssl: {
      enabled: true,
      provider: 'letsencrypt',
      http2: true
    },
    performance: {
      profile: 'balanced'
    },
    security: {
      headers: true,
      rateLimiting: true
    },
    features: {
      compression: true,
      upstream: {
        name: 'laravel',
        servers: [{ host: '127.0.0.1', port: 9000 }],
        keepalive: 32
      },
      staticPath: '/var/www/html/public'
    }
  },

  fastapi: {
    name: 'FastAPI',
    pattern: 'spa-with-api',
    domain: {
      port: 80,
      httpsPort: 443
    },
    ssl: {
      enabled: true,
      provider: 'letsencrypt',
      http2: true
    },
    performance: {
      profile: 'api-gateway'
    },
    security: {
      headers: true,
      rateLimiting: true
    },
    features: {
      compression: true,
      proxy: {
        path: '/',
        target: 'http://localhost:8000',
        cors: true,
        corsOrigin: '*'
      }
    }
  },

  django: {
    name: 'Django',
    pattern: 'combined-server',
    domain: {
      port: 80,
      httpsPort: 443
    },
    ssl: {
      enabled: true,
      provider: 'letsencrypt',
      http2: true
    },
    performance: {
      profile: 'balanced'
    },
    security: {
      headers: true,
      rateLimiting: true
    },
    features: {
      compression: true,
      upstream: {
        name: 'django',
        servers: [
          { host: '127.0.0.1', port: 8000 },
          { host: '127.0.0.1', port: 8001 }
        ],
        keepalive: 32
      },
      staticPath: '/var/www/django/static'
    }
  },

  express: {
    name: 'Express.js',
    pattern: 'combined-server',
    domain: {
      port: 80,
      httpsPort: 443
    },
    ssl: {
      enabled: true,
      provider: 'letsencrypt',
      http2: true
    },
    performance: {
      profile: 'api-gateway'
    },
    security: {
      headers: true,
      rateLimiting: true
    },
    features: {
      compression: true,
      upstream: {
        name: 'express',
        servers: [{ host: '127.0.0.1', port: 3000 }],
        keepalive: 32
      }
    }
  },

  'static-html': {
    name: 'Static HTML Site',
    pattern: 'static-only',
    domain: {
      port: 80,
      httpsPort: 443
    },
    ssl: {
      enabled: true,
      provider: 'letsencrypt',
      http2: true
    },
    performance: {
      profile: 'static-site'
    },
    security: {
      headers: true,
      rateLimiting: false
    },
    features: {
      compression: true,
      spa: false
    }
  }
};

/**
 * Get preset by name
 */
export function getPreset(name) {
  return presets[name] || null;
}

/**
 * Get all available presets
 */
export function getPresets() {
  return Object.keys(presets).map(key => ({
    value: key,
    name: presets[key].name,
    pattern: presets[key].pattern
  }));
}

/**
 * Apply preset to configuration
 */
export function applyPreset(presetName, customConfig = {}) {
  const preset = getPreset(presetName);
  if (!preset) {
    throw new Error(`Preset '${presetName}' not found`);
  }

  // Deep merge preset with custom config
  return mergeDeep(preset, customConfig);
}

/**
 * Deep merge utility
 */
function mergeDeep(target, source) {
  const output = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = mergeDeep(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

export default {
  getPreset,
  getPresets,
  applyPreset
};
