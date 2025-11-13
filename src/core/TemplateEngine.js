import Handlebars from 'handlebars';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * TemplateEngine - Handles Handlebars template compilation and rendering
 * Manages template loading, helpers, and partials
 */
class TemplateEngine {
  constructor(templatesDir) {
    this.templatesDir = templatesDir || path.join(__dirname, '../../templates');
    this.templates = new Map();
    this.registerHelpers();
  }

  /**
   * Register Handlebars helpers
   */
  registerHelpers() {
    // Helper: Check if value exists in array
    Handlebars.registerHelper('includes', (array, value) => {
      return Array.isArray(array) && array.includes(value);
    });

    // Helper: Join array with separator
    Handlebars.registerHelper('join', (array, separator = ' ') => {
      return Array.isArray(array) ? array.join(separator) : '';
    });

    // Helper: Conditional equality
    Handlebars.registerHelper('eq', (a, b) => {
      return a === b;
    });

    // Helper: Conditional not equal
    Handlebars.registerHelper('neq', (a, b) => {
      return a !== b;
    });

    // Helper: Logical OR
    Handlebars.registerHelper('or', (...args) => {
      // Remove options object (last argument)
      args.pop();
      return args.some(arg => !!arg);
    });

    // Helper: Logical AND
    Handlebars.registerHelper('and', (...args) => {
      // Remove options object (last argument)
      args.pop();
      return args.every(arg => !!arg);
    });

    // Helper: Format SSL protocols
    Handlebars.registerHelper('sslProtocols', (http2, http3) => {
      const protocols = ['TLSv1.2', 'TLSv1.3'];
      return protocols.join(' ');
    });

    // Helper: Generate SSL ciphers
    Handlebars.registerHelper('sslCiphers', () => {
      return 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    });

    // Helper: Comment block
    Handlebars.registerHelper('comment', (text) => {
      return `# ${text}`;
    });

    // Helper: Indent text
    Handlebars.registerHelper('indent', (text, spaces = 4) => {
      const indent = ' '.repeat(spaces);
      return text.split('\n').map(line => indent + line).join('\n');
    });
  }

  /**
   * Load and compile a template
   * @param {string} templateName - Template file name (without extension)
   * @param {string} category - Template category (patterns, snippets, etc.)
   * @returns {Promise<Function>} - Compiled template function
   */
  async loadTemplate(templateName, category = 'patterns') {
    const cacheKey = `${category}/${templateName}`;
    
    // Return cached template if available
    if (this.templates.has(cacheKey)) {
      return this.templates.get(cacheKey);
    }

    const templatePath = path.join(this.templatesDir, category, `${templateName}.hbs`);
    
    try {
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const compiled = Handlebars.compile(templateContent);
      
      // Cache the compiled template
      this.templates.set(cacheKey, compiled);
      
      return compiled;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Template not found: ${templatePath}`);
      }
      throw error;
    }
  }

  /**
   * Render a template with data
   * @param {string} templateName - Template file name
   * @param {Object} data - Template data
   * @param {string} category - Template category
   * @returns {Promise<string>} - Rendered template
   */
  async render(templateName, data, category = 'patterns') {
    const template = await this.loadTemplate(templateName, category);
    return template(data);
  }

  /**
   * Register a partial template
   * @param {string} name - Partial name
   * @param {string} content - Partial content
   */
  registerPartial(name, content) {
    Handlebars.registerPartial(name, content);
  }

  /**
   * Load and register a partial from file
   * @param {string} name - Partial name
   * @param {string} filePath - Path to partial file
   */
  async loadPartial(name, filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    this.registerPartial(name, content);
  }

  /**
   * Load all partials from a directory
   * @param {string} directory - Directory containing partials
   */
  async loadPartials(directory = 'snippets') {
    const partialsDir = path.join(this.templatesDir, directory);
    
    try {
      const files = await fs.readdir(partialsDir);
      
      for (const file of files) {
        if (file.endsWith('.hbs')) {
          const name = path.basename(file, '.hbs');
          const filePath = path.join(partialsDir, file);
          await this.loadPartial(name, filePath);
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // Directory doesn't exist, skip loading partials
    }
  }

  /**
   * Clear template cache
   */
  clearCache() {
    this.templates.clear();
  }

  /**
   * Register a custom helper
   * @param {string} name - Helper name
   * @param {Function} fn - Helper function
   */
  registerHelper(name, fn) {
    Handlebars.registerHelper(name, fn);
  }
}

export default TemplateEngine;
