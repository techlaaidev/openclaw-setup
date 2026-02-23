/**
 * Chat API Routes - Communication with OpenClaw Gateway
 */

import { Router } from 'express';
import { getGatewayClient } from '../services/GatewayClient.js';

const router = Router();

const GATEWAY_PORT = process.env.OPENCLAW_GATEWAY_PORT || 18789;

// Initialize gateway client
let gatewayClient = null;

function getClient() {
  if (!gatewayClient) {
    gatewayClient = getGatewayClient(GATEWAY_PORT);

    // Auto-connect if not connected
    if (!gatewayClient.isConnected()) {
      gatewayClient.connect().catch(err => {
        console.error('[Chat API] Failed to connect to gateway:', err);
      });
    }
  }
  return gatewayClient;
}

// Get available chat channels
router.get('/channels', async (req, res) => {
  try {
    const client = getClient();

    if (!client.isConnected()) {
      return res.json({ channels: [], error: 'Gateway not connected' });
    }

    // Send request and wait for response
    client.getChannels();
    const channels = await client.waitForMessage('channels.list.response', 3000);

    res.json({ channels });
  } catch (error) {
    res.json({ channels: [], error: error.message });
  }
});

// Get messages from a channel
router.get('/messages/:channelId', async (req, res) => {
  const { channelId } = req.params;
  const { limit = 50 } = req.query;

  try {
    const client = getClient();

    if (!client.isConnected()) {
      return res.json({ messages: [], error: 'Gateway not connected' });
    }

    client.send('chat.messages.get', { channelId, limit: parseInt(limit) });
    const result = await client.waitForMessage('chat.messages.response', 5000);

    res.json({ messages: result.messages || [] });
  } catch (error) {
    res.json({ messages: [], error: error.message });
  }
});

// Send message to a channel
router.post('/messages/:channelId', async (req, res) => {
  const { channelId } = req.params;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }

  try {
    const client = getClient();

    if (!client.isConnected()) {
      return res.status(500).json({ error: 'Gateway not connected' });
    }

    const sent = client.sendChatMessage(channelId, message);

    if (sent) {
      const result = await client.waitForMessage('chat.message.sent', 5000);
      res.json({ success: true, messageId: result.messageId });
    } else {
      res.status(500).json({ error: 'Failed to send message' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete message
router.delete('/messages/:channelId/:messageId', async (req, res) => {
  const { channelId, messageId } = req.params;

  try {
    const client = getClient();

    if (!client.isConnected()) {
      return res.status(500).json({ error: 'Gateway not connected' });
    }

    client.send('chat.message.delete', { channelId, messageId });
    await client.waitForMessage('chat.message.deleted', 3000);

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SSE for incoming messages
router.get('/stream/:channelId', (req, res) => {
  const { channelId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const client = getClient();

  // Send initial connection status
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    channelId,
    gatewayConnected: client.isConnected()
  })}\n\n`);

  // Forward gateway messages to SSE
  const messageHandler = (data) => {
    if (data.channelId === channelId) {
      res.write(`data: ${JSON.stringify({ type: 'message', data })}\n\n`);
    }
  };

  const errorHandler = (error) => {
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
  };

  const disconnectHandler = () => {
    res.write(`data: ${JSON.stringify({ type: 'gateway_disconnected' })}\n\n`);
  };

  const reconnectHandler = () => {
    res.write(`data: ${JSON.stringify({ type: 'gateway_connected' })}\n\n`);
  };

  // Subscribe to gateway events
  client.on('chat.message', messageHandler);
  client.on('error', errorHandler);
  client.on('disconnected', disconnectHandler);
  client.on('connected', reconnectHandler);

  // Heartbeat
  const heartbeatInterval = setInterval(() => {
    res.write(`data: ${JSON.stringify({
      type: 'heartbeat',
      timestamp: Date.now(),
      gatewayConnected: client.isConnected()
    })}\n\n`);
  }, 30000);

  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    client.off('chat.message', messageHandler);
    client.off('error', errorHandler);
    client.off('disconnected', disconnectHandler);
    client.off('connected', reconnectHandler);
    res.end();
  });
});

// Get gateway connection status
router.get('/gateway/status', (req, res) => {
  const client = getClient();
  res.json({
    connected: client.isConnected(),
    reconnectAttempts: client.reconnectAttempts,
    queuedMessages: client.messageQueue.length
  });
});

// Reconnect to gateway
router.post('/gateway/reconnect', async (req, res) => {
  try {
    const client = getClient();

    if (client.isConnected()) {
      return res.json({ success: true, message: 'Already connected' });
    }

    await client.connect();
    res.json({ success: true, message: 'Connected to gateway' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
