import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import { promises as fs } from 'fs';

const execAsync = promisify(exec);

/**
 * Test nginx configuration using nginx -t
 */
export async function testConfig(configPath) {
  try {
    console.log(chalk.cyan(`\n🧪 Testing nginx configuration: ${configPath}\n`));

    // Check if nginx is installed
    try {
      await execAsync('which nginx');
    } catch {
      console.error(chalk.red('✗ nginx is not installed or not in PATH'));
      console.log(chalk.gray('\n💡 Install nginx:'));
      console.log(chalk.gray('  Ubuntu/Debian: sudo apt install nginx'));
      console.log(chalk.gray('  CentOS/RHEL:   sudo yum install nginx'));
      console.log(chalk.gray('  macOS:         brew install nginx\n'));
      return false;
    }

    // Check if config file exists
    try {
      await fs.access(configPath);
    } catch {
      console.error(chalk.red(`✗ Config file not found: ${configPath}`));
      return false;
    }

    // Test config with nginx -t
    try {
      const { stdout, stderr } = await execAsync(`nginx -t -c ${configPath}`);

      // nginx outputs to stderr even on success
      const output = stderr || stdout;

      if (output.includes('syntax is ok') && output.includes('test is successful')) {
        console.log(chalk.green('✓ Configuration test successful!'));
        console.log(chalk.gray('\nNext steps:'));
        console.log(chalk.gray('  1. Copy config to nginx directory:'));
        console.log(chalk.gray(`     sudo cp ${configPath} /etc/nginx/nginx.conf`));
        console.log(chalk.gray('  2. Reload nginx:'));
        console.log(chalk.gray('     sudo nginx -s reload\n'));
        return true;
      } else {
        console.error(chalk.red('✗ Configuration test failed'));
        console.log(chalk.gray(output));
        return false;
      }
    } catch (error) {
      console.error(chalk.red('✗ Configuration test failed\n'));

      // Parse nginx error output
      const errorOutput = error.stderr || error.stdout || error.message;
      const lines = errorOutput.split('\n');

      lines.forEach(line => {
        if (line.includes('emerg') || line.includes('error')) {
          console.log(chalk.red(`  ${line.trim()}`));
        } else if (line.includes('warn')) {
          console.log(chalk.yellow(`  ${line.trim()}`));
        } else if (line.trim()) {
          console.log(chalk.gray(`  ${line.trim()}`));
        }
      });

      console.log(chalk.gray('\n💡 Common issues:'));
      console.log(chalk.gray('  - Check file paths (SSL certs, root directories)'));
      console.log(chalk.gray('  - Verify syntax (missing semicolons, unmatched braces)'));
      console.log(chalk.gray('  - Ensure ports are not already in use'));
      console.log(chalk.gray('  - Check file permissions\n'));

      return false;
    }
  } catch (error) {
    console.error(chalk.red(`Error testing config: ${error.message}`));
    return false;
  }
}

export default { testConfig };
