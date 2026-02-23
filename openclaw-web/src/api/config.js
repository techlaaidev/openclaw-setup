/**
 * Configuration API Routes
 */

import { Router } from 'express';
import ConfigManager from '../services/ConfigManager.js';

const router = Router();
const configManager = new ConfigManager();

// Get current config
router.get('/', async (req, res) => {
  try {
    const config = await configManager.readConfig();
    const paths = configManager.getPaths();

    res.json({
      config: config || {},
      paths,
      validation: configManager.validateConfig(config)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update config
router.put('/', async (req, res) => {
  try {
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({ error: 'Config object required' });
    }

    const validation = configManager.validateConfig(config);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid config', details: validation.errors });
    }

    await configManager.writeConfig(config);
    res.json({ success: true, message: 'Configuration saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update specific section
router.patch('/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const updates = req.body;

    await configManager.updateConfig(section, updates);
    res.json({ success: true, message: `${section} updated` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validate config
router.post('/validate', async (req, res) => {
  try {
    const { config } = req.body;
    const validation = configManager.validateConfig(config);
    res.json(validation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create backup
router.post('/backup', async (req, res) => {
  try {
    const backupPath = await configManager.createBackup();
    res.json({ success: true, backup: backupPath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List backups
router.get('/backups', async (req, res) => {
  try {
    const backups = await configManager.listBackups();
    res.json({ backups });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restore from backup
router.post('/restore/:backupName', async (req, res) => {
  try {
    const { backupName } = req.params;
    const config = await configManager.restoreBackup(backupName);
    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get .env variables
router.get('/env', async (req, res) => {
  try {
    const env = await configManager.readEnv();
    // Mask sensitive values
    const masked = Object.entries(env).reduce((acc, [key, value]) => {
      const sensitive = /KEY|SECRET|PASSWORD|TOKEN/i.test(key);
      acc[key] = sensitive && value ? '••••••••' : value;
      return acc;
    }, {});
    res.json({ env: masked });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update .env variable
router.put('/env/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Value required' });
    }

    await configManager.updateEnv(key, value);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
