# Contributing to nginxconf-wizard

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/trfhgx/nginxconf-wizard.git
cd nginxconf-wizard

# Install dependencies
npm install

# Link for local testing
npm link
```

## Project Structure

```
src/
├── core/           # Core classes (ConfigBuilder, TemplateEngine, Validator)
├── cli/            # CLI interface and wizard
├── features/       # Feature modules
├── patterns/       # Pattern implementations
└── utils/          # Utility functions

templates/
├── patterns/       # Nginx config templates for each pattern
└── snippets/       # Reusable config snippets

tests/              # Test files
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check linting
npm run lint

# Format code
npm run format
```

## Commit Convention

We use conventional commits:

```bash
feat: add HTTP/3 support
fix: correct SSL cipher configuration
docs: update installation guide
test: add validator tests
perf: optimize template rendering
refactor: simplify ConfigBuilder
```

## Adding a New Pattern

1. Create template in `templates/patterns/your-pattern.hbs`
2. Add pattern to `ConfigBuilder` valid patterns list
3. Update wizard choices in `src/cli/Wizard.js`
4. Add tests
5. Update documentation

## Adding a New Feature

1. Create feature module in `src/features/`
2. Add configuration options to wizard
3. Create template snippets if needed
4. Add tests
5. Update documentation

## Testing Your Changes

```bash
# Generate a config with your changes
npm run dev

# Test specific pattern
npm run dev -- --preset your-pattern
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Make your changes
4. Add tests
5. Run tests (`npm test`)
6. Commit (`git commit -m 'feat: add amazing feature'`)
7. Push (`git push origin feat/amazing-feature`)
8. Open a Pull Request

## Questions?

Open an issue or discussion on GitHub.
