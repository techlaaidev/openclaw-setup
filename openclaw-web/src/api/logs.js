/**
 * Logs API Routes
 */

import { Router } from 'express';
import { spawn } from 'child_process';
import ProcessManager from '../services/ProcessManager.js';

const router = Router();
const processManager = new ProcessManager();

// Get logs
router.get('/', async (req, res) => {
  try {
    const lines = parseInt(req.query.lines) || 100;
    const logs = await processManager.getLogs(lines);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stream logs via SSE
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let logs = '';
  const maxLogs = 1000;

  // Start tail process
  const logsPath = path.join(processManager.openclawPath, 'logs', 'openclaw.log');

  const tail = spawn('tail', ['-f', '-n', '0', logsPath], {
    cwd: processManager.openclawPath
  });

  tail.stdout.on('data', (data) => {
    logs += data.toString();

    // Keep only last maxLogs lines
    const lines = logs.split('\n');
    if (lines.length > maxLogs) {
      logs = lines.slice(-maxLogs).join('\n');
    }

    res.write(`data: ${JSON.stringify({ type: 'log', data: data.toString() })}\n\n`);
  });

  tail.stderr.on('data', (data) => {
    res.write(`data: ${JSON.stringify({ type: 'error', data: data.toString() })}\n\n`);
  });

  req.on('close', () => {
    tail.kill();
    res.end();
  });
});

export default router;
