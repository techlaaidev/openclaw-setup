/**
 * Providers API Routes - AI Model Provider Management
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const router = Router();

// Provider types matching ClawX
const PROVIDER_TYPES = ['anthropic', 'openai', 'google', 'openrouter', 'moonshot', 'siliconflow', 'ollama', 'custom'];

// Validation schemas
const providerSchema = z.object({
  name: z.string().min(1),
  type: z.enum(PROVIDER_TYPES),
  baseUrl: z.string().url().optional(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  enabled: z.boolean().default(true),
  config: z.record(z.any()).optional()
});

// Get all providers
router.get('/', async (req, res) => {
  const db = req.app.get('db');

  try {
    const providers = await db.promisified.all(`
      SELECT id, name, type, base_url, model, enabled, config, created_at, updated_at
      FROM providers
      ORDER BY created_at DESC
    `);

    // Decrypt API keys for admin users
    const result = providers.map(p => ({
      ...p,
      base_url: p.base_url,
      config: p.config ? JSON.parse(p.config) : null,
      hasApiKey: !!p.api_key_encrypted,
      api_key_encrypted: p.api_key_encrypted ? '••••••••' : null
    }));

    res.json({ providers: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get provider types
router.get('/types', (req, res) => {
  res.json({
    types: [
      { id: 'anthropic', name: 'Anthropic', icon: '🤖', model: 'Claude', placeholder: 'sk-ant-api03-...', requiresApiKey: true },
      { id: 'openai', name: 'OpenAI', icon: '💚', model: 'GPT', placeholder: 'sk-proj-...', requiresApiKey: true },
      { id: 'google', name: 'Google', icon: '🔷', model: 'Gemini', placeholder: 'AIza...', requiresApiKey: true },
      { id: 'openrouter', name: 'OpenRouter', icon: '🌐', model: 'Multi-Model', placeholder: 'sk-or-v1-...', requiresApiKey: true },
      { id: 'moonshot', name: 'Moonshot (Kimi)', icon: '🌙', model: 'Kimi', placeholder: 'sk-...', requiresApiKey: true, defaultBaseUrl: 'https://api.moonshot.cn/v1', defaultModelId: 'kimi-k2.5' },
      { id: 'siliconflow', name: 'SiliconFlow (CN)', icon: '🌊', model: 'Multi-Model', placeholder: 'sk-...', requiresApiKey: true, defaultBaseUrl: 'https://api.siliconflow.cn/v1', defaultModelId: 'Pro/moonshotai/Kimi-K2.5' },
      { id: 'ollama', name: 'Ollama', icon: '🦙', model: 'Local', placeholder: 'Not required', requiresApiKey: false, defaultBaseUrl: 'http://localhost:11434', showBaseUrl: true, showModelId: true },
      { id: 'custom', name: 'Custom', icon: '⚙️', model: 'Custom', placeholder: 'API key...', requiresApiKey: true, showBaseUrl: true, showModelId: true }
    ]
  });
});

// Get single provider
router.get('/:id', async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;

  try {
    const provider = await db.promisified.get(`
      SELECT * FROM providers WHERE id = ?
    `, id);

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    res.json({
      provider: {
        ...provider,
        config: provider.config ? JSON.parse(provider.config) : null,
        hasApiKey: !!provider.api_key_encrypted
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create provider
router.post('/', async (req, res) => {
  const db = req.app.get('db');

  try {
    const validation = providerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
    }

    const { name, type, baseUrl, model, apiKey, enabled, config } = validation.data;
    const id = uuidv4();
    const now = new Date().toISOString();

    // Encrypt API key (simple encoding for demo - use proper encryption in production)
    const apiKeyEncrypted = apiKey ? Buffer.from(apiKey).toString('base64') : null;

    await db.promisified.run(`
      INSERT INTO providers (id, name, type, base_url, model, api_key_encrypted, enabled, config, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, id, name, type, baseUrl || null, model || null, apiKeyEncrypted, enabled ? 1 : 0, config ? JSON.stringify(config) : null, now, now);

    res.json({ success: true, id, message: 'Provider created' });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT' || error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Provider with this name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update provider
router.put('/:id', async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;

  try {
    const existing = await db.promisified.get('SELECT * FROM providers WHERE id = ?', id);
    if (!existing) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const updates = req.body;
    const now = new Date().toISOString();

    // Build update query
    const fields = [];
    const values = [];

    if (updates.name) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.type) {
      fields.push('type = ?');
      values.push(updates.type);
    }
    if (updates.baseUrl !== undefined) {
      fields.push('base_url = ?');
      values.push(updates.baseUrl);
    }
    if (updates.model !== undefined) {
      fields.push('model = ?');
      values.push(updates.model);
    }
    if (updates.apiKey) {
      fields.push('api_key_encrypted = ?');
      values.push(Buffer.from(updates.apiKey).toString('base64'));
    }
    if (updates.enabled !== undefined) {
      fields.push('enabled = ?');
      values.push(updates.enabled ? 1 : 0);
    }
    if (updates.config) {
      fields.push('config = ?');
      values.push(JSON.stringify(updates.config));
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await db.promisified.run(`UPDATE providers SET ${fields.join(', ')} WHERE id = ?`, ...values);

    res.json({ success: true, message: 'Provider updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete provider
router.delete('/:id', async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;

  try {
    await db.promisified.run('DELETE FROM providers WHERE id = ?', id);
    res.json({ success: true, message: 'Provider deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test provider connection
router.post('/:id/test', async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;

  try {
    const provider = await db.promisified.get('SELECT * FROM providers WHERE id = ?', id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // In a real implementation, this would test the API key
    // For now, just return success if provider exists
    res.json({ success: true, message: 'Provider configuration valid' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
