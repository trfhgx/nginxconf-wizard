#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import updateNotifier from 'update-notifier';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Wizard from '../src/cli/Wizard.js';
import { validateConfig } from '../src/cli/validate.js';
import { testConfig } from '../src/cli/test.js';
import BenchmarkAnalyzer from '../src/analyzers/BenchmarkAnalyzer.js';
import LogAnalyzer from '../src/analyzers/LogAnalyzer.js';
import UpdateManager from '../src/core/UpdateManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

// Check for updates
updateNotifier({ pkg }).notify();

const program = new Command();

program
  .name('nginxconf-wizard')
  .description('Intelligent CLI tool for generating production-ready Nginx configurations')
  .version(pkg.version);

// Main generate command (interactive wizard)
program
  .command('generate', { isDefault: true })
  .description('Generate nginx configuration using interactive wizard')
  .option('-o, --output <directory>', 'Output directory', './')
  .option('-p, --preset <name>', 'Use a preset configuration')
  .option('--profile <profile>', 'Performance profile (high-traffic, low-resource, cdn-origin, etc.)')
  .option('--no-validation', 'Skip configuration validation')
  .action(async (options) => {
    try {
      const wizard = new Wizard(options);
      await wizard.run();
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Update command (for managed configs)
program
  .command('update')
  .description('Update existing configuration with new best practices')
  .option('-s, --state <file>', 'State file location', './nginx-wizard.json')
  .option('--auto-apply', 'Automatically apply updates without confirmation')
  .action(async (options) => {
    try {
      const manager = new UpdateManager(options.state);
      await manager.applyUpdates(options.autoApply);
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Check updates command
program
  .command('check-updates')
  .description('Check for available configuration updates')
  .option('-s, --state <file>', 'State file location', './nginx-wizard.json')
  .action(async (options) => {
    try {
      const manager = new UpdateManager(options.state);
      const updateInfo = manager.checkForUpdates();
      manager.displayUpdates(updateInfo);

      if (updateInfo.hasUpdates) {
        console.log(chalk.yellow('\n� Run "nginxconf-wizard update" to apply updates'));
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Analyze logs command
program
  .command('analyze-logs <logfile>')
  .description('Analyze nginx logs for optimization recommendations')
  .option('-t, --type <type>', 'Log type (access or error), auto-detected by default')
  .option('--error <file>', 'Error log file')
  .action(async (logfile, options) => {
    try {
      console.log(chalk.blue('📋 Analyzing nginx logs...\n'));

      // Read log file
      const content = readFileSync(logfile, 'utf-8');

      // Analyze
      const analyzer = new LogAnalyzer();
      const results = analyzer.analyze(content, options.type || 'auto');

      // Display results
      console.log(analyzer.formatResults(results));

      // If error log is also provided
      if (options.error) {
        console.log(chalk.blue('\n📋 Analyzing error log...\n'));
        const errorContent = readFileSync(options.error, 'utf-8');
        const errorResults = analyzer.analyze(errorContent, 'error');
        console.log(analyzer.formatResults(errorResults));
      }

      console.log(chalk.green('\n✅ Analysis complete!'));
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Analyze benchmark command
program
  .command('analyze-benchmark <results>')
  .description('Analyze benchmark results and suggest optimizations')
  .option('-t, --tool <tool>', 'Benchmark tool (wrk, ab, k6, autocannon, siege), auto-detected by default')
  .option('--apply', 'Apply recommendations automatically (not yet implemented)')
  .action(async (results, options) => {
    try {
      console.log(chalk.blue('📊 Analyzing benchmark results...\n'));

      // Read benchmark results
      const content = readFileSync(results, 'utf-8');

      // Analyze
      const analyzer = new BenchmarkAnalyzer();
      const analysisResults = analyzer.analyze(content, options.tool || 'auto');

      // Display results
      console.log(analyzer.formatResults(analysisResults));

      if (options.apply) {
        console.log(chalk.yellow('\n⚠️  Auto-apply feature coming soon!'));
        console.log(chalk.gray('This will automatically update your nginx config based on recommendations'));
      }

      console.log(chalk.green('\n✅ Analysis complete!'));
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate <config>')
  .description('Validate nginx configuration file')
  .action(async (config) => {
    try {
      const isValid = await validateConfig(config);
      process.exit(isValid ? 0 : 1);
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Test command
program
  .command('test <config>')
  .description('Test nginx configuration (runs nginx -t)')
  .action(async (config) => {
    try {
      const isValid = await testConfig(config);
      process.exit(isValid ? 0 : 1);
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Display banner
function showBanner() {
  console.log(chalk.cyan(`
╔═══════════════════════════════════════════╗
║                                           ║
║     🔧 Nginx Configuration Wizard 🔧     ║
║                                           ║
║   Generate production-ready configs       ║
║   in minutes, not hours                   ║
║                                           ║
╚═══════════════════════════════════════════╝
  `));
}

// Show banner on direct invocation
if (process.argv.length === 2) {
  showBanner();
}

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
