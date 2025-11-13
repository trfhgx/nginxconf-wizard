import { getPreset, getPresets, applyPreset } from '../src/presets/index.js';

describe('Presets', () => {
  describe('getPresets', () => {
    test('should return array of presets', () => {
      const presets = getPresets();
      expect(Array.isArray(presets)).toBe(true);
      expect(presets.length).toBeGreaterThan(0);
    });

    test('should have required fields', () => {
      const presets = getPresets();
      presets.forEach(preset => {
        expect(preset).toHaveProperty('value');
        expect(preset).toHaveProperty('name');
        expect(preset).toHaveProperty('pattern');
      });
    });
  });

  describe('getPreset', () => {
    test('should return nextjs preset', () => {
      const preset = getPreset('nextjs');
      expect(preset).toBeDefined();
      expect(preset.name).toBe('Next.js');
      expect(preset.pattern).toBe('ssr-with-api');
      expect(preset.features.upstream.ssrServers).toBeDefined();
    });

    test('should return nuxtjs preset', () => {
      const preset = getPreset('nuxtjs');
      expect(preset).toBeDefined();
      expect(preset.name).toBe('Nuxt.js');
      expect(preset.pattern).toBe('ssr-with-api');
    });

    test('should return react-spa preset', () => {
      const preset = getPreset('react-spa');
      expect(preset).toBeDefined();
      expect(preset.name).toBe('React SPA');
      expect(preset.pattern).toBe('spa-with-api');
      expect(preset.features.spa).toBe(true);
    });

    test('should return vue-spa preset', () => {
      const preset = getPreset('vue-spa');
      expect(preset).toBeDefined();
      expect(preset.name).toBe('Vue.js SPA');
      expect(preset.pattern).toBe('spa-with-api');
    });

    test('should return wordpress preset', () => {
      const preset = getPreset('wordpress');
      expect(preset).toBeDefined();
      expect(preset.name).toBe('WordPress');
      expect(preset.pattern).toBe('combined-server');
      expect(preset.features.upstream.servers[0].port).toBe(9000);
    });

    test('should return laravel preset', () => {
      const preset = getPreset('laravel');
      expect(preset).toBeDefined();
      expect(preset.name).toBe('Laravel');
      expect(preset.pattern).toBe('combined-server');
    });

    test('should return fastapi preset', () => {
      const preset = getPreset('fastapi');
      expect(preset).toBeDefined();
      expect(preset.name).toBe('FastAPI');
      expect(preset.pattern).toBe('spa-with-api');
      expect(preset.features.proxy.target).toContain('8000');
    });

    test('should return django preset', () => {
      const preset = getPreset('django');
      expect(preset).toBeDefined();
      expect(preset.name).toBe('Django');
      expect(preset.pattern).toBe('combined-server');
      expect(preset.features.upstream.servers.length).toBe(2);
    });

    test('should return express preset', () => {
      const preset = getPreset('express');
      expect(preset).toBeDefined();
      expect(preset.name).toBe('Express.js');
      expect(preset.pattern).toBe('combined-server');
    });

    test('should return static-html preset', () => {
      const preset = getPreset('static-html');
      expect(preset).toBeDefined();
      expect(preset.name).toBe('Static HTML Site');
      expect(preset.pattern).toBe('static-only');
      expect(preset.features.spa).toBe(false);
    });

    test('should return null for invalid preset', () => {
      const preset = getPreset('invalid-preset');
      expect(preset).toBeNull();
    });
  });

  describe('applyPreset', () => {
    test('should apply preset without custom config', () => {
      const config = applyPreset('nextjs');
      expect(config.pattern).toBe('ssr-with-api');
      expect(config.performance.profile).toBe('api-gateway');
    });

    test('should merge custom config with preset', () => {
      const config = applyPreset('react-spa', {
        domain: { primary: 'myapp.com' }
      });
      
      expect(config.pattern).toBe('spa-with-api');
      expect(config.domain.primary).toBe('myapp.com');
      expect(config.features.spa).toBe(true);
    });

    test('should override preset values with custom config', () => {
      const config = applyPreset('wordpress', {
        performance: { profile: 'high-traffic' }
      });
      
      expect(config.performance.profile).toBe('high-traffic');
    });

    test('should deep merge nested objects', () => {
      const config = applyPreset('fastapi', {
        features: {
          proxy: {
            target: 'http://localhost:9000'
          }
        }
      });
      
      expect(config.features.proxy.target).toBe('http://localhost:9000');
      expect(config.features.proxy.cors).toBe(true); // From preset
      expect(config.features.compression).toBe(true); // From preset
    });

    test('should throw error for invalid preset', () => {
      expect(() => {
        applyPreset('invalid-preset');
      }).toThrow('Preset \'invalid-preset\' not found');
    });
  });

  describe('Preset defaults', () => {
    test('all presets should have SSL enabled', () => {
      const presets = getPresets();
      presets.forEach(preset => {
        const config = getPreset(preset.value);
        expect(config.ssl.enabled).toBe(true);
      });
    });

    test('all presets should have compression enabled except CDN origin', () => {
      const presets = getPresets();
      presets.forEach(preset => {
        const config = getPreset(preset.value);
        if (config.performance.profile !== 'cdn-origin') {
          expect(config.features.compression).toBe(true);
        }
      });
    });

    test('all presets should have HTTP/2 enabled', () => {
      const presets = getPresets();
      presets.forEach(preset => {
        const config = getPreset(preset.value);
        expect(config.ssl.http2).toBe(true);
      });
    });
  });
});
