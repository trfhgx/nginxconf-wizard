// State management
const state = {
  globalSettings: {
    workerProcesses: 'auto',
    workerConnections: 1024,
    compression: true,
    sendfile: true,
    tcpNopush: true,
    securityHeaders: true,
    hideVersion: false
  },
  servers: [],
  upstreams: []
};

// Current editing context
let editingServerId = null;
let editingLocationIdx = null;
let tempLocations = [];
let tempUpstreamServers = [];

// Generate unique IDs
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initGlobalSettings();
  initModals();
  initServerModal();
  initLocationModal();
  initUpstreamModal();
  initPreviewActions();
  updatePreview();
});

// Tab switching
function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(`tab-${tabId}`).classList.add('active');
    });
  });
}

// Global settings
function initGlobalSettings() {
  const fields = ['workerProcesses', 'workerConnections', 'compression', 'sendfile', 'tcpNopush', 'securityHeaders', 'hideVersion'];
  
  fields.forEach(field => {
    const el = document.getElementById(field);
    if (!el) return;
    
    const isCheckbox = el.type === 'checkbox';
    el.addEventListener('change', () => {
      state.globalSettings[field] = isCheckbox ? el.checked : el.value;
      updatePreview();
    });
  });
}

// Modal helpers
function initModals() {
  document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal').classList.remove('active');
    });
  });
  
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });
}

// Server Modal
function initServerModal() {
  document.getElementById('addServerBtn').addEventListener('click', () => {
    editingServerId = null;
    resetServerModal();
    document.getElementById('serverModalTitle').textContent = 'Add Server';
    document.getElementById('serverModal').classList.add('active');
  });
  
  document.getElementById('sslEnabled').addEventListener('change', (e) => {
    document.getElementById('sslOptions').style.display = e.target.checked ? 'block' : 'none';
    if (e.target.checked) {
      document.getElementById('serverPort').value = 443;
    }
  });
  
  document.getElementById('sslProvider').addEventListener('change', (e) => {
    document.getElementById('customCertOptions').style.display = e.target.value === 'custom' ? 'block' : 'none';
  });
  
  document.getElementById('addLocationBtn').addEventListener('click', () => {
    editingLocationIdx = null;
    resetLocationModal();
    document.getElementById('locationModal').classList.add('active');
  });
  
  document.getElementById('saveServerBtn').addEventListener('click', saveServer);
}

function resetServerModal() {
  document.getElementById('serverDomain').value = '';
  document.getElementById('serverAliases').value = '';
  document.getElementById('serverPort').value = 80;
  document.getElementById('sslEnabled').checked = false;
  document.getElementById('sslOptions').style.display = 'none';
  document.getElementById('sslProvider').value = 'letsencrypt';
  document.getElementById('sslRedirect').checked = true;
  document.getElementById('http2').checked = true;
  tempLocations = [];
  renderLocationsList();
}

function saveServer() {
  const domain = document.getElementById('serverDomain').value.trim();
  if (!domain) {
    showToast('Please enter a domain', 'error');
    return;
  }
  
  if (tempLocations.length === 0) {
    showToast('Please add at least one location', 'error');
    return;
  }
  
  const server = {
    id: editingServerId || generateId(),
    domain: {
      primary: domain,
      aliases: document.getElementById('serverAliases').value.split(',').map(s => s.trim()).filter(Boolean)
    },
    port: parseInt(document.getElementById('serverPort').value) || 80,
    ssl: {
      enabled: document.getElementById('sslEnabled').checked,
      provider: document.getElementById('sslProvider').value,
      certPath: document.getElementById('sslCertPath')?.value || '',
      keyPath: document.getElementById('sslKeyPath')?.value || '',
      redirect: document.getElementById('sslRedirect').checked,
      http2: document.getElementById('http2').checked
    },
    locations: tempLocations,
    upstreams: []
  };
  
  if (editingServerId) {
    const idx = state.servers.findIndex(s => s.id === editingServerId);
    if (idx !== -1) state.servers[idx] = server;
  } else {
    state.servers.push(server);
  }
  
  document.getElementById('serverModal').classList.remove('active');
  renderServersList();
  updatePreview();
  showToast('Server saved successfully', 'success');
}

function editServer(id) {
  const server = state.servers.find(s => s.id === id);
  if (!server) return;
  
  editingServerId = id;
  document.getElementById('serverModalTitle').textContent = 'Edit Server';
  document.getElementById('serverDomain').value = server.domain.primary;
  document.getElementById('serverAliases').value = server.domain.aliases?.join(', ') || '';
  document.getElementById('serverPort').value = server.port || 80;
  document.getElementById('sslEnabled').checked = server.ssl?.enabled || false;
  document.getElementById('sslOptions').style.display = server.ssl?.enabled ? 'block' : 'none';
  document.getElementById('sslProvider').value = server.ssl?.provider || 'letsencrypt';
  document.getElementById('sslRedirect').checked = server.ssl?.redirect !== false;
  document.getElementById('http2').checked = server.ssl?.http2 !== false;
  tempLocations = [...server.locations];
  renderLocationsList();
  
  document.getElementById('serverModal').classList.add('active');
}

function deleteServer(id) {
  if (confirm('Are you sure you want to delete this server?')) {
    state.servers = state.servers.filter(s => s.id !== id);
    renderServersList();
    updatePreview();
    showToast('Server deleted', 'success');
  }
}

function renderServersList() {
  const container = document.getElementById('serversList');
  
  if (state.servers.length === 0) {
    container.innerHTML = '<div class="empty-state">No servers configured. Click "Add Server" to start.</div>';
    return;
  }
  
  container.innerHTML = state.servers.map(server => `
    <div class="list-item">
      <div class="list-item-info">
        <div class="list-item-title">${server.domain.primary}${server.ssl?.enabled ? ' [SSL]' : ''}</div>
        <div class="list-item-subtitle">${server.locations.length} location(s)</div>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-secondary btn-sm" onclick="editServer('${server.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteServer('${server.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

// Location Modal
function initLocationModal() {
  const typeSelect = document.getElementById('locationType');
  const typeHelp = {
    static: 'Serve static files (HTML, CSS, JS, images) directly from disk.',
    spa: 'Single Page Application with client-side routing. Returns index.html for all routes.',
    proxy: 'Forward requests to a backend server (Node.js, Python, etc.).',
    api: 'API endpoint with optional CORS and rate limiting.',
    websocket: 'WebSocket connection with upgrade headers.',
    redirect: 'Redirect requests to another URL.',
    health: 'Health check endpoint for load balancers.'
  };
  
  typeSelect.addEventListener('change', () => {
    const type = typeSelect.value;
    document.getElementById('locationTypeHelp').textContent = typeHelp[type];
    
    // Hide all options
    document.querySelectorAll('.location-options').forEach(el => el.style.display = 'none');
    
    // Show relevant options
    if (type === 'static' || type === 'spa') {
      document.getElementById('staticOptions').style.display = 'block';
      document.getElementById('spaFallbackGroup').style.display = type === 'spa' ? 'block' : 'none';
      document.getElementById('locationPath').value = '/';
    } else if (type === 'proxy') {
      document.getElementById('proxyOptions').style.display = 'block';
      document.getElementById('locationPath').value = '/';
    } else if (type === 'api') {
      document.getElementById('apiOptions').style.display = 'block';
      document.getElementById('locationPath').value = '/api';
    } else if (type === 'websocket') {
      document.getElementById('proxyOptions').style.display = 'block';
      document.getElementById('proxyWebsocket').checked = true;
      document.getElementById('locationPath').value = '/ws';
    } else if (type === 'redirect') {
      document.getElementById('redirectOptions').style.display = 'block';
      document.getElementById('locationPath').value = '/old-path';
    } else if (type === 'health') {
      document.getElementById('healthOptions').style.display = 'block';
      document.getElementById('locationPath').value = '/health';
    }
  });
  
  document.getElementById('apiCors').addEventListener('change', (e) => {
    document.getElementById('corsOptions').style.display = e.target.checked ? 'block' : 'none';
  });
  
  document.getElementById('apiRateLimit').addEventListener('change', (e) => {
    document.getElementById('rateLimitOptions').style.display = e.target.checked ? 'block' : 'none';
  });
  
  document.getElementById('saveLocationBtn').addEventListener('click', saveLocation);
}

function resetLocationModal() {
  document.getElementById('locationType').value = 'static';
  document.getElementById('locationType').dispatchEvent(new Event('change'));
  document.getElementById('locationPath').value = '/';
  document.getElementById('staticRoot').value = '';
  document.getElementById('staticIndex').value = 'index.html';
  document.getElementById('proxyTarget').value = '';
  document.getElementById('proxyWebsocket').checked = false;
  document.getElementById('proxyTimeout').value = 60;
  document.getElementById('apiTarget').value = '';
  document.getElementById('apiCors').checked = false;
  document.getElementById('apiRateLimit').checked = false;
}

function saveLocation() {
  const type = document.getElementById('locationType').value;
  const path = document.getElementById('locationPath').value.trim();
  
  if (!path) {
    showToast('Please enter a path', 'error');
    return;
  }
  
  const location = {
    id: editingLocationIdx !== null ? tempLocations[editingLocationIdx].id : generateId(),
    type,
    path
  };
  
  if (type === 'static' || type === 'spa') {
    location.root = document.getElementById('staticRoot').value.trim();
    location.index = document.getElementById('staticIndex').value.trim();
    if (type === 'spa') {
      location.fallback = document.getElementById('spaFallback').checked;
    }
    if (!location.root) {
      showToast('Please enter a root directory', 'error');
      return;
    }
  } else if (type === 'proxy' || type === 'websocket') {
    location.target = document.getElementById('proxyTarget').value.trim();
    location.websocket = document.getElementById('proxyWebsocket').checked;
    location.timeout = parseInt(document.getElementById('proxyTimeout').value) || 60;
    if (!location.target) {
      showToast('Please enter a backend URL', 'error');
      return;
    }
  } else if (type === 'api') {
    location.target = document.getElementById('apiTarget').value.trim();
    location.cors = document.getElementById('apiCors').checked;
    location.corsOrigin = document.getElementById('corsOrigin').value.trim() || '*';
    location.rateLimit = document.getElementById('apiRateLimit').checked;
    location.rateLimitValue = parseInt(document.getElementById('rateLimit').value) || 10;
    location.rateLimitBurst = parseInt(document.getElementById('rateBurst').value) || 20;
    if (!location.target) {
      showToast('Please enter an API backend URL', 'error');
      return;
    }
  } else if (type === 'redirect') {
    location.redirectTarget = document.getElementById('redirectTarget').value.trim();
    location.redirectCode = parseInt(document.getElementById('redirectCode').value);
    if (!location.redirectTarget) {
      showToast('Please enter a redirect target', 'error');
      return;
    }
  } else if (type === 'health') {
    location.response = document.getElementById('healthResponse').value.trim() || 'OK';
  }
  
  if (editingLocationIdx !== null) {
    tempLocations[editingLocationIdx] = location;
  } else {
    tempLocations.push(location);
  }
  
  document.getElementById('locationModal').classList.remove('active');
  renderLocationsList();
}

function editLocation(idx) {
  const location = tempLocations[idx];
  if (!location) return;
  
  editingLocationIdx = idx;
  document.getElementById('locationType').value = location.type;
  document.getElementById('locationType').dispatchEvent(new Event('change'));
  document.getElementById('locationPath').value = location.path;
  
  if (location.type === 'static' || location.type === 'spa') {
    document.getElementById('staticRoot').value = location.root || '';
    document.getElementById('staticIndex').value = location.index || 'index.html';
    if (location.type === 'spa') {
      document.getElementById('spaFallback').checked = location.fallback !== false;
    }
  } else if (location.type === 'proxy' || location.type === 'websocket') {
    document.getElementById('proxyTarget').value = location.target || '';
    document.getElementById('proxyWebsocket').checked = location.websocket || false;
    document.getElementById('proxyTimeout').value = location.timeout || 60;
  } else if (location.type === 'api') {
    document.getElementById('apiTarget').value = location.target || '';
    document.getElementById('apiCors').checked = location.cors || false;
    document.getElementById('corsOrigin').value = location.corsOrigin || '*';
    document.getElementById('apiRateLimit').checked = location.rateLimit || false;
    document.getElementById('rateLimit').value = location.rateLimitValue || 10;
    document.getElementById('rateBurst').value = location.rateLimitBurst || 20;
  } else if (location.type === 'redirect') {
    document.getElementById('redirectTarget').value = location.redirectTarget || '';
    document.getElementById('redirectCode').value = location.redirectCode || 301;
  } else if (location.type === 'health') {
    document.getElementById('healthResponse').value = location.response || 'OK';
  }
  
  document.getElementById('locationModal').classList.add('active');
}

function deleteLocation(idx) {
  tempLocations.splice(idx, 1);
  renderLocationsList();
}

function renderLocationsList() {
  const container = document.getElementById('locationsList');
  
  if (tempLocations.length === 0) {
    container.innerHTML = '<div class="empty-state">No locations. Add at least one location.</div>';
    return;
  }
  
  container.innerHTML = tempLocations.map((loc, idx) => `
    <div class="list-item">
      <div class="list-item-info">
        <div class="list-item-title">${loc.path}</div>
        <div class="list-item-subtitle">${loc.type}</div>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-secondary btn-sm" onclick="editLocation(${idx})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteLocation(${idx})">Delete</button>
      </div>
    </div>
  `).join('');
}

// Upstream Modal
function initUpstreamModal() {
  document.getElementById('addUpstreamBtn').addEventListener('click', () => {
    resetUpstreamModal();
    document.getElementById('upstreamModal').classList.add('active');
  });
  
  const methodHelp = {
    'round-robin': 'Round Robin distributes requests evenly across all servers in sequence.',
    'least_conn': 'Least Connections sends requests to the server with fewest active connections.',
    'ip_hash': 'IP Hash ensures requests from the same client IP always go to the same server (sticky sessions).'
  };
  
  document.getElementById('upstreamMethod').addEventListener('change', (e) => {
    document.getElementById('upstreamMethodHelp').textContent = methodHelp[e.target.value];
  });
  
  document.getElementById('addUpstreamServerBtn').addEventListener('click', () => {
    const addr = document.getElementById('upstreamServerAddr').value.trim();
    const weight = parseInt(document.getElementById('upstreamServerWeight').value) || 1;
    
    if (!addr) {
      showToast('Please enter a server address', 'error');
      return;
    }
    
    tempUpstreamServers.push({ address: addr, weight });
    document.getElementById('upstreamServerAddr').value = '';
    document.getElementById('upstreamServerWeight').value = 1;
    renderUpstreamServersList();
  });
  
  document.getElementById('saveUpstreamBtn').addEventListener('click', saveUpstream);
}

function resetUpstreamModal() {
  document.getElementById('upstreamName').value = '';
  document.getElementById('upstreamMethod').value = 'round-robin';
  document.getElementById('upstreamKeepalive').value = 32;
  tempUpstreamServers = [];
  renderUpstreamServersList();
}

function saveUpstream() {
  const name = document.getElementById('upstreamName').value.trim();
  
  if (!name) {
    showToast('Please enter an upstream name', 'error');
    return;
  }
  
  if (tempUpstreamServers.length === 0) {
    showToast('Please add at least one server', 'error');
    return;
  }
  
  const upstream = {
    id: generateId(),
    name,
    method: document.getElementById('upstreamMethod').value,
    servers: tempUpstreamServers,
    keepalive: parseInt(document.getElementById('upstreamKeepalive').value) || 32
  };
  
  state.upstreams.push(upstream);
  document.getElementById('upstreamModal').classList.remove('active');
  renderUpstreamsList();
  updatePreview();
  showToast('Upstream saved', 'success');
}

function deleteUpstream(id) {
  if (confirm('Delete this upstream?')) {
    state.upstreams = state.upstreams.filter(u => u.id !== id);
    renderUpstreamsList();
    updatePreview();
  }
}

function renderUpstreamServersList() {
  const container = document.getElementById('upstreamServersList');
  
  if (tempUpstreamServers.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding: 10px;">No servers added yet.</div>';
    return;
  }
  
  container.innerHTML = tempUpstreamServers.map((srv, idx) => `
    <div class="list-item">
      <div class="list-item-info">
        <div class="list-item-title">${srv.address}</div>
        <div class="list-item-subtitle">weight: ${srv.weight}</div>
      </div>
      <button class="btn btn-danger btn-sm" onclick="tempUpstreamServers.splice(${idx}, 1); renderUpstreamServersList();">Remove</button>
    </div>
  `).join('');
}

function renderUpstreamsList() {
  const container = document.getElementById('upstreamsList');
  
  if (state.upstreams.length === 0) {
    container.innerHTML = '<div class="empty-state">No global upstreams configured.</div>';
    return;
  }
  
  container.innerHTML = state.upstreams.map(upstream => `
    <div class="list-item">
      <div class="list-item-info">
        <div class="list-item-title">${upstream.name}</div>
        <div class="list-item-subtitle">${upstream.servers.length} server(s), ${upstream.method}</div>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-danger btn-sm" onclick="deleteUpstream('${upstream.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

// Preview
function initPreviewActions() {
  document.getElementById('copyBtn').addEventListener('click', () => {
    const config = document.getElementById('configPreview').textContent;
    navigator.clipboard.writeText(config).then(() => {
      showToast('Copied to clipboard', 'success');
    });
  });
  
  document.getElementById('downloadBtn').addEventListener('click', () => {
    const config = document.getElementById('configPreview').textContent;
    const blob = new Blob([config], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nginx.conf';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded nginx.conf', 'success');
  });
}

async function updatePreview() {
  const preview = document.getElementById('configPreview');
  const messages = document.getElementById('validationMessages');
  
  if (state.servers.length === 0) {
    preview.innerHTML = '<code># Your nginx configuration will appear here\n# Add at least one server to generate config</code>';
    messages.innerHTML = '';
    return;
  }
  
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      preview.innerHTML = `<code>${highlightConfig(data.config)}</code>`;
      
      if (data.warnings?.length > 0) {
        messages.innerHTML = data.warnings.map(w => `<div class="validation-warning">Warning: ${w}</div>`).join('');
      } else {
        messages.innerHTML = '';
      }
    } else {
      preview.innerHTML = `<code># Error generating config\n# ${data.error}</code>`;
      if (data.errors) {
        messages.innerHTML = data.errors.map(e => `<div class="validation-error">Error: ${e}</div>`).join('');
      }
    }
  } catch (error) {
    // Generate client-side if server unavailable
    preview.innerHTML = `<code>${highlightConfig(generateConfigLocally())}</code>`;
    messages.innerHTML = '';
  }
}

function highlightConfig(config) {
  return config
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(#.*$)/gm, '<span class="config-comment">$1</span>')
    .replace(/\b(server|location|upstream|http|events|worker_processes|worker_connections|include|server_name|listen|root|index|proxy_pass|ssl_certificate|ssl_certificate_key|gzip|add_header|return|try_files|proxy_set_header|proxy_http_version|keepalive|limit_req|limit_req_zone)\b/g, '<span class="config-keyword">$1</span>')
    .replace(/"([^"]*)"/g, '"<span class="config-string">$1</span>"')
    .replace(/\b(\d+)\b/g, '<span class="config-number">$1</span>');
}

// Fallback client-side generation
function generateConfigLocally() {
  let config = `# Generated by Nginx Configuration Wizard
# ${new Date().toISOString()}

worker_processes ${state.globalSettings.workerProcesses};

events {
    worker_connections ${state.globalSettings.workerConnections};
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    
    sendfile ${state.globalSettings.sendfile ? 'on' : 'off'};
    tcp_nopush ${state.globalSettings.tcpNopush ? 'on' : 'off'};
    keepalive_timeout 65;
`;

  if (state.globalSettings.compression) {
    config += `
    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;
`;
  }

  // Upstreams
  state.upstreams.forEach(upstream => {
    config += `
    upstream ${upstream.name} {
`;
    if (upstream.method === 'least_conn') {
      config += '        least_conn;\n';
    } else if (upstream.method === 'ip_hash') {
      config += '        ip_hash;\n';
    }
    upstream.servers.forEach(srv => {
      config += `        server ${srv.address}${srv.weight > 1 ? ` weight=${srv.weight}` : ''};\n`;
    });
    if (upstream.keepalive) {
      config += `        keepalive ${upstream.keepalive};\n`;
    }
    config += '    }\n';
  });

  // Servers
  state.servers.forEach(server => {
    if (server.ssl?.enabled && server.ssl?.redirect) {
      config += `
    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name ${server.domain.primary}${server.domain.aliases?.length ? ' ' + server.domain.aliases.join(' ') : ''};
        return 301 https://$server_name$request_uri;
    }
`;
    }

    config += `
    server {
        listen ${server.port}${server.ssl?.enabled ? ' ssl' : ''}${server.ssl?.http2 ? ' http2' : ''};
        server_name ${server.domain.primary}${server.domain.aliases?.length ? ' ' + server.domain.aliases.join(' ') : ''};
`;

    if (server.ssl?.enabled) {
      if (server.ssl.provider === 'letsencrypt') {
        config += `
        ssl_certificate /etc/letsencrypt/live/${server.domain.primary}/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/${server.domain.primary}/privkey.pem;
`;
      } else if (server.ssl.provider === 'custom') {
        config += `
        ssl_certificate ${server.ssl.certPath};
        ssl_certificate_key ${server.ssl.keyPath};
`;
      }
    }

    if (state.globalSettings.securityHeaders) {
      config += `
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
`;
    }

    server.locations.forEach(loc => {
      config += `
        location ${loc.path} {
`;
      if (loc.type === 'static') {
        config += `            root ${loc.root};
            index ${loc.index || 'index.html'};
`;
      } else if (loc.type === 'spa') {
        config += `            root ${loc.root};
            index ${loc.index || 'index.html'};
            try_files $uri $uri/ /index.html;
`;
      } else if (loc.type === 'proxy' || loc.type === 'websocket' || loc.type === 'api') {
        config += `            proxy_pass ${loc.target};
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
`;
        if (loc.websocket || loc.type === 'websocket') {
          config += `            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
`;
        }
        if (loc.cors) {
          config += `            add_header Access-Control-Allow-Origin "${loc.corsOrigin || '*'}";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type";
`;
        }
      } else if (loc.type === 'redirect') {
        config += `            return ${loc.redirectCode || 301} ${loc.redirectTarget};
`;
      } else if (loc.type === 'health') {
        config += `            return 200 '${loc.response || 'OK'}';
            add_header Content-Type text/plain;
`;
      }
      config += '        }\n';
    });

    config += '    }\n';
  });

  config += '}\n';
  return config;
}

// Toast notifications
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Expose functions for onclick handlers
window.editServer = editServer;
window.deleteServer = deleteServer;
window.editLocation = editLocation;
window.deleteLocation = deleteLocation;
window.deleteUpstream = deleteUpstream;
window.tempUpstreamServers = tempUpstreamServers;
window.renderUpstreamServersList = renderUpstreamServersList;
