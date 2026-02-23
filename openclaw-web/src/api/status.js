/**
 * Status API Routes - Real-time status via SSE
 */

import { Router } from 'express';
import ProcessManager from '../services/ProcessManager.js';

const router = Router();
const processManager = new ProcessManager();

// SSE endpoint for real-time status
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Send initial data
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

  // Poll status every 2 seconds
  const interval = setInterval(async () => {
    try {
      const status = await processManager.getStatus();
      const metrics = await processManager.getMetrics();
      const connection = await processManager.testConnection();

      res.write(`data: ${JSON.stringify({
        type: 'status',
        timestamp: Date.now(),
        ...status,
        ...metrics,
        gatewayConnected: connection.success
      })}\n\n`);
    } catch (error) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    }
  }, 2000);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

// Get current status (non-streaming)
router.get('/', async (req, res) => {
  try {
    const status = await processManager.getStatus();
    const metrics = await processManager.getMetrics();
    const connection = await processManager.testConnection();

    res.json({
      status: status.running ? 'running' : 'stopped',
      ...status,
      ...metrics,
      gatewayConnected: connection.success,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
