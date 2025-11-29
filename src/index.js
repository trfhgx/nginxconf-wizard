// Main entry point for the nginxconf-wizard library
// This file serves as the programmatic API

// Classic wizard (multi-choice pattern-based)
export { default as Wizard } from './cli/Wizard.js';

// Tree wizard (flexible tree-based composable)
export { default as TreeWizard } from './cli/TreeWizard.js';

// Config builders
export { default as ConfigBuilder } from './core/ConfigBuilder.js';
export { default as TreeConfigBuilder } from './core/TreeConfigBuilder.js';

// Core utilities
export { default as Validator } from './core/Validator.js';
export { default as SmartConfigManager } from './core/SmartConfigManager.js';
export { default as TemplateEngine } from './core/TemplateEngine.js';
export { getPresets, getPreset, applyPreset } from './presets/index.js';
export { validateConfig } from './cli/validate.js';
export { testConfig } from './cli/test.js';
export { default as BenchmarkAnalyzer } from './analyzers/BenchmarkAnalyzer.js';
export { default as LogAnalyzer } from './analyzers/LogAnalyzer.js';
export { default as UpdateManager } from './core/UpdateManager.js';

// Default export - TreeWizard is now the recommended default
import TreeWizard from './cli/TreeWizard.js';
export default TreeWizard;