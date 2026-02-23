/**
 * Process Management API Routes
 */

import { Router } from 'express';
import ProcessManager from '../services/ProcessManager.js';

const router = Router();
const processManager = new ProcessManager();

// Get process status
router.get('/status', async (req, res) => {
  try {
    const status = await processManager.getStatus();
    const metrics = await processManager.getMetrics();
    const connection = await processManager.testConnection();

    res.json({
      ...status,
      ...metrics,
      gatewayConnected: connection.success
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start OpenClaw
router.post('/start', async (req, res) => {
  try {
    const result = await processManager.start();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop OpenClaw
router.post('/stop', async (req, res) => {
  try {
    const result = await processManager.stop();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restart OpenClaw
router.post('/restart', async (req, res) => {
  try {
    const result = await processManager.restart();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get process logs
router.get('/logs', async (req, res) => {
  try {
    const lines = parseInt(req.query.lines) || 100;
    const logs = await processManager.getLogs(lines);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get process metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await processManager.getMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test gateway connection
router.get('/test', async (req, res) => {
  try {
    const result = await processManager.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get systemd status
router.get('/systemd/status', async (req, res) => {
  try {
    const status = await processManager.getSystemdStatus();
    res.json(status || { exists: false, message: 'Systemd not available' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enable auto-start on boot
router.post('/systemd/enable', async (req, res) => {
  try {
    const result = await processManager.enableAutoStart();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disable auto-start on boot
router.post('/systemd/disable', async (req, res) => {
  try {
    const result = await processManager.disableAutoStart();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if systemd is available
router.get('/systemd/available', async (req, res) => {
  try {
    const available = await processManager.isSystemdAvailable();
    const managed = await processManager.isSystemdManaged();
    res.json({ available, managed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get diagnostics information
router.get('/diagnostics', async (req, res) => {
  try {
    const diagnostics = await processManager.getDiagnostics();
    res.json(diagnostics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
