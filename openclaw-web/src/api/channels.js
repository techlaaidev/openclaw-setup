/**
 * Channels API Routes - Telegram, Zalo, WhatsApp Management
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const router = Router();

// Channel types
const CHANNEL_TYPES = ['telegram', 'zalo', 'whatsapp'];

// Validation schemas
const channelSchema = z.object({
  name: z.string().min(1),
  type: z.enum(CHANNEL_TYPES),
  enabled: z.boolean().default(true),
  config: z.record(z.any()).optional()
});

// Get all channels
router.get('/', async (req, res) => {
  const db = req.app.get('db');

  try {
    const channels = await db.promisified.all(`
      SELECT id, name, type, enabled, config, created_at, updated_at
      FROM channels
      ORDER BY created_at DESC
    `);

    const result = channels.map(c => ({
      ...c,
      config: c.config ? JSON.parse(c.config) : null
    }));

    res.json({ channels: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get channel types
router.get('/types', (req, res) => {
  res.json({
    types: [
      {
        id: 'telegram',
        name: 'Telegram',
        icon: '📱',
        description: 'Telegram Bot',
        fields: [
          { name: 'bot_token', label: 'Bot Token', type: 'password', required: true },
          { name: 'allowed_users', label: 'Allowed Users (comma-separated)', type: 'text', required: false },
          { name: 'admin_users', label: 'Admin Users (comma-separated)', type: 'text', required: false }
        ]
      },
      {
        id: 'zalo',
        name: 'Zalo',
        icon: '💬',
        description: 'Zalo Official Account',
        fields: [
          { name: 'app_id', label: 'App ID', type: 'text', required: true },
          { name: 'app_secret', label: 'App Secret', type: 'password', required: true },
          { name: 'oa_id', label: 'OA ID', type: 'text', required: true },
          { name: 'webhook_url', label: 'Webhook URL', type: 'text', required: true },
          { name: 'verify_token', label: 'Verify Token', type: 'password', required: true }
        ]
      },
      {
        id: 'whatsapp',
        name: 'WhatsApp',
        icon: '📞',
        description: 'WhatsApp Business (Baileys)',
        fields: [
          { name: 'phone_number', label: 'Phone Number', type: 'text', required: true },
          { name: 'session_id', label: 'Session ID', type: 'text', required: false }
        ]
      }
    ]
  });
});

// Get single channel
router.get('/:id', async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;

  try {
    const channel = await db.promisified.get('SELECT * FROM channels WHERE id = ?', id);

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    res.json({
      channel: {
        ...channel,
        config: channel.config ? JSON.parse(channel.config) : null
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create channel
router.post('/', async (req, res) => {
  const db = req.app.get('db');

  try {
    const validation = channelSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
    }

    const { name, type, enabled, config } = validation.data;
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.promisified.run(`
      INSERT INTO channels (id, name, type, enabled, config, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, id, name, type, enabled ? 1 : 0, config ? JSON.stringify(config) : null, now, now);

    res.json({ success: true, id, message: 'Channel created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update channel
router.put('/:id', async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;

  try {
    const existing = await db.promisified.get('SELECT * FROM channels WHERE id = ?', id);
    if (!existing) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const updates = req.body;
    const now = new Date().toISOString();

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

    await db.promisified.run(`UPDATE channels SET ${fields.join(', ')} WHERE id = ?`, ...values);

    res.json({ success: true, message: 'Channel updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete channel
router.delete('/:id', async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;

  try {
    await db.promisified.run('DELETE FROM channels WHERE id = ?', id);
    res.json({ success: true, message: 'Channel deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enable channel
router.post('/:id/enable', async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;

  try {
    await db.promisified.run('UPDATE channels SET enabled = 1, updated_at = ? WHERE id = ?',
      new Date().toISOString(),
      id
    );

    res.json({ success: true, message: 'Channel enabled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disable channel
router.post('/:id/disable', async (req, res) => {
  const db = req.app.get('db');
  const { id } = req.params;

  try {
    await db.promisified.run('UPDATE channels SET enabled = 0, updated_at = ? WHERE id = ?',
      new Date().toISOString(),
      id
    );

    res.json({ success: true, message: 'Channel disabled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
