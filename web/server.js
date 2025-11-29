import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import TreeConfigBuilder from '../src/core/TreeConfigBuilder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT =  5012;

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Generate nginx config from state
app.post('/api/generate', (req, res) => {
  try {
    const { state } = req.body;
    
    if (!state) {
      return res.status(400).json({ error: 'State is required' });
    }

    const builder = new TreeConfigBuilder();
    builder.setState(state);
    
    const validation = builder.validate();
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        errors: validation.errors,
        warnings: validation.warnings 
      });
    }

    const config = builder.build();
    
    res.json({ 
      config,
      warnings: validation.warnings 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validate config without generating
app.post('/api/validate', (req, res) => {
  try {
    const { state } = req.body;
    
    if (!state) {
      return res.status(400).json({ error: 'State is required' });
    }

    const builder = new TreeConfigBuilder();
    builder.setState(state);
    const validation = builder.validate();
    
    res.json(validation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Nginx Config Wizard UI running at http://localhost:${PORT}`);
});

export default app;
