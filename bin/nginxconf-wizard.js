#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import updateNotifier from 'update-notifier';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Wizard from '../src/cli/Wizard.js';

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
    console.log(chalk.yellow('🚧 Update command coming in Phase 2/3'));
    console.log(chalk.gray('This will allow you to update configs with evolving best practices'));
  });

// Check updates command
program
  .command('check-updates')
  .description('Check for available configuration updates')
  .option('-s, --state <file>', 'State file location', './nginx-wizard.json')
  .action(async (options) => {
    console.log(chalk.yellow('🚧 Check-updates command coming in Phase 2/3'));
  });

// Analyze logs command
program
  .command('analyze-logs <logfile>')
  .description('Analyze nginx logs for optimization recommendations')
  .option('--error <file>', 'Error log file')
  .action(async (logfile, options) => {
    console.log(chalk.yellow('🚧 Log analysis coming in Phase 4 (Enterprise)'));
    console.log(chalk.gray('This will provide AI-powered recommendations from production logs'));
  });

// Analyze benchmark command
program
  .command('analyze-benchmark <results>')
  .description('Analyze benchmark results and suggest optimizations')
  .option('--apply', 'Apply recommendations automatically')
  .action(async (results, options) => {
    console.log(chalk.yellow('🚧 Benchmark analysis coming in Phase 3'));
    console.log(chalk.gray('This will analyze wrk/ab results for performance tuning'));
  });

// Validate command
program
  .command('validate <config>')
  .description('Validate nginx configuration file')
  .action(async (config) => {
    console.log(chalk.yellow('🚧 Validate command coming soon'));
  });

// Test command
program
  .command('test <config>')
  .description('Test nginx configuration (runs nginx -t)')
  .action(async (config) => {
    console.log(chalk.yellow('🚧 Test command coming soon'));
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
