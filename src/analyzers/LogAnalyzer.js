/**
 * Log Analysis Tool
 * Analyzes nginx access and error logs for performance insights and security issues
 */

class LogAnalyzer {
  constructor() {
    this.stats = {};
    this.recommendations = [];
  }

  /**
   * Analyze nginx access or error logs
   * @param {string} content - Raw log content
   * @param {string} type - Log type: 'access' or 'error'
   * @returns {Object} Analysis results with recommendations
   */
  analyze(content, type = 'auto') {
    // Auto-detect log type
    if (type === 'auto') {
      type = this.detectLogType(content);
    }

    const lines = content.split('\n').filter(line => line.trim());

    if (type === 'access') {
      return this.analyzeAccessLog(lines);
    } else if (type === 'error') {
      return this.analyzeErrorLog(lines);
    }

    throw new Error(`Unknown log type: ${type}`);
  }

  /**
   * Auto-detect log type
   */
  detectLogType(content) {
    // Error logs typically start with date in format: 2024/01/01 12:00:00
    // Access logs have HTTP method and status codes
    if (content.match(/\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}\s+\[error\]/)) {
      return 'error';
    }
    if (content.match(/(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+.*?\s+HTTP\/[\d.]+/)) {
      return 'access';
    }

    throw new Error('Could not detect log type. Please specify type explicitly.');
  }

  /**
   * Analyze access logs
   */
  analyzeAccessLog(lines) {
    const results = {
      type: 'access',
      totalRequests: lines.length,
      timeRange: {},
      statusCodes: {},
      methods: {},
      paths: {},
      userAgents: {},
      responseTimes: [],
      recommendations: []
    };

    const pathCounts = {};
    const statusCounts = {};
    const methodCounts = {};
    const userAgentCounts = {};
    const ips = {};

    lines.forEach(line => {
      // Parse common log formats
      const parsed = this.parseAccessLogLine(line);
      if (!parsed) return;

      // Status codes
      statusCounts[parsed.status] = (statusCounts[parsed.status] || 0) + 1;

      // HTTP methods
      methodCounts[parsed.method] = (methodCounts[parsed.method] || 0) + 1;

      // Paths
      pathCounts[parsed.path] = (pathCounts[parsed.path] || 0) + 1;

      // User agents
      if (parsed.userAgent) {
        userAgentCounts[parsed.userAgent] = (userAgentCounts[parsed.userAgent] || 0) + 1;
      }

      // IPs
      ips[parsed.ip] = (ips[parsed.ip] || 0) + 1;

      // Response times
      if (parsed.responseTime) {
        results.responseTimes.push(parsed.responseTime);
      }
    });

    // Calculate statistics
    results.statusCodes = statusCounts;
    results.methods = methodCounts;

    // Top paths
    results.topPaths = Object.entries(pathCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count, percentage: ((count / lines.length) * 100).toFixed(2) }));

    // Top IPs
    results.topIPs = Object.entries(ips)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count, percentage: ((count / lines.length) * 100).toFixed(2) }));

    // User agent analysis
    const botAgents = Object.entries(userAgentCounts)
      .filter(([ua]) => this.isBot(ua))
      .reduce((sum, [, count]) => sum + count, 0);

    results.botTraffic = {
      count: botAgents,
      percentage: ((botAgents / lines.length) * 100).toFixed(2)
    };

    // Response time analysis
    if (results.responseTimes.length > 0) {
      results.responseTimeStats = {
        avg: this.average(results.responseTimes),
        median: this.median(results.responseTimes),
        p95: this.percentile(results.responseTimes, 95),
        p99: this.percentile(results.responseTimes, 99),
        max: Math.max(...results.responseTimes)
      };
    }

    // Status code breakdown
    const statusBreakdown = this.categorizeStatusCodes(statusCounts, lines.length);
    results.statusBreakdown = statusBreakdown;

    // Generate recommendations
    results.recommendations = this.generateAccessLogRecommendations(results);
    results.securityIssues = this.detectSecurityIssues(results);

    return results;
  }

  /**
   * Analyze error logs
   */
  analyzeErrorLog(lines) {
    const results = {
      type: 'error',
      totalErrors: lines.length,
      errorLevels: {},
      errorTypes: {},
      topErrors: [],
      recommendations: []
    };

    const levelCounts = {};
    const errorMessages = {};

    lines.forEach(line => {
      const parsed = this.parseErrorLogLine(line);
      if (!parsed) return;

      // Error levels
      levelCounts[parsed.level] = (levelCounts[parsed.level] || 0) + 1;

      // Error messages
      const errorKey = parsed.message.substring(0, 100); // Group similar errors
      errorMessages[errorKey] = (errorMessages[errorKey] || 0) + 1;
    });

    results.errorLevels = levelCounts;

    // Top errors
    results.topErrors = Object.entries(errorMessages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([message, count]) => ({ message, count, percentage: ((count / lines.length) * 100).toFixed(2) }));

    // Generate recommendations
    results.recommendations = this.generateErrorLogRecommendations(results);

    return results;
  }

  /**
   * Parse access log line (supports common formats)
   */
  parseAccessLogLine(line) {
    // Combined log format: IP - - [date] "METHOD /path HTTP/1.1" status bytes "referer" "user-agent" rt=time
    const combined = /^(\S+)\s+-\s+-\s+\[([^\]]+)\]\s+"(\S+)\s+(\S+)\s+HTTP\/[\d.]+"\s+(\d+)\s+(\d+)\s+"([^"]*)"\s+"([^"]*)"/;
    const match = line.match(combined);

    if (match) {
      const [, ip, timestamp, method, path, status, bytes, referer, userAgent] = match;

      // Try to extract response time if present
      const rtMatch = line.match(/rt=([\d.]+)/);
      const responseTime = rtMatch ? parseFloat(rtMatch[1]) * 1000 : null; // Convert to ms

      return {
        ip,
        timestamp,
        method,
        path: path.split('?')[0], // Remove query params
        status: parseInt(status),
        bytes: parseInt(bytes),
        referer,
        userAgent,
        responseTime
      };
    }

    return null;
  }

  /**
   * Parse error log line
   */
  parseErrorLogLine(line) {
    // Format: 2024/01/01 12:00:00 [error] 12345#0: *1 message
    const errorMatch = line.match(/\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}\s+\[(\w+)\]\s+\d+#\d+:\s+(.*)/);

    if (errorMatch) {
      return {
        level: errorMatch[1],
        message: errorMatch[2]
      };
    }

    return null;
  }

  /**
   * Check if user agent is a bot
   */
  isBot(userAgent) {
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i
    ];

    return botPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Categorize status codes
   */
  categorizeStatusCodes(statusCounts, total) {
    const categories = {
      success: 0,    // 2xx
      redirect: 0,   // 3xx
      clientError: 0, // 4xx
      serverError: 0  // 5xx
    };

    Object.entries(statusCounts).forEach(([status, count]) => {
      const code = parseInt(status);
      if (code >= 200 && code < 300) categories.success += count;
      else if (code >= 300 && code < 400) categories.redirect += count;
      else if (code >= 400 && code < 500) categories.clientError += count;
      else if (code >= 500 && code < 600) categories.serverError += count;
    });

    return {
      success: { count: categories.success, percentage: ((categories.success / total) * 100).toFixed(2) },
      redirect: { count: categories.redirect, percentage: ((categories.redirect / total) * 100).toFixed(2) },
      clientError: { count: categories.clientError, percentage: ((categories.clientError / total) * 100).toFixed(2) },
      serverError: { count: categories.serverError, percentage: ((categories.serverError / total) * 100).toFixed(2) }
    };
  }

  /**
   * Generate access log recommendations
   */
  generateAccessLogRecommendations(results) {
    const recommendations = [];

    // High error rate
    if (results.statusBreakdown.serverError.count > 0) {
      const errorRate = parseFloat(results.statusBreakdown.serverError.percentage);
      if (errorRate > 5) {
        recommendations.push({
          severity: 'high',
          category: 'errors',
          message: `High server error rate: ${errorRate}%`,
          suggestions: [
            'Check nginx error logs for details',
            'Review upstream server health',
            'Increase upstream timeouts if needed',
            'Enable health checks for upstreams'
          ]
        });
      }
    }

    // High 404 rate
    const notFoundCount = results.statusCodes['404'] || 0;
    const notFoundRate = (notFoundCount / results.totalRequests) * 100;
    if (notFoundRate > 10) {
      recommendations.push({
        severity: 'medium',
        category: 'not-found',
        message: `High 404 rate: ${notFoundRate.toFixed(2)}%`,
        suggestions: [
          'Review most requested 404 paths',
          'Set up proper redirects',
          'Create custom 404 page',
          'Check for broken links'
        ]
      });
    }

    // Slow response times
    if (results.responseTimeStats) {
      const p95 = results.responseTimeStats.p95;
      if (p95 > 1000) {
        recommendations.push({
          severity: 'high',
          category: 'performance',
          message: `Slow response times (P95: ${p95.toFixed(0)}ms)`,
          suggestions: [
            'Enable proxy caching',
            'Review upstream performance',
            'Enable gzip compression',
            'Consider adding a CDN'
          ]
        });
      } else if (p95 > 500) {
        recommendations.push({
          severity: 'medium',
          category: 'performance',
          message: `Moderate response times (P95: ${p95.toFixed(0)}ms)`,
          suggestions: [
            'Enable microcache for dynamic content',
            'Optimize worker settings',
            'Review buffer configurations'
          ]
        });
      }
    }

    // High bot traffic
    const botRate = parseFloat(results.botTraffic.percentage);
    if (botRate > 30) {
      recommendations.push({
        severity: 'medium',
        category: 'bots',
        message: `High bot traffic: ${botRate}%`,
        suggestions: [
          'Implement rate limiting for bots',
          'Consider robots.txt configuration',
          'Add User-Agent based rate limiting',
          'Monitor for malicious crawlers'
        ]
      });
    }

    // Single IP high traffic
    if (results.topIPs && results.topIPs[0]) {
      const topIPPercentage = parseFloat(results.topIPs[0].percentage);
      if (topIPPercentage > 50) {
        recommendations.push({
          severity: 'high',
          category: 'security',
          message: `Single IP accounts for ${topIPPercentage}% of traffic`,
          suggestions: [
            'Review IP: ' + results.topIPs[0].ip,
            'Consider rate limiting per IP',
            'Enable DDoS protection',
            'Check for potential abuse'
          ]
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate error log recommendations
   */
  generateErrorLogRecommendations(results) {
    const recommendations = [];

    // High error count
    if (results.totalErrors > 1000) {
      recommendations.push({
        severity: 'high',
        category: 'errors',
        message: `High error count: ${results.totalErrors}`,
        suggestions: [
          'Review top error messages',
          'Check application logs',
          'Monitor system resources',
          'Review nginx configuration'
        ]
      });
    }

    // Critical errors
    const critCount = results.errorLevels['crit'] || 0;
    if (critCount > 0) {
      recommendations.push({
        severity: 'high',
        category: 'critical',
        message: `Critical errors detected: ${critCount}`,
        suggestions: [
          'Immediate investigation required',
          'Check system stability',
          'Review error details'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Detect security issues
   */
  detectSecurityIssues(results) {
    const issues = [];

    // SQL injection attempts (common patterns in paths)
    const sqlInjectionPaths = results.topPaths.filter(({ path }) =>
      /('|"|;|--|\/\*|\*\/|union|select|insert|delete|drop|update|exec)/i.test(path)
    );

    if (sqlInjectionPaths.length > 0) {
      issues.push({
        severity: 'high',
        type: 'sql-injection',
        message: 'Potential SQL injection attempts detected',
        paths: sqlInjectionPaths.map(p => p.path)
      });
    }

    // Path traversal attempts
    const traversalPaths = results.topPaths.filter(({ path }) =>
      /\.\.|\/etc\/|\/proc\/|\/var\//i.test(path)
    );

    if (traversalPaths.length > 0) {
      issues.push({
        severity: 'high',
        type: 'path-traversal',
        message: 'Potential path traversal attempts detected',
        paths: traversalPaths.map(p => p.path)
      });
    }

    return issues;
  }

  /**
   * Statistical helpers
   */
  average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  median(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  percentile(arr, p) {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  /**
   * Format results for display
   */
  formatResults(results) {
    const output = [];

    output.push('═══════════════════════════════════════════════════════');
    output.push(`📋 Log Analysis (${results.type.toUpperCase()})`);
    output.push('═══════════════════════════════════════════════════════\n');

    if (results.type === 'access') {
      output.push(`Total Requests: ${results.totalRequests.toLocaleString()}\n`);

      // Status code breakdown
      output.push('Status Code Distribution:');
      output.push(`  2xx Success: ${results.statusBreakdown.success.count.toLocaleString()} (${results.statusBreakdown.success.percentage}%)`);
      output.push(`  3xx Redirect: ${results.statusBreakdown.redirect.count.toLocaleString()} (${results.statusBreakdown.redirect.percentage}%)`);
      output.push(`  4xx Client Error: ${results.statusBreakdown.clientError.count.toLocaleString()} (${results.statusBreakdown.clientError.percentage}%)`);
      output.push(`  5xx Server Error: ${results.statusBreakdown.serverError.count.toLocaleString()} (${results.statusBreakdown.serverError.percentage}%)\n`);

      // Response times
      if (results.responseTimeStats) {
        output.push('Response Time Statistics:');
        output.push(`  Average: ${results.responseTimeStats.avg.toFixed(2)} ms`);
        output.push(`  Median: ${results.responseTimeStats.median.toFixed(2)} ms`);
        output.push(`  P95: ${results.responseTimeStats.p95.toFixed(2)} ms`);
        output.push(`  P99: ${results.responseTimeStats.p99.toFixed(2)} ms`);
        output.push(`  Max: ${results.responseTimeStats.max.toFixed(2)} ms\n`);
      }

      // Top paths
      if (results.topPaths.length > 0) {
        output.push('Top 10 Requested Paths:');
        results.topPaths.forEach((item, idx) => {
          output.push(`  ${idx + 1}. ${item.path} (${item.count} requests, ${item.percentage}%)`);
        });
        output.push('');
      }

      // Bot traffic
      if (results.botTraffic) {
        output.push(`Bot Traffic: ${results.botTraffic.count} requests (${results.botTraffic.percentage}%)\n`);
      }
    } else if (results.type === 'error') {
      output.push(`Total Errors: ${results.totalErrors.toLocaleString()}\n`);

      // Error levels
      output.push('Error Levels:');
      Object.entries(results.errorLevels).forEach(([level, count]) => {
        const percentage = ((count / results.totalErrors) * 100).toFixed(2);
        output.push(`  ${level}: ${count} (${percentage}%)`);
      });
      output.push('');

      // Top errors
      if (results.topErrors.length > 0) {
        output.push('Top Errors:');
        results.topErrors.forEach((item, idx) => {
          output.push(`  ${idx + 1}. ${item.message.substring(0, 80)}...`);
          output.push(`     Count: ${item.count} (${item.percentage}%)`);
        });
        output.push('');
      }
    }

    // Security issues
    if (results.securityIssues && results.securityIssues.length > 0) {
      output.push('───────────────────────────────────────────────────────');
      output.push('🔐 Security Issues:\n');

      results.securityIssues.forEach((issue, idx) => {
        output.push(`${idx + 1}. 🚨 [${issue.type.toUpperCase()}] ${issue.message}`);
        if (issue.paths) {
          output.push(`   Suspicious paths: ${issue.paths.join(', ')}`);
        }
        output.push('');
      });
    }

    // Recommendations
    if (results.recommendations.length > 0) {
      output.push('───────────────────────────────────────────────────────');
      output.push('🔧 Recommendations:\n');

      results.recommendations.forEach((rec, idx) => {
        const icon = rec.severity === 'high' ? '🔴' : rec.severity === 'medium' ? '🟡' : '🟢';
        output.push(`${idx + 1}. ${icon} [${rec.category.toUpperCase()}] ${rec.message}`);
        rec.suggestions.forEach(suggestion => {
          output.push(`   • ${suggestion}`);
        });
        output.push('');
      });
    }

    output.push('═══════════════════════════════════════════════════════');

    return output.join('\n');
  }
}

export default LogAnalyzer;
