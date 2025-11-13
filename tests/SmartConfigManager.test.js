import SmartConfigManager from '../src/core/SmartConfigManager.js';

describe('SmartConfigManager', () => {
  let manager;

  beforeEach(() => {
    manager = new SmartConfigManager();
  });

  describe('getProfile', () => {
    test('should return high-traffic profile', () => {
      const profile = manager.getProfile('high-traffic');
      expect(profile).toBeDefined();
      expect(profile.workers).toBe('auto');
      expect(profile.workerConnections).toBe(2048);
    });

    test('should return low-resource profile', () => {
      const profile = manager.getProfile('low-resource');
      expect(profile).toBeDefined();
      expect(profile.workers).toBe(1);
      expect(profile.workerConnections).toBe(512);
    });

    test('should return cdn-origin profile', () => {
      const profile = manager.getProfile('cdn-origin');
      expect(profile).toBeDefined();
      expect(profile.realIpFromCloudflare).toBe(true);
    });

    test('should return api-gateway profile', () => {
      const profile = manager.getProfile('api-gateway');
      expect(profile).toBeDefined();
      expect(profile.proxyBuffers).toBeDefined();
    });

    test('should return static-site profile', () => {
      const profile = manager.getProfile('static-site');
      expect(profile).toBeDefined();
      expect(profile.openFileCache.enabled).toBe(true);
    });

    test('should return development profile', () => {
      const profile = manager.getProfile('development');
      expect(profile).toBeDefined();
      expect(profile.workers).toBe(1);
      expect(profile.workerConnections).toBe(256);
    });
  });

  describe('detectProfile', () => {
    test('should detect cdn-origin for cloudflare', () => {
      const config = {
        ssl: { provider: 'cloudflare' }
      };
      const profile = manager.detectProfile(config);
      expect(profile).toBe('cdn-origin');
    });

    test('should detect api-gateway for microservices', () => {
      const config = {
        pattern: 'microservices'
      };
      const profile = manager.detectProfile(config);
      expect(profile).toBe('api-gateway');
    });

    test('should detect api-gateway for spa-with-api', () => {
      const config = {
        pattern: 'spa-with-api'
      };
      const profile = manager.detectProfile(config);
      expect(profile).toBe('api-gateway');
    });

    test('should detect static-site for static-only without proxy', () => {
      const config = {
        pattern: 'static-only',
        features: {}
      };
      const profile = manager.detectProfile(config);
      expect(profile).toBe('static-site');
    });

    test('should default to balanced for unknown patterns', () => {
      const config = {
        pattern: 'combined-server'
      };
      const profile = manager.detectProfile(config);
      expect(profile).toBe('balanced');
    });
  });

  describe('applyProfile', () => {
    test('should apply profile settings to config', () => {
      const config = { pattern: 'static-only' };
      const result = manager.applyProfile(config, 'high-traffic');
      
      expect(result.performance).toBeDefined();
      expect(result.performance.workers).toBe('auto');
      expect(result.performance.workerConnections).toBe(2048);
    });

    test('should preserve existing config values', () => {
      const config = {
        pattern: 'static-only',
        domain: { primary: 'example.com' }
      };
      const result = manager.applyProfile(config, 'development');
      
      expect(result.domain.primary).toBe('example.com');
      expect(result.performance.workers).toBe(1);
    });
  });

  describe('autoOptimize', () => {
    test('should auto-detect and apply best profile', () => {
      const config = {
        pattern: 'microservices'
      };
      const result = manager.autoOptimize(config);
      
      expect(result.performance.workerConnections).toBe(2048);
      expect(result.performance.proxyBuffers).toBeDefined();
    });
  });

  describe('getRecommendations', () => {
    test('should recommend profile change for microservices', () => {
      const config = {
        pattern: 'microservices',
        performance: { profile: 'balanced' }
      };
      const recommendations = manager.getRecommendations(config);
      
      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].type).toBe('profile');
      expect(recommendations[0].message).toContain('api-gateway');
    });

    test('should recommend higher connections for microservices', () => {
      const config = {
        pattern: 'microservices',
        performance: { connections: 512 }
      };
      const recommendations = manager.getRecommendations(config);
      
      const workerRec = recommendations.find(r => r.type === 'workers');
      expect(workerRec).toBeDefined();
      expect(workerRec.impact).toBe('high');
    });

    test('should recommend open_file_cache for static sites', () => {
      const config = {
        pattern: 'static-only',
        performance: { openFileCache: { enabled: false } }
      };
      const recommendations = manager.getRecommendations(config);
      
      const cacheRec = recommendations.find(r => r.type === 'cache');
      expect(cacheRec).toBeDefined();
      expect(cacheRec.impact).toBe('high');
    });

    test('should recommend disabling compression for CDN', () => {
      const config = {
        performance: { profile: 'cdn-origin' },
        features: { compression: true }
      };
      const recommendations = manager.getRecommendations(config);
      
      const compRec = recommendations.find(r => r.type === 'compression');
      expect(compRec).toBeDefined();
      expect(compRec.message).toContain('CDN');
    });

    test('should return empty array when config is optimal', () => {
      const config = {
        pattern: 'static-only',
        performance: {
          profile: 'static-site',
          openFileCache: { enabled: true }
        }
      };
      const recommendations = manager.getRecommendations(config);
      
      expect(recommendations).toHaveLength(0);
    });
  });
});
