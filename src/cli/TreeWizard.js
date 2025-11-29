import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { promises as fs } from 'fs';
import path from 'path';

// Wizard modules
import * as prompts from './wizard/prompts.js';
import * as display from './wizard/display.js';
import * as menus from './wizard/menus.js';
import * as state from './wizard/state.js';

// Core
import TreeConfigBuilder from '../core/TreeConfigBuilder.js';
import Validator from '../core/Validator.js';
import { getPresets, applyPreset } from '../presets/index.js';

/**
 * TreeWizard - Flexible tree-based CLI wizard for nginx configuration
 */
class TreeWizard {
  constructor(options = {}) {
    this.options = options;
    this.config = new TreeConfigBuilder();
    this.validator = new Validator();
    this.state = state.createInitialState();
  }

  /**
   * Run the wizard
   */
  async run() {
    display.showWelcome();

    try {
      await this.configureGlobalSettings();
      await this.buildTree();
      await this.reviewConfiguration();
      await this.buildConfiguration();
      await this.saveConfiguration();

      display.showSuccess('Configuration generated successfully!');
      display.showNextSteps(this.state, this.options.output);
    } catch (error) {
      if (error.isTtyError) {
        display.showError("Prompt couldn't be rendered in the current environment");
      } else if (error.message === 'User cancelled') {
        console.log(chalk.yellow('\nWizard cancelled. No files were created.\n'));
      } else {
        throw error;
      }
    }
  }

  /**
   * Configure global settings
   */
  async configureGlobalSettings() {
    display.showSection('Global Settings');

    const usePreset = await prompts.promptConfirm('Start with a framework preset?', false);

    if (usePreset) {
      const presetList = getPresets();
      const presetChoices = [
        ...presetList.map(p => ({ name: p.name, value: p.value })),
        new inquirer.Separator(),
        { name: 'Start from scratch', value: null }
      ];
      
      const preset = await prompts.promptSelect('Choose a preset:', presetChoices);

      if (preset) {
        const presetConfig = applyPreset(preset);
        this.state = state.presetToState(presetConfig);
        this.config.setGlobalSettings(this.state.globalSettings);
        console.log(chalk.green(`\n  ✓ Loaded ${presetConfig.name} preset\n`));
        return;
      }
    }

    const answers = await prompts.promptGlobalSettings();
    this.state.globalSettings = state.createGlobalSettings(answers);
    this.config.setGlobalSettings(this.state.globalSettings);
  }

  /**
   * Main tree building loop
   */
  async buildTree() {
    let continueBuilding = true;

    while (continueBuilding) {
      display.showSection('Configuration Tree');
      display.displayTree(this.state);

      const action = await prompts.promptSelect(
        'What would you like to do?',
        menus.getMainMenuChoices(this.state.servers)
      );

      if (action === 'add-server') {
        await this.addServer();
      } else if (action === 'add-upstream') {
        await this.addGlobalUpstream();
      } else if (action === 'edit-server') {
        await this.editServer();
      } else if (action === 'remove-server') {
        await this.removeServer();
      } else if (action === 'edit-global') {
        await this.configureGlobalSettings();
      } else if (action === 'done') {
        continueBuilding = false;
      } else if (action === 'cancel') {
        throw new Error('User cancelled');
      }
    }
  }

  /**
   * Add a new server block
   */
  async addServer() {
    display.showSection('Add Server Block');

    const answers = await prompts.promptServerConfig(this.validator);
    const server = state.createServer(answers);
    this.state.servers.push(server);

    console.log(chalk.green(`\n  ✓ Server ${answers.domain} added\n`));

    const addLocations = await prompts.promptConfirm('Add locations to this server now?', true);
    if (addLocations) {
      await this.editServerMenu(server);
    }
  }

  /**
   * Edit an existing server
   */
  async editServer() {
    if (this.state.servers.length === 0) {
      display.showWarning('No servers to edit.');
      return;
    }

    const serverId = await prompts.promptSelect(
      'Select server to edit:',
      menus.getServerSelectionChoices(this.state.servers)
    );

    const server = state.findServer(this.state, serverId);
    await this.editServerMenu(server);
  }

  /**
   * Server edit menu
   */
  async editServerMenu(server) {
    let continueEditing = true;

    while (continueEditing) {
      const action = await prompts.promptSelect(
        `Editing ${server.domain.primary}:`,
        menus.getServerEditMenuChoices(server)
      );

      if (action === 'add-location') {
        await this.addLocation(server);
      } else if (action === 'add-upstream') {
        await this.addUpstream(server);
      } else if (action === 'edit-domain') {
        await this.editDomain(server);
      } else if (action === 'edit-ssl') {
        await this.editSSL(server);
      } else if (action === 'edit-location') {
        await this.editLocation(server);
      } else if (action === 'remove-location') {
        await this.removeLocation(server);
      } else if (action === 'edit-upstream') {
        await this.editUpstream(server);
      } else if (action === 'remove-upstream') {
        await this.removeUpstreamFromServer(server);
      } else if (action === 'back') {
        continueEditing = false;
      }
    }
  }

  /**
   * Add a location to a server
   */
  async addLocation(server) {
    display.showSection('Add Location');

    const type = await prompts.promptLocationType();
    let locationConfig;

    if (type === 'static') {
      locationConfig = await prompts.promptStaticLocation();
    } else if (type === 'spa') {
      locationConfig = await prompts.promptSPALocation();
    } else if (type === 'proxy') {
      locationConfig = await this.configureProxyLocation(server);
    } else if (type === 'api') {
      locationConfig = await this.configureAPILocation(server);
    } else if (type === 'websocket') {
      locationConfig = await this.configureWebSocketLocation(server);
    } else if (type === 'redirect') {
      locationConfig = await prompts.promptRedirectLocation();
    } else if (type === 'health') {
      locationConfig = await prompts.promptHealthLocation();
    } else if (type === 'cache') {
      locationConfig = await this.configureCachedProxyLocation(server);
    } else if (type === 'custom') {
      locationConfig = await this.configureCustomLocation();
    }

    if (locationConfig) {
      const location = state.createLocation(type, locationConfig);
      server.locations.push(location);
      console.log(chalk.green(`\n  ✓ Location ${locationConfig.path} added\n`));
    }
  }

  /**
   * Configure proxy location with upstream selection
   */
  async configureProxyLocation(server) {
    const upstreamChoices = menus.getUpstreamChoices(server.upstreams, this.state.upstreams);
    const answers = await prompts.promptProxyLocation(upstreamChoices);

    if (answers.target.type === 'new') {
      await this.addUpstream(server);
      return this.configureProxyLocation(server);
    }

    return {
      path: answers.path,
      upstream: answers.target.type === 'upstream' ? answers.target.name : null,
      target: answers.directUrl || null,
      websocket: answers.websocket,
      timeout: answers.timeout
    };
  }

  /**
   * Configure API location
   */
  async configureAPILocation(server) {
    const upstreamChoices = menus.getUpstreamChoices(server.upstreams, this.state.upstreams)
      .filter(c => c.value?.type !== 'new'); // No "create new" option for API

    const answers = await prompts.promptAPILocation(upstreamChoices);

    return {
      path: answers.path,
      upstream: answers.target.type === 'upstream' ? answers.target.name : null,
      target: answers.directUrl || null,
      cors: answers.cors,
      corsOrigin: answers.corsOrigin,
      rateLimit: answers.rateLimit,
      rateLimitValue: answers.rateLimitValue,
      rateLimitBurst: answers.rateLimitBurst
    };
  }

  /**
   * Configure WebSocket location
   */
  async configureWebSocketLocation(server) {
    const upstreamChoices = menus.getUpstreamChoices(server.upstreams, this.state.upstreams)
      .filter(c => c.value?.type !== 'new');

    const answers = await prompts.promptWebSocketLocation(upstreamChoices);

    return {
      path: answers.path,
      upstream: answers.target.type === 'upstream' ? answers.target.name : null,
      target: answers.directUrl || null,
      timeout: answers.timeout
    };
  }

  /**
   * Configure cached proxy location
   */
  async configureCachedProxyLocation(server) {
    const baseProxy = await this.configureProxyLocation(server);
    const cacheAnswers = await prompts.promptCacheSettings();

    return {
      ...baseProxy,
      cache: {
        duration: cacheAnswers.cacheDuration,
        zone: cacheAnswers.cacheZone,
        bypassCookie: cacheAnswers.bypassCookie
      }
    };
  }

  /**
   * Configure custom location
   */
  async configureCustomLocation() {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'path',
        message: 'Location path:',
        default: '/custom'
      },
      {
        type: 'editor',
        name: 'content',
        message: 'Enter custom nginx directives (opens editor):'
      }
    ]);

    return {
      path: answers.path,
      custom: answers.content
    };
  }

  /**
   * Add upstream to server
   */
  async addUpstream(server) {
    display.showSection('Add Upstream');

    const answers = await prompts.promptUpstreamConfig();
    const upstream = state.createUpstream(answers);
    server.upstreams.push(upstream);

    console.log(chalk.green(`\n  ✓ Upstream ${answers.name} added with ${answers.servers.length} server(s)\n`));
  }

  /**
   * Add global upstream
   */
  async addGlobalUpstream() {
    display.showSection('Add Global Upstream');
    display.showInfo('Global upstreams can be used by any server.');

    const answers = await prompts.promptUpstreamConfig();
    const upstream = state.createUpstream(answers);
    this.state.upstreams.push(upstream);

    console.log(chalk.green(`\n  ✓ Global upstream ${answers.name} added\n`));
  }

  /**
   * Remove a server
   */
  async removeServer() {
    const serverId = await prompts.promptSelect(
      'Select server to remove:',
      menus.getServerSelectionChoices(this.state.servers)
    );

    const confirm = await prompts.promptConfirm('Are you sure you want to remove this server?', false);
    if (confirm) {
      state.removeServer(this.state, serverId);
      console.log(chalk.green('\n  ✓ Server removed\n'));
    }
  }

  /**
   * Remove a location from server
   */
  async removeLocation(server) {
    const locationId = await prompts.promptSelect(
      'Select location to remove:',
      menus.getLocationSelectionChoices(server.locations)
    );

    state.removeLocation(server, locationId);
    console.log(chalk.green('\n  ✓ Location removed\n'));
  }

  /**
   * Edit a location
   */
  async editLocation(server) {
    const locationId = await prompts.promptSelect(
      'Select location to edit:',
      menus.getLocationSelectionChoices(server.locations)
    );

    const location = state.findLocation(server, locationId);
    let newConfig;

    if (location.type === 'static') {
      newConfig = await prompts.promptStaticLocation();
    } else if (location.type === 'spa') {
      newConfig = await prompts.promptSPALocation();
    } else if (location.type === 'proxy') {
      newConfig = await this.configureProxyLocation(server);
    } else if (location.type === 'api') {
      newConfig = await this.configureAPILocation(server);
    } else if (location.type === 'websocket') {
      newConfig = await this.configureWebSocketLocation(server);
    } else if (location.type === 'redirect') {
      newConfig = await prompts.promptRedirectLocation();
    } else if (location.type === 'health') {
      newConfig = await prompts.promptHealthLocation();
    } else {
      display.showWarning('Cannot edit this location type.');
      return;
    }

    if (newConfig) {
      state.updateLocation(server, locationId, newConfig);
      console.log(chalk.green('\n  ✓ Location updated\n'));
    }
  }

  /**
   * Edit domain settings
   */
  async editDomain(server) {
    const answers = await prompts.promptDomainEdit(server.domain);
    state.updateServerDomain(server, answers);
    console.log(chalk.green('\n  ✓ Domain settings updated\n'));
  }

  /**
   * Edit SSL settings
   */
  async editSSL(server) {
    const answers = await prompts.promptSSLEdit(server.ssl);
    state.updateServerSSL(server, answers);
    console.log(chalk.green('\n  ✓ SSL settings updated\n'));
  }

  /**
   * Edit upstream
   */
  async editUpstream(server) {
    const upstreamId = await prompts.promptSelect(
      'Select upstream to edit:',
      menus.getUpstreamSelectionChoices(server.upstreams)
    );

    const answers = await prompts.promptUpstreamConfig();
    
    state.updateUpstream(server, upstreamId, {
      name: answers.name,
      servers: answers.servers,
      keepalive: answers.keepalive
    });

    console.log(chalk.green('\n  ✓ Upstream updated\n'));
  }

  /**
   * Remove upstream from server
   */
  async removeUpstreamFromServer(server) {
    const upstreamId = await prompts.promptSelect(
      'Select upstream to remove:',
      menus.getUpstreamSelectionChoices(server.upstreams)
    );

    state.removeUpstream(server, upstreamId);
    console.log(chalk.green('\n  ✓ Upstream removed\n'));
  }

  /**
   * Review configuration before generating
   */
  async reviewConfiguration() {
    display.showSection('Configuration Review');
    display.displayTree(this.state);

    const proceed = await prompts.promptConfirm('Generate configuration with these settings?', true);
    if (!proceed) {
      throw new Error('User cancelled');
    }
  }

  /**
   * Build the configuration
   */
  async buildConfiguration() {
    const spinner = ora('Generating nginx configuration...').start();

    try {
      this.config.setState(this.state);

      const validation = this.config.validate();
      if (!validation.valid) {
        spinner.fail('Configuration validation failed');
        validation.errors.forEach(error => {
          console.log(chalk.red(`  ✗ ${error}`));
        });
        throw new Error('Validation failed');
      }

      if (validation.warnings.length > 0) {
        spinner.warn('Configuration has warnings');
        validation.warnings.forEach(warning => {
          console.log(chalk.yellow(`  ⚠ ${warning}`));
        });
        spinner.start('Continuing with configuration generation...');
      }

      this.generatedConfig = await this.config.build();
      spinner.succeed('Configuration generated');
    } catch (error) {
      spinner.fail('Failed to generate configuration');
      throw error;
    }
  }

  /**
   * Save configuration files
   */
  async saveConfiguration() {
    const outputDir = this.options.output || './';
    const configPath = path.join(outputDir, 'nginx.conf');
    const statePath = path.join(outputDir, 'nginx-wizard.json');

    const spinner = ora('Saving configuration files...').start();

    try {
      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(configPath, this.generatedConfig, 'utf-8');
      await fs.writeFile(statePath, JSON.stringify(this.state, null, 2), 'utf-8');

      spinner.succeed('Configuration files saved');

      console.log(chalk.gray('\n  Files created:'));
      console.log(chalk.gray(`    ${configPath}`));
      console.log(chalk.gray(`    ${statePath}`));
    } catch (error) {
      spinner.fail('Failed to save configuration');
      throw error;
    }
  }
}

export default TreeWizard;
