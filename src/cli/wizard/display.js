import chalk from 'chalk';

/**
 * Display the configuration tree in a visual format
 */
export function displayTree(state) {
  console.log(chalk.white('nginx.conf'));
  console.log(chalk.gray('├── Global Settings'));
  console.log(chalk.gray(`│   ├── workers: ${state.globalSettings.workerProcesses}`));
  console.log(chalk.gray(`│   ├── connections: ${state.globalSettings.workerConnections}`));
  console.log(chalk.gray(`│   ├── compression: ${state.globalSettings.compression ? 'yes' : 'no'}`));
  console.log(chalk.gray(`│   └── security headers: ${state.globalSettings.securityHeaders ? 'yes' : 'no'}`));

  if (state.upstreams.length > 0) {
    console.log(chalk.gray('├── Global Upstreams'));
    state.upstreams.forEach((upstream, idx) => {
      const isLast = idx === state.upstreams.length - 1;
      const prefix = isLast ? '└──' : '├──';
      console.log(chalk.blue(`│   ${prefix} ${upstream.name} (${upstream.servers.length} servers)`));
    });
  }

  if (state.servers.length === 0) {
    console.log(chalk.yellow('└── (no servers configured)'));
  } else {
    console.log(chalk.gray('└── Servers'));
    state.servers.forEach((server, sIdx) => {
      const isLastServer = sIdx === state.servers.length - 1;
      const serverPrefix = isLastServer ? '    └──' : '    ├──';
      const childPrefix = isLastServer ? '        ' : '    │   ';
      
      const sslBadge = server.ssl?.enabled ? chalk.green(' [SSL]') : '';
      console.log(chalk.cyan(`${serverPrefix} ${server.domain.primary}${sslBadge}`));
      
      // Show upstreams
      if (server.upstreams?.length > 0) {
        console.log(chalk.gray(`${childPrefix}├── Upstreams`));
        server.upstreams.forEach((upstream, uIdx) => {
          const uPrefix = uIdx === server.upstreams.length - 1 ? '└──' : '├──';
          console.log(chalk.blue(`${childPrefix}│   ${uPrefix} ${upstream.name}`));
        });
      }

      // Show locations
      if (server.locations?.length > 0) {
        console.log(chalk.gray(`${childPrefix}└── Locations`));
        server.locations.forEach((loc, lIdx) => {
          const lPrefix = lIdx === server.locations.length - 1 ? '└──' : '├──';
          console.log(chalk.white(`${childPrefix}    ${lPrefix} ${loc.path} (${loc.type})`));
        });
      } else {
        console.log(chalk.yellow(`${childPrefix}└── (no locations)`));
      }
    });
  }
  console.log('');
}

/**
 * Show welcome message
 */
export function showWelcome() {
  console.log(chalk.cyan('\nNginx Configuration Wizard (Tree Mode)\n'));
  console.log(chalk.gray('Build your configuration by adding components one by one.'));
  console.log(chalk.gray('This flexible mode lets you create exactly what you need.\n'));
}

/**
 * Show success message
 */
export function showSuccess(message) {
  console.log(chalk.green(`\n${message}\n`));
}

/**
 * Show error message
 */
export function showError(message) {
  console.log(chalk.red(`\n${message}\n`));
}

/**
 * Show warning message
 */
export function showWarning(message) {
  console.log(chalk.yellow(`\n${message}\n`));
}

/**
 * Show info message
 */
export function showInfo(message) {
  console.log(chalk.gray(`\n  ${message}\n`));
}

/**
 * Show section header
 */
export function showSection(title) {
  console.log(chalk.cyan(`\n${title}\n`));
}

/**
 * Show next steps after configuration generation
 */
export function showNextSteps(state, outputDir) {
  const domain = state.servers[0]?.domain?.primary || 'example.com';
  const path = require('path');

  console.log(chalk.cyan('\nNext Steps:\n'));
  console.log(chalk.white('  1. Review the generated configuration:'));
  console.log(chalk.gray(`     cat ${outputDir || './'}nginx.conf\n`));

  console.log(chalk.white('  2. Test the configuration:'));
  console.log(chalk.gray(`     sudo nginx -t -c ${path.resolve(outputDir || '.', 'nginx.conf')}\n`));

  console.log(chalk.white('  3. Copy to nginx directory:'));
  console.log(chalk.gray(`     sudo cp nginx.conf /etc/nginx/sites-available/${domain}.conf`));
  console.log(chalk.gray(`     sudo ln -s /etc/nginx/sites-available/${domain}.conf /etc/nginx/sites-enabled/\n`));

  const hasSSL = state.servers.some(s => s.ssl?.enabled && s.ssl?.provider === 'letsencrypt');
  if (hasSSL) {
    const sslDomains = state.servers
      .filter(s => s.ssl?.enabled)
      .flatMap(s => [s.domain.primary, ...(s.domain.aliases || [])])
      .join(' -d ');
    console.log(chalk.white('  4. Obtain SSL certificate:'));
    console.log(chalk.gray(`     sudo certbot --nginx -d ${sslDomains}\n`));
  }

  console.log(chalk.white('  5. Reload nginx:'));
  console.log(chalk.gray('     sudo nginx -s reload\n'));

  console.log(chalk.gray('Tip: Keep nginx-wizard.json to reload and modify your config later.\n'));
}
