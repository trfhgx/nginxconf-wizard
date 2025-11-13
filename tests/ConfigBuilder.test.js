import { describe, it, expect, beforeEach } from '@jest/globals';
import ConfigBuilder from '../src/core/ConfigBuilder.js';

describe('ConfigBuilder', () => {
  let builder;

  beforeEach(() => {
    builder = new ConfigBuilder();
  });

  describe('setPattern', () => {
    it('should set valid pattern', () => {
      builder.setPattern('static-only');
      expect(builder.config.pattern).toBe('static-only');
    });

    it('should throw error for invalid pattern', () => {
      expect(() => {
        builder.setPattern('invalid-pattern');
      }).toThrow('Invalid pattern');
    });

    it('should accept all valid patterns', () => {
      const patterns = [
        'static-only',
        'spa-with-api',
        'ssr-with-api',
        'combined-server',
        'hybrid',
        'microservices'
      ];

      patterns.forEach(pattern => {
        expect(() => builder.setPattern(pattern)).not.toThrow();
      });
    });
  });

  describe('setDomain', () => {
    it('should set domain configuration', () => {
      builder.setDomain({
        primary: 'example.com',
        aliases: ['www.example.com']
      });

      expect(builder.config.domain.primary).toBe('example.com');
      expect(builder.config.domain.aliases).toEqual(['www.example.com']);
    });

    it('should throw error without primary domain', () => {
      expect(() => {
        builder.setDomain({});
      }).toThrow('Primary domain is required');
    });

    it('should set default ports', () => {
      builder.setDomain({ primary: 'example.com' });
      
      expect(builder.config.domain.port).toBe(80);
      expect(builder.config.domain.httpsPort).toBe(443);
    });
  });

  describe('setSSL', () => {
    it('should configure SSL', () => {
      builder.setSSL({
        enabled: true,
        provider: 'letsencrypt',
        http2: true,
        http3: false
      });

      expect(builder.config.ssl.enabled).toBe(true);
      expect(builder.config.ssl.provider).toBe('letsencrypt');
      expect(builder.config.ssl.http2).toBe(true);
    });

    it('should handle disabled SSL', () => {
      builder.setSSL({ enabled: false });
      expect(builder.config.ssl.enabled).toBe(false);
    });
  });

  describe('validate', () => {
    it('should fail without pattern', () => {
      const result = builder.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Pattern is required');
    });

    it('should fail without domain', () => {
      builder.setPattern('static-only');
      const result = builder.validate();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Primary domain is required');
    });

    it('should pass with valid configuration', () => {
      builder.setPattern('static-only');
      builder.setDomain({ primary: 'example.com' });
      
      const result = builder.validate();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about HTTP/3 without HTTP/2', () => {
      builder.setPattern('static-only');
      builder.setDomain({ primary: 'example.com' });
      builder.setSSL({
        enabled: true,
        http2: false,
        http3: true
      });

      const result = builder.validate();
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(builder.config.ssl.http2).toBe(true); // Auto-enabled
    });
  });

  describe('exportState', () => {
    it('should export state file', () => {
      builder.setPattern('static-only');
      builder.setDomain({ primary: 'example.com' });
      
      const state = builder.exportState();
      
      expect(state.version).toBe('1.0.0');
      expect(state.pattern).toBe('static-only');
      expect(state.domain.primary).toBe('example.com');
      expect(state.generatedAt).toBeDefined();
    });
  });

  describe('importState', () => {
    it('should import state file', () => {
      const state = {
        pattern: 'spa-with-api',
        domain: { primary: 'test.com' },
        ssl: { enabled: true },
        performance: { profile: 'high-traffic' }
      };

      builder.importState(state);

      expect(builder.config.pattern).toBe('spa-with-api');
      expect(builder.config.domain.primary).toBe('test.com');
      expect(builder.config.ssl.enabled).toBe(true);
    });
  });

  describe('chaining', () => {
    it('should support method chaining', () => {
      expect(() => {
        builder
          .setPattern('static-only')
          .setDomain({ primary: 'example.com' })
          .setSSL({ enabled: true })
          .setPerformance({ profile: 'balanced' })
          .setSecurity({ headers: true });
      }).not.toThrow();
    });
  });
});
