/**
 * Skills API Routes
 */

import { Router } from 'express';
import ConfigManager from '../services/ConfigManager.js';
import { getGatewayClient } from '../services/GatewayClient.js';

const router = Router();
const configManager = new ConfigManager();

const GATEWAY_PORT = process.env.OPENCLAW_GATEWAY_PORT || 18789;

// List all skills
router.get('/', async (req, res) => {
  try {
    const skills = await configManager.listSkills();
    res.json({ skills });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get skill details
router.get('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const skills = await configManager.listSkills();
    const skill = skills.find(s => s.name === name);

    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    res.json({ skill });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update skill config
router.put('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { enabled, config } = req.body;

    // Read current config
    const openclawConfig = await configManager.readConfig() || {};

    if (!openclawConfig.skills) {
      openclawConfig.skills = {};
    }

    if (!openclawConfig.skills[name]) {
      openclawConfig.skills[name] = {};
    }

    if (enabled !== undefined) {
      openclawConfig.skills[name].enabled = enabled;
    }

    if (config) {
      openclawConfig.skills[name] = { ...openclawConfig.skills[name], ...config };
    }

    await configManager.writeConfig(openclawConfig);
    res.json({ success: true, message: `Skill ${name} updated` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reload skills
router.post('/reload', async (req, res) => {
  try {
    const gatewayClient = getGatewayClient(GATEWAY_PORT);

    if (!gatewayClient.isConnected()) {
      // Try to connect
      try {
        await gatewayClient.connect();
      } catch (error) {
        return res.status(500).json({
          error: 'Gateway not connected',
          message: 'Cannot reload skills without gateway connection'
        });
      }
    }

    // Send reload command to gateway
    gatewayClient.reloadSkills();

    try {
      await gatewayClient.waitForMessage('skills.reloaded', 5000);
      res.json({ success: true, message: 'Skills reloaded' });
    } catch (error) {
      res.json({ success: true, message: 'Reload command sent (no confirmation)' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get skill marketplace (mock for now)
router.get('/marketplace/list', async (req, res) => {
  // This would integrate with a skill marketplace in production
  res.json({
    skills: [
      { name: 'weather', description: 'Get weather information', author: 'OpenClaw' },
      { name: 'search', description: 'Web search capability', author: 'OpenClaw' },
      { name: 'calculator', description: 'Mathematical calculations', author: 'OpenClaw' },
      { name: 'reminder', description: 'Set reminders and notifications', author: 'OpenClaw' }
    ]
  });
});

export default router;
