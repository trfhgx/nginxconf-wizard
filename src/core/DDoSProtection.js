/**
 * DDoSProtection - Connection and request limiting for DDoS mitigation
 */
class DDoSProtection {
  constructor() {
    this.config = {
      enabled: false,
      connectionLimits: {},
      requestLimits: {},
      timeouts: {}
    };
  }

  /**
   * Enable DDoS protection with profile
   */
  enable(profile = 'balanced') {
    this.config.enabled = true;
    return this.applyProfile(profile);
  }

  /**
   * Apply protection profile
   */
  applyProfile(profileName) {
    const profiles = {
      'strict': {
        connectionLimits: {
          perIP: 10,
          perServer: 512,
          zone: 'conn_limit_strict:10m'
        },
        requestLimits: {
          general: '10r/s',
          burst: 20,
          api: '5r/s',
          apiBurst: 10,
          login: '3r/m',
          loginBurst: 5
        },
        timeouts: {
          clientBody: 10,
          clientHeader: 10,
          send: 10,
          keepalive: 30,
          keepaliveRequests: 50
        }
      },

      'balanced': {
        connectionLimits: {
          perIP: 20,
          perServer: 1024,
          zone: 'conn_limit_balanced:10m'
        },
        requestLimits: {
          general: '100r/s',
          burst: 50,
          api: '20r/s',
          apiBurst: 20,
          login: '5r/m',
          loginBurst: 10
        },
        timeouts: {
          clientBody: 30,
          clientHeader: 30,
          send: 30,
          keepalive: 65,
          keepaliveRequests: 100
        }
      },

      'permissive': {
        connectionLimits: {
          perIP: 50,
          perServer: 2048,
          zone: 'conn_limit_permissive:10m'
        },
        requestLimits: {
          general: '200r/s',
          burst: 100,
          api: '50r/s',
          apiBurst: 50,
          login: '10r/m',
          loginBurst: 20
        },
        timeouts: {
          clientBody: 60,
          clientHeader: 60,
          send: 60,
          keepalive: 75,
          keepaliveRequests: 200
        }
      }
    };

    const profile = profiles[profileName] || profiles['balanced'];
    Object.assign(this.config, profile);
    return this.config;
  }

  /**
   * Generate http-level directives
   */
  generateHttpDirectives() {
    if (!this.config.enabled) return '';

    const directives = [];

    // Connection limit zone
    if (this.config.connectionLimits) {
      directives.push(
        `limit_conn_zone $binary_remote_addr zone=${this.config.connectionLimits.zone};`
      );
    }

    // Request limit zones
    if (this.config.requestLimits) {
      directives.push(
        `limit_req_zone $binary_remote_addr zone=general_limit:10m rate=${this.config.requestLimits.general};`
      );
      directives.push(
        `limit_req_zone $binary_remote_addr zone=api_limit:10m rate=${this.config.requestLimits.api};`
      );
      directives.push(
        `limit_req_zone $binary_remote_addr zone=login_limit:10m rate=${this.config.requestLimits.login};`
      );
    }

    // Timeouts
    if (this.config.timeouts) {
      directives.push(
        `client_body_timeout ${this.config.timeouts.clientBody}s;`
      );
      directives.push(
        `client_header_timeout ${this.config.timeouts.clientHeader}s;`
      );
      directives.push(
        `send_timeout ${this.config.timeouts.send}s;`
      );
      directives.push(
        `keepalive_timeout ${this.config.timeouts.keepalive}s;`
      );
      directives.push(
        `keepalive_requests ${this.config.timeouts.keepaliveRequests};`
      );
    }

    // Request size limits
    directives.push('client_max_body_size 10m;');
    directives.push('client_body_buffer_size 128k;');
    directives.push('client_header_buffer_size 1k;');
    directives.push('large_client_header_buffers 4 8k;');

    return directives.join('\n');
  }

  /**
   * Generate server-level directives
   */
  generateServerDirectives() {
    if (!this.config.enabled) return '';

    const directives = [];

    // Connection limit
    if (this.config.connectionLimits) {
      const zoneName = this.config.connectionLimits.zone.split(':')[0];
      directives.push(
        `limit_conn ${zoneName} ${this.config.connectionLimits.perIP};`
      );
      directives.push(
        'limit_conn_status 429;'
      );
    }

    // General request rate limit
    if (this.config.requestLimits) {
      directives.push(
        `limit_req zone=general_limit burst=${this.config.requestLimits.burst} nodelay;`
      );
      directives.push(
        'limit_req_status 429;'
      );
    }

    return directives.join('\n    ');
  }

  /**
   * Generate location-specific directives for API endpoints
   */
  generateAPILocationDirectives() {
    if (!this.config.enabled || !this.config.requestLimits) return '';

    return `limit_req zone=api_limit burst=${this.config.requestLimits.apiBurst} nodelay;`;
  }

  /**
   * Generate location-specific directives for login endpoints
   */
  generateLoginLocationDirectives() {
    if (!this.config.enabled || !this.config.requestLimits) return '';

    return `limit_req zone=login_limit burst=${this.config.requestLimits.loginBurst} nodelay;`;
  }

  /**
   * Get recommended fail2ban filter
   */
  getFail2banFilter() {
    return {
      filterName: 'nginx-limit-req',
      filterContent: `# Fail2Ban filter for nginx limit_req
[Definition]
failregex = limiting requests, excess:.* by zone.*client: <HOST>
            limiting connections by zone.*client: <HOST>
ignoreregex =`,
      jailConfig: `# Fail2Ban jail for nginx rate limiting
[nginx-limit-req]
enabled = true
port = http,https
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 5
findtime = 600
bantime = 3600
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]`
    };
  }

  /**
   * Get slow client attack protection
   */
  getSlowClientProtection() {
    return {
      clientBodyTimeout: 10,
      clientHeaderTimeout: 10,
      resetTimedoutConnection: true,
      sendTimeout: 10,
      slowlorisProtection: true
    };
  }

  /**
   * Generate complete DDoS protection config
   */
  generateComplete() {
    return {
      http: this.generateHttpDirectives(),
      server: this.generateServerDirectives(),
      api: this.generateAPILocationDirectives(),
      login: this.generateLoginLocationDirectives(),
      fail2ban: this.getFail2banFilter(),
      slowClient: this.getSlowClientProtection()
    };
  }
}

export default DDoSProtection;
