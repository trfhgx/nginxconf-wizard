import { describe, it, expect, beforeEach } from '@jest/globals';
import Validator from '../src/core/Validator.js';

describe('Validator', () => {
  let validator;

  beforeEach(() => {
    validator = new Validator();
  });

  describe('validateDomain', () => {
    it('should accept valid domains', () => {
      expect(validator.validateDomain('example.com')).toBe(true);
      expect(validator.validateDomain('sub.example.com')).toBe(true);
      expect(validator.validateDomain('test-site.example.com')).toBe(true);
    });

    it('should accept localhost', () => {
      expect(validator.validateDomain('localhost')).toBe(true);
      expect(validator.validateDomain('127.0.0.1')).toBe(true);
    });

    it('should reject invalid domains', () => {
      expect(validator.validateDomain('invalid..domain')).toBe(false);
      expect(validator.validateDomain('')).toBe(false);
      expect(validator.validateDomain(null)).toBe(false);
    });
  });

  describe('validatePort', () => {
    it('should accept valid ports', () => {
      expect(validator.validatePort(80)).toBe(true);
      expect(validator.validatePort(443)).toBe(true);
      expect(validator.validatePort(8080)).toBe(true);
    });

    it('should reject invalid ports', () => {
      expect(validator.validatePort(0)).toBe(false);
      expect(validator.validatePort(-1)).toBe(false);
      expect(validator.validatePort(65536)).toBe(false);
      expect(validator.validatePort('80')).toBe(false);
    });

    it('should warn about privileged ports', () => {
      validator.validatePort(22);
      expect(validator.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validatePath', () => {
    it('should accept valid paths', () => {
      expect(validator.validatePath('/var/www')).toBe(true);
      expect(validator.validatePath('/etc/nginx')).toBe(true);
    });

    it('should reject directory traversal', () => {
      expect(validator.validatePath('../../../etc/passwd')).toBe(false);
      expect(validator.validatePath('/var/../../../etc')).toBe(false);
    });

    it('should warn about relative paths', () => {
      validator.clear();
      validator.validatePath('relative/path');
      expect(validator.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateIP', () => {
    it('should accept valid IPs', () => {
      expect(validator.validateIP('192.168.1.1')).toBe(true);
      expect(validator.validateIP('127.0.0.1')).toBe(true);
      expect(validator.validateIP('::1')).toBe(true);
      expect(validator.validateIP('2001:0db8:85a3::8a2e:0370:7334')).toBe(true);
    });

    it('should reject invalid IPs', () => {
      expect(validator.validateIP('256.1.1.1')).toBe(false);
      expect(validator.validateIP('not-an-ip')).toBe(false);
      expect(validator.validateIP('')).toBe(false);
    });
  });

  describe('validateURL', () => {
    it('should accept valid URLs', () => {
      expect(validator.validateURL('http://example.com')).toBe(true);
      expect(validator.validateURL('https://example.com')).toBe(true);
      expect(validator.validateURL('http://192.168.1.1:3000')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validator.validateURL('not-a-url')).toBe(false);
      expect(validator.validateURL('example.com')).toBe(false); // Missing protocol
      expect(validator.validateURL('')).toBe(false);
    });
  });

  describe('validateUpstream', () => {
    it('should accept valid upstream config', () => {
      const upstream = {
        host: 'localhost',
        port: 3000
      };
      expect(validator.validateUpstream(upstream)).toBe(true);
    });

    it('should accept optional fields', () => {
      const upstream = {
        host: 'localhost',
        port: 3000,
        weight: 2,
        maxFails: 3,
        failTimeout: '30s'
      };
      expect(validator.validateUpstream(upstream)).toBe(true);
    });

    it('should reject invalid upstream', () => {
      expect(validator.validateUpstream({ host: 'localhost' })).toBe(false);
      expect(validator.validateUpstream({ port: 3000 })).toBe(false);
    });
  });

  describe('validateSSL', () => {
    it('should accept valid SSL config', () => {
      const ssl = {
        enabled: true,
        provider: 'letsencrypt',
        http2: true
      };
      expect(validator.validateSSL(ssl)).toBe(true);
    });

    it('should require cert paths for custom provider', () => {
      const ssl = {
        enabled: true,
        provider: 'custom'
      };
      expect(validator.validateSSL(ssl)).toBe(false);
    });

    it('should warn about HTTP/3 without HTTP/2', () => {
      const ssl = {
        enabled: true,
        http2: false,
        http3: true
      };
      validator.validateSSL(ssl);
      expect(validator.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateConfig', () => {
    it('should validate complete config', () => {
      const config = {
        pattern: 'static-only',
        domain: {
          primary: 'example.com',
          aliases: ['www.example.com'],
          port: 80,
          httpsPort: 443
        },
        ssl: {
          enabled: true,
          provider: 'letsencrypt'
        }
      };

      const result = validator.validateConfig(config);
      expect(result.valid).toBe(true);
    });

    it('should detect missing required fields', () => {
      const config = {
        pattern: 'static-only'
      };

      const result = validator.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('error management', () => {
    it('should track errors', () => {
      validator.validateDomain('invalid..domain');
      expect(validator.getErrors().length).toBeGreaterThan(0);
    });

    it('should track warnings', () => {
      validator.validatePort(22);
      expect(validator.getWarnings().length).toBeGreaterThan(0);
    });

    it('should clear errors and warnings', () => {
      validator.validateDomain('invalid..domain');
      validator.validatePort(22);
      
      validator.clear();
      
      expect(validator.getErrors()).toHaveLength(0);
      expect(validator.getWarnings()).toHaveLength(0);
    });
  });
});
