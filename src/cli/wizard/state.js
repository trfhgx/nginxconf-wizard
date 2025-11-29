/**
 * Generate unique ID for components
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new server object
 */
export function createServer(config) {
  return {
    id: generateId(),
    name: config.name || `server-${Date.now()}`,
    domain: {
      primary: config.domain,
      aliases: config.aliases || [],
      port: 80,
      httpsPort: 443
    },
    ssl: {
      enabled: config.ssl || false,
      provider: config.sslProvider,
      http2: config.http2 || false
    },
    locations: [],
    upstreams: []
  };
}

/**
 * Create a new location object
 */
export function createLocation(type, config) {
  return {
    id: generateId(),
    type,
    ...config
  };
}

/**
 * Create a new upstream object
 */
export function createUpstream(config) {
  return {
    id: generateId(),
    name: config.name,
    servers: config.servers,
    loadBalancing: config.loadBalancing,
    keepalive: config.keepalive,
    maxFails: config.maxFails,
    failTimeout: config.failTimeout
  };
}

/**
 * Create initial state
 */
export function createInitialState() {
  return {
    servers: [],
    upstreams: [],
    globalSettings: {}
  };
}

/**
 * Create global settings from prompt answers
 */
export function createGlobalSettings(answers) {
  return {
    workerProcesses: answers.customWorkers || answers.workerProcesses,
    workerConnections: answers.workerConnections,
    compression: answers.compression,
    securityHeaders: answers.securityHeaders
  };
}

/**
 * Convert preset to tree state
 */
export function presetToState(preset) {
  const state = createInitialState();
  
  state.globalSettings = {
    workerProcesses: 'auto',
    workerConnections: 1024,
    compression: preset.features?.compression ?? true,
    securityHeaders: preset.security?.headers ?? true
  };

  const server = {
    id: generateId(),
    name: 'default-server',
    domain: { primary: 'example.com', aliases: [] },
    ssl: preset.ssl || { enabled: false },
    locations: [],
    upstreams: []
  };

  // Add locations based on preset
  if (preset.features?.upstream?.ssrServers) {
    server.upstreams.push({
      id: generateId(),
      name: 'ssr_app',
      servers: preset.features.upstream.ssrServers,
      keepalive: 32
    });
    server.locations.push({
      id: generateId(),
      type: 'proxy',
      path: '/',
      upstream: 'ssr_app'
    });
  }

  if (preset.features?.proxy) {
    server.locations.push({
      id: generateId(),
      type: 'proxy',
      path: preset.features.proxy.path || '/api',
      target: preset.features.proxy.target,
      cors: preset.features.proxy.cors
    });
  }

  if (preset.features?.spa) {
    server.locations.push({
      id: generateId(),
      type: 'spa',
      path: '/',
      root: '/var/www/html'
    });
  }

  state.servers.push(server);
  return state;
}

/**
 * Find server by ID
 */
export function findServer(state, serverId) {
  return state.servers.find(s => s.id === serverId);
}

/**
 * Find location by ID
 */
export function findLocation(server, locationId) {
  return server.locations?.find(l => l.id === locationId);
}

/**
 * Find upstream by ID
 */
export function findUpstream(server, upstreamId) {
  return server.upstreams?.find(u => u.id === upstreamId);
}

/**
 * Remove server by ID
 */
export function removeServer(state, serverId) {
  state.servers = state.servers.filter(s => s.id !== serverId);
}

/**
 * Remove location by ID
 */
export function removeLocation(server, locationId) {
  server.locations = server.locations.filter(l => l.id !== locationId);
}

/**
 * Remove upstream by ID
 */
export function removeUpstream(server, upstreamId) {
  server.upstreams = server.upstreams.filter(u => u.id !== upstreamId);
}

/**
 * Update server domain settings
 */
export function updateServerDomain(server, domainConfig) {
  server.domain = {
    primary: domainConfig.domain,
    aliases: domainConfig.aliases,
    port: domainConfig.port,
    httpsPort: domainConfig.httpsPort
  };
}

/**
 * Update server SSL settings
 */
export function updateServerSSL(server, sslConfig) {
  server.ssl = {
    enabled: sslConfig.enabled,
    provider: sslConfig.provider,
    http2: sslConfig.http2,
    http3: sslConfig.http3,
    certPath: sslConfig.certPath,
    keyPath: sslConfig.keyPath
  };
}

/**
 * Update location in server
 */
export function updateLocation(server, locationId, newConfig) {
  const index = server.locations.findIndex(l => l.id === locationId);
  if (index !== -1) {
    const oldLocation = server.locations[index];
    server.locations[index] = {
      ...newConfig,
      id: oldLocation.id,
      type: oldLocation.type
    };
  }
}

/**
 * Update upstream in server
 */
export function updateUpstream(server, upstreamId, newConfig) {
  const index = server.upstreams.findIndex(u => u.id === upstreamId);
  if (index !== -1) {
    server.upstreams[index] = {
      ...server.upstreams[index],
      ...newConfig
    };
  }
}
