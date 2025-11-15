/**
 * Benchmark Analysis Tool
 * Parses results from wrk, ab (ApacheBench), k6, and other load testing tools
 * Provides performance insights and optimization recommendations
 */

class BenchmarkAnalyzer {
  constructor() {
    this.results = {};
    this.recommendations = [];
  }

  /**
   * Analyze benchmark results from various tools
   * @param {string} content - Raw benchmark output
   * @param {string} tool - Tool name: 'wrk', 'ab', 'k6', 'autocannon', 'siege'
   * @returns {Object} Analysis results with recommendations
   */
  analyze(content, tool = 'auto') {
    // Auto-detect tool if not specified
    if (tool === 'auto') {
      tool = this.detectTool(content);
    }

    switch (tool.toLowerCase()) {
    case 'wrk':
      return this.analyzeWrk(content);
    case 'ab':
    case 'apachebench':
      return this.analyzeApacheBench(content);
    case 'k6':
      return this.analyzeK6(content);
    case 'autocannon':
      return this.analyzeAutocannon(content);
    case 'siege':
      return this.analyzeSiege(content);
    default:
      throw new Error(`Unknown benchmark tool: ${tool}`);
    }
  }

  /**
   * Auto-detect benchmark tool from output
   */
  detectTool(content) {
    if (content.includes('Running ') && content.includes('threads and ') && content.includes('connections')) {
      return 'wrk';
    }
    if (content.includes('This is ApacheBench') || content.includes('ab -')) {
      return 'ab';
    }
    if (content.includes('k6 run') || content.includes('execution: local')) {
      return 'k6';
    }
    if (content.includes('autocannon') || content.includes('Stat    2.5%')) {
      return 'autocannon';
    }
    if (content.includes('Transactions:') && content.includes('siege')) {
      return 'siege';
    }

    throw new Error('Could not detect benchmark tool. Please specify tool explicitly.');
  }

  /**
   * Parse wrk output
   */
  analyzeWrk(content) {
    const results = {
      tool: 'wrk',
      metrics: {},
      distribution: {},
      errors: 0
    };

    // Parse threads and connections
    const threadMatch = content.match(/Running.*?(\d+).*?threads.*?(\d+).*?connections/i);
    if (threadMatch) {
      results.config = {
        threads: parseInt(threadMatch[1]),
        connections: parseInt(threadMatch[2])
      };
    }

    // Parse duration
    const durationMatch = content.match(/Running.*?(\d+)([smh])/i);
    if (durationMatch) {
      results.config = results.config || {};
      results.config.duration = durationMatch[1] + durationMatch[2];
    }

    // Parse latency stats
    const latencyMatch = content.match(/Latency\s+([\d.]+)(\w+)\s+([\d.]+)(\w+)\s+([\d.]+)(\w+)\s+([\d.]+)%/);
    if (latencyMatch) {
      results.metrics.latency = {
        avg: this.normalizeTime(latencyMatch[1], latencyMatch[2]),
        stdev: this.normalizeTime(latencyMatch[3], latencyMatch[4]),
        max: this.normalizeTime(latencyMatch[5], latencyMatch[6]),
        stdevPercent: parseFloat(latencyMatch[7])
      };
    }

    // Parse requests/sec
    const reqSecMatch = content.match(/Req\/Sec\s+([\d.]+)k?\s+([\d.]+)k?\s+([\d.]+)k?\s+([\d.]+)%/);
    if (reqSecMatch) {
      results.metrics.requestsPerSec = {
        avg: this.normalizeNumber(reqSecMatch[1]),
        stdev: this.normalizeNumber(reqSecMatch[2]),
        max: this.normalizeNumber(reqSecMatch[3]),
        stdevPercent: parseFloat(reqSecMatch[4])
      };
    }

    // Parse total requests and duration
    const summaryMatch = content.match(/([\d.]+)k?\s+requests in\s+([\d.]+)([smh])/);
    if (summaryMatch) {
      results.summary = {
        totalRequests: this.normalizeNumber(summaryMatch[1]),
        duration: this.normalizeTime(summaryMatch[2], summaryMatch[3])
      };
    }

    // Parse throughput
    const throughputMatch = content.match(/Transfer\/sec:\s+([\d.]+)(MB|KB|GB)/);
    if (throughputMatch) {
      results.metrics.throughput = this.normalizeBytes(throughputMatch[1], throughputMatch[2]);
    }

    // Parse errors
    const errorMatch = content.match(/Non-2xx or 3xx responses:\s+(\d+)/);
    if (errorMatch) {
      results.errors = parseInt(errorMatch[1]);
    }

    // Parse socket errors
    const socketMatch = content.match(/Socket errors:\s+connect\s+(\d+),\s+read\s+(\d+),\s+write\s+(\d+),\s+timeout\s+(\d+)/);
    if (socketMatch) {
      results.socketErrors = {
        connect: parseInt(socketMatch[1]),
        read: parseInt(socketMatch[2]),
        write: parseInt(socketMatch[3]),
        timeout: parseInt(socketMatch[4])
      };
    }

    // Generate recommendations
    results.recommendations = this.generateRecommendations(results);
    results.grade = this.calculateGrade(results);

    return results;
  }

  /**
   * Parse ApacheBench (ab) output
   */
  analyzeApacheBench(content) {
    const results = {
      tool: 'ab',
      metrics: {},
      distribution: {},
      errors: 0
    };

    // Parse concurrency
    const concurrencyMatch = content.match(/Concurrency Level:\s+(\d+)/);
    if (concurrencyMatch) {
      results.config = { concurrency: parseInt(concurrencyMatch[1]) };
    }

    // Parse requests per second
    const rpsMatch = content.match(/Requests per second:\s+([\d.]+)/);
    if (rpsMatch) {
      results.metrics.requestsPerSec = { avg: parseFloat(rpsMatch[1]) };
    }

    // Parse time per request
    const timeMatch = content.match(/Time per request:\s+([\d.]+)\s+\[ms\]\s+\(mean\)/);
    if (timeMatch) {
      results.metrics.latency = { avg: parseFloat(timeMatch[1]) };
    }

    // Parse total requests
    const totalMatch = content.match(/Complete requests:\s+(\d+)/);
    if (totalMatch) {
      results.summary = { totalRequests: parseInt(totalMatch[1]) };
    }

    // Parse failed requests
    const failedMatch = content.match(/Failed requests:\s+(\d+)/);
    if (failedMatch) {
      results.errors = parseInt(failedMatch[1]);
    }

    // Parse transfer rate
    const transferMatch = content.match(/Transfer rate:\s+([\d.]+)\s+\[Kbytes\/sec\]/);
    if (transferMatch) {
      results.metrics.throughput = parseFloat(transferMatch[1]) * 1024; // Convert to bytes
    }

    // Parse percentiles
    const percentiles = {};
    const percentileRegex = /(\d+)%\s+([\d.]+)/g;
    let match;
    while ((match = percentileRegex.exec(content)) !== null) {
      percentiles[`p${match[1]}`] = parseFloat(match[2]);
    }
    if (Object.keys(percentiles).length > 0) {
      results.distribution = percentiles;
    }

    results.recommendations = this.generateRecommendations(results);
    results.grade = this.calculateGrade(results);

    return results;
  }

  /**
   * Parse k6 output (JSON format)
   */
  analyzeK6(content) {
    const results = {
      tool: 'k6',
      metrics: {},
      errors: 0
    };

    try {
      // Try to parse as JSON first (k6 can output JSON)
      const json = JSON.parse(content);
      
      if (json.metrics) {
        results.metrics = {
          latency: {
            avg: json.metrics.http_req_duration?.values?.avg,
            p95: json.metrics.http_req_duration?.values?.['p(95)'],
            p99: json.metrics.http_req_duration?.values?.['p(99)']
          },
          requestsPerSec: {
            avg: json.metrics.http_reqs?.values?.rate
          }
        };
      }
    } catch {
      // Parse text output
      const durationMatch = content.match(/http_req_duration.*?avg=([\d.]+)(\w+)/);
      if (durationMatch) {
        results.metrics.latency = {
          avg: this.normalizeTime(durationMatch[1], durationMatch[2])
        };
      }

      const rpsMatch = content.match(/http_reqs.*?([\d.]+)\/s/);
      if (rpsMatch) {
        results.metrics.requestsPerSec = { avg: parseFloat(rpsMatch[1]) };
      }
    }

    results.recommendations = this.generateRecommendations(results);
    results.grade = this.calculateGrade(results);

    return results;
  }

  /**
   * Parse autocannon output
   */
  analyzeAutocannon(content) {
    const results = {
      tool: 'autocannon',
      metrics: {},
      distribution: {}
    };

    // Parse requests/sec
    const rpsMatch = content.match(/Req\/Sec.*?Avg:\s+([\d.]+)/);
    if (rpsMatch) {
      results.metrics.requestsPerSec = { avg: parseFloat(rpsMatch[1]) };
    }

    // Parse latency
    const latencyMatch = content.match(/Latency.*?Avg:\s+([\d.]+)\s+ms/);
    if (latencyMatch) {
      results.metrics.latency = { avg: parseFloat(latencyMatch[1]) };
    }

    results.recommendations = this.generateRecommendations(results);
    results.grade = this.calculateGrade(results);

    return results;
  }

  /**
   * Parse siege output
   */
  analyzeSiege(content) {
    const results = {
      tool: 'siege',
      metrics: {},
      errors: 0
    };

    const transMatch = content.match(/Transactions:\s+(\d+)\s+hits/);
    if (transMatch) {
      results.summary = { totalRequests: parseInt(transMatch[1]) };
    }

    const rateMatch = content.match(/Transaction rate:\s+([\d.]+)\s+trans\/sec/);
    if (rateMatch) {
      results.metrics.requestsPerSec = { avg: parseFloat(rateMatch[1]) };
    }

    const responseMatch = content.match(/Response time:\s+([\d.]+)\s+secs/);
    if (responseMatch) {
      results.metrics.latency = { avg: parseFloat(responseMatch[1]) * 1000 }; // Convert to ms
    }

    results.recommendations = this.generateRecommendations(results);
    results.grade = this.calculateGrade(results);

    return results;
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(results) {
    const recommendations = [];
    const metrics = results.metrics;

    // Latency recommendations
    if (metrics.latency) {
      const avgLatency = metrics.latency.avg;

      if (avgLatency > 1000) {
        recommendations.push({
          severity: 'high',
          category: 'latency',
          message: 'Very high latency detected (>1s)',
          suggestions: [
            'Enable proxy caching for API responses',
            'Increase worker_processes to match CPU cores',
            'Enable HTTP/2 or HTTP/3',
            'Check upstream server performance',
            'Consider adding a CDN for static assets'
          ]
        });
      } else if (avgLatency > 500) {
        recommendations.push({
          severity: 'medium',
          category: 'latency',
          message: 'High latency detected (>500ms)',
          suggestions: [
            'Enable microcache for dynamic content',
            'Optimize worker_connections setting',
            'Enable gzip compression',
            'Review upstream keepalive settings'
          ]
        });
      } else if (avgLatency > 200) {
        recommendations.push({
          severity: 'low',
          category: 'latency',
          message: 'Moderate latency detected (>200ms)',
          suggestions: [
            'Fine-tune proxy_buffering',
            'Consider enabling HTTP/2 server push',
            'Review cache TTL settings'
          ]
        });
      }
    }

    // Throughput recommendations
    if (metrics.requestsPerSec) {
      const rps = metrics.requestsPerSec.avg;

      if (rps < 100) {
        recommendations.push({
          severity: 'medium',
          category: 'throughput',
          message: 'Low requests/sec (<100 RPS)',
          suggestions: [
            'Increase worker_connections (current may be bottleneck)',
            'Enable connection pooling with keepalive',
            'Review buffer sizes (client_body_buffer_size, etc.)',
            'Check if worker_processes matches CPU cores'
          ]
        });
      } else if (rps > 10000) {
        recommendations.push({
          severity: 'info',
          category: 'throughput',
          message: 'Excellent throughput (>10k RPS)',
          suggestions: [
            'Configuration is well-optimized',
            'Consider adding DDoS protection',
            'Monitor system resources for bottlenecks'
          ]
        });
      }
    }

    // Error rate recommendations
    if (results.errors > 0) {
      const errorRate = results.summary ? (results.errors / results.summary.totalRequests) * 100 : 0;

      if (errorRate > 5) {
        recommendations.push({
          severity: 'high',
          category: 'errors',
          message: `High error rate: ${errorRate.toFixed(2)}%`,
          suggestions: [
            'Check upstream server health',
            'Review proxy_next_upstream settings',
            'Enable upstream health checks',
            'Increase upstream timeouts',
            'Check nginx error logs for details'
          ]
        });
      } else if (errorRate > 1) {
        recommendations.push({
          severity: 'medium',
          category: 'errors',
          message: `Moderate error rate: ${errorRate.toFixed(2)}%`,
          suggestions: [
            'Review upstream failover configuration',
            'Check proxy_connect_timeout and proxy_read_timeout',
            'Consider adding backup servers'
          ]
        });
      }
    }

    // Socket errors (wrk-specific)
    if (results.socketErrors) {
      const { connect, read, write, timeout } = results.socketErrors;
      const total = connect + read + write + timeout;

      if (total > 0) {
        recommendations.push({
          severity: 'high',
          category: 'socket-errors',
          message: `Socket errors detected: ${total} total`,
          details: { connect, read, write, timeout },
          suggestions: [
            timeout > 0 ? 'Increase proxy_read_timeout and proxy_send_timeout' : null,
            connect > 0 ? 'Increase proxy_connect_timeout' : null,
            read > 0 ? 'Check upstream server capacity' : null,
            write > 0 ? 'Review client_body_timeout' : null,
            'Increase worker_connections if maxed out',
            'Check system file descriptor limits (ulimit -n)'
          ].filter(Boolean)
        });
      }
    }

    return recommendations;
  }

  /**
   * Calculate performance grade (A-F)
   */
  calculateGrade(results) {
    let score = 100;
    const metrics = results.metrics;

    // Latency scoring
    if (metrics.latency?.avg) {
      const latency = metrics.latency.avg;
      if (latency > 1000) score -= 40;
      else if (latency > 500) score -= 25;
      else if (latency > 200) score -= 15;
      else if (latency > 100) score -= 5;
    }

    // Error rate scoring
    if (results.errors > 0 && results.summary) {
      const errorRate = (results.errors / results.summary.totalRequests) * 100;
      if (errorRate > 10) score -= 30;
      else if (errorRate > 5) score -= 20;
      else if (errorRate > 1) score -= 10;
      else score -= 5;
    }

    // Socket errors scoring
    if (results.socketErrors) {
      const total = Object.values(results.socketErrors).reduce((a, b) => a + b, 0);
      if (total > 100) score -= 20;
      else if (total > 10) score -= 10;
      else if (total > 0) score -= 5;
    }

    // Convert score to grade
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Normalize time to milliseconds
   */
  normalizeTime(value, unit) {
    const val = parseFloat(value);
    switch (unit.toLowerCase()) {
    case 'us':
    case 'µs':
      return val / 1000;
    case 'ms':
      return val;
    case 's':
      return val * 1000;
    case 'm':
      return val * 60000;
    case 'h':
      return val * 3600000;
    default:
      return val;
    }
  }

  /**
   * Normalize numbers (handles k, m, g suffixes)
   */
  normalizeNumber(value) {
    if (typeof value === 'string' && value.endsWith('k')) {
      return parseFloat(value) * 1000;
    }
    if (typeof value === 'string' && value.endsWith('m')) {
      return parseFloat(value) * 1000000;
    }
    return parseFloat(value);
  }

  /**
   * Normalize bytes to bytes
   */
  normalizeBytes(value, unit) {
    const val = parseFloat(value);
    switch (unit.toUpperCase()) {
    case 'KB':
      return val * 1024;
    case 'MB':
      return val * 1024 * 1024;
    case 'GB':
      return val * 1024 * 1024 * 1024;
    default:
      return val;
    }
  }

  /**
   * Format results for display
   */
  formatResults(results) {
    const output = [];

    output.push('═══════════════════════════════════════════════════════');
    output.push(`📊 Benchmark Analysis (${results.tool.toUpperCase()})`);
    output.push('═══════════════════════════════════════════════════════\n');

    // Configuration
    if (results.config) {
      output.push('Configuration:');
      Object.entries(results.config).forEach(([key, value]) => {
        output.push(`  ${key}: ${value}`);
      });
      output.push('');
    }

    // Metrics
    if (results.metrics.latency) {
      output.push('Latency:');
      output.push(`  Average: ${results.metrics.latency.avg.toFixed(2)} ms`);
      if (results.metrics.latency.p95) {
        output.push(`  P95: ${results.metrics.latency.p95.toFixed(2)} ms`);
      }
      if (results.metrics.latency.max) {
        output.push(`  Max: ${results.metrics.latency.max.toFixed(2)} ms`);
      }
      output.push('');
    }

    if (results.metrics.requestsPerSec) {
      output.push('Throughput:');
      output.push(`  Requests/sec: ${results.metrics.requestsPerSec.avg.toFixed(2)}`);
      output.push('');
    }

    // Summary
    if (results.summary) {
      output.push('Summary:');
      output.push(`  Total Requests: ${results.summary.totalRequests.toLocaleString()}`);
      if (results.errors > 0) {
        const errorRate = (results.errors / results.summary.totalRequests * 100).toFixed(2);
        output.push(`  Errors: ${results.errors} (${errorRate}%)`);
      }
      output.push('');
    }

    // Grade
    output.push(`Performance Grade: ${results.grade}\n`);

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

export default BenchmarkAnalyzer;
