import { promises as fs } from 'fs';
import chalk from 'chalk';

/**
 * Validate nginx configuration file
 */
export async function validateConfig(configPath) {
  try {
    console.log(chalk.cyan(`\n🔍 Validating ${configPath}...\n`));

    // Check if file exists
    try {
      await fs.access(configPath);
    } catch {
      console.error(chalk.red(`✗ File not found: ${configPath}`));
      return false;
    }

    // Read config file
    const configContent = await fs.readFile(configPath, 'utf-8');

    // Check basic syntax
    const syntaxErrors = checkSyntax(configContent);
    if (syntaxErrors.length > 0) {
      console.log(chalk.red('✗ Syntax Errors:\n'));
      syntaxErrors.forEach(error => {
        console.log(chalk.red(`  Line ${error.line}: ${error.message}`));
      });
      return false;
    }

    // Check for common issues
    const warnings = checkCommonIssues(configContent);
    if (warnings.length > 0) {
      console.log(chalk.yellow('⚠ Warnings:\n'));
      warnings.forEach(warning => {
        console.log(chalk.yellow(`  ${warning}`));
      });
    }

    // Check for security best practices
    const securityIssues = checkSecurityBestPractices(configContent);
    if (securityIssues.length > 0) {
      console.log(chalk.yellow('\n⚠ Security Recommendations:\n'));
      securityIssues.forEach(issue => {
        console.log(chalk.yellow(`  ${issue}`));
      });
    }

    console.log(chalk.green('\n✓ Configuration is valid!'));

    if (warnings.length === 0 && securityIssues.length === 0) {
      console.log(chalk.green('✓ No warnings or issues detected'));
    }

    console.log(chalk.gray('\n💡 Tip: Run `nginx -t` to test with actual nginx binary\n'));

    return true;
  } catch (error) {
    console.error(chalk.red(`Error validating config: ${error.message}`));
    return false;
  }
}

/**
 * Check basic syntax
 */
function checkSyntax(content) {
  const errors = [];
  const lines = content.split('\n');

  let braceCount = 0;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith('#')) return;

    // Check for unmatched braces
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    braceCount += openBraces - closeBraces;

    // Check for missing semicolons
    if (
      trimmed &&
      !trimmed.endsWith('{') &&
      !trimmed.endsWith('}') &&
      !trimmed.endsWith(';') &&
      !trimmed.startsWith('#')
    ) {
      // Check if it's a directive that should have a semicolon
      if (trimmed.match(/^\w+/)) {
        errors.push({
          line: index + 1,
          message: 'Missing semicolon at end of directive'
        });
      }
    }
  });

  // Check for unmatched braces
  if (braceCount !== 0) {
    errors.push({
      line: lines.length,
      message: `Unmatched braces (${braceCount > 0 ? 'unclosed' : 'extra closing'})`
    });
  }

  return errors;
}

/**
 * Check common configuration issues
 */
function checkCommonIssues(content) {
  const warnings = [];

  // Check for duplicate server_name
  const serverNames = content.match(/server_name\s+([^;]+);/g);
  if (serverNames) {
    const names = serverNames.map(s =>
      s
        .replace(/server_name\s+/, '')
        .replace(';', '')
        .trim()
    );
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicates.length > 0) {
      warnings.push(`Duplicate server_name found: ${duplicates.join(', ')}`);
    }
  }

  // Check for listen on port 80 without SSL redirect
  const hasHttp = content.includes('listen 80') || content.includes('listen [::]:80');
  const hasHttpsRedirect = content.includes('return 301 https://');
  if (hasHttp && !hasHttpsRedirect && content.includes('listen 443')) {
    warnings.push('HTTP port 80 is open without redirect to HTTPS');
  }

  // Check for missing worker_processes
  if (!content.includes('worker_processes')) {
    warnings.push('worker_processes directive not found (nginx default: 1)');
  }

  // Check for missing worker_connections
  if (!content.includes('worker_connections')) {
    warnings.push('worker_connections directive not found (nginx default: 512)');
  }

  // Check for large client_max_body_size
  const bodySize = content.match(/client_max_body_size\s+(\d+)([kKmMgG]?)/);
  if (bodySize) {
    const size = parseInt(bodySize[1]);
    const unit = bodySize[2]?.toLowerCase() || '';
    if ((unit === 'g' && size > 1) || (unit === 'm' && size > 100)) {
      warnings.push(`Large client_max_body_size: ${bodySize[0]} (potential DoS risk)`);
    }
  }

  return warnings;
}

/**
 * Check security best practices
 */
function checkSecurityBestPractices(content) {
  const issues = [];

  // Check for SSL/TLS configuration
  if (content.includes('ssl_certificate')) {
    if (!content.includes('ssl_protocols')) {
      issues.push('Missing ssl_protocols directive (recommend TLSv1.2 TLSv1.3)');
    } else if (content.includes('TLSv1 ') || content.includes('TLSv1.1')) {
      issues.push('Using outdated TLS versions (TLSv1.0 or TLSv1.1)');
    }

    if (!content.includes('ssl_ciphers')) {
      issues.push('Missing ssl_ciphers directive');
    }

    if (!content.includes('ssl_prefer_server_ciphers')) {
      issues.push('Missing ssl_prefer_server_ciphers directive');
    }
  }

  // Check for security headers
  const securityHeaders = [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'X-XSS-Protection',
    'Strict-Transport-Security'
  ];

  securityHeaders.forEach(header => {
    if (!content.includes(header)) {
      issues.push(`Missing security header: ${header}`);
    }
  });

  // Check for server_tokens
  if (!content.includes('server_tokens off')) {
    issues.push('server_tokens not disabled (nginx version exposed)');
  }

  // Check for autoindex
  if (content.includes('autoindex on')) {
    issues.push('Directory listing enabled (autoindex on) - security risk');
  }

  // Check for default_server without explicit server_name
  const defaultServers = content.match(/listen[^;]+default_server[^;]*;/g);
  if (defaultServers && !content.includes('server_name _')) {
    issues.push('default_server without catch-all server_name _');
  }

  return issues;
}

export default { validateConfig };
