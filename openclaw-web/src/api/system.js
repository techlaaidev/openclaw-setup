/**
 * System API Routes
 */

import { Router } from 'express';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const router = Router();
const execAsync = promisify(exec);

// Get system information
router.get('/info', async (req, res) => {
  try {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    res.json({
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      uptime: os.uptime(),
      cpu: {
        model: cpus[0]?.model || 'Unknown',
        cores: cpus.length,
        speed: cpus[0]?.speed || 0
      },
      memory: {
        total: totalMem,
        free: freeMem,
        used: totalMem - freeMem,
        totalGB: (totalMem / 1024 / 1024 / 1024).toFixed(2),
        usedGB: ((totalMem - freeMem) / 1024 / 1024 / 1024).toFixed(2),
        freeGB: (freeMem / 1024 / 1024 / 1024).toFixed(2),
        percent: Math.round((totalMem - freeMem) / totalMem * 100)
      },
      loadavg: os.loadavg()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get network information
router.get('/network', async (req, res) => {
  try {
    const networkInterfaces = os.networkInterfaces();
    const interfaces = [];

    for (const [name, addrs] of Object.entries(networkInterfaces)) {
      for (const addr of addrs) {
        if (addr.family === 'IPv4' && !addr.internal) {
          interfaces.push({
            name,
            address: addr.address,
            netmask: addr.netmask,
            mac: addr.mac
          });
        }
      }
    }

    res.json({
      interfaces,
      hostname: os.hostname()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get system metrics
router.get('/metrics', async (req, res) => {
  try {
    const cpuLoad = os.loadavg();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    // Get disk usage
    let diskUsage = { used: 0, total: 0, percent: 0 };
    try {
      const { stdout } = await execAsync('df -k / | tail -1');
      const parts = stdout.trim().split(/\s+/);
      if (parts.length >= 4) {
        diskUsage = {
          used: parseInt(parts[2]) * 1024,
          total: parseInt(parts[1]) * 1024,
          percent: Math.round(parseInt(parts[2]) / parseInt(parts[1]) * 100)
        };
      }
    } catch {
      // Ignore disk errors
    }

    res.json({
      cpu: {
        load1: cpuLoad[0],
        load5: cpuLoad[1],
        load15: cpuLoad[2],
        cores: os.cpus().length
      },
      memory: {
        used: totalMem - freeMem,
        total: totalMem,
        free: freeMem,
        percent: Math.round((totalMem - freeMem) / totalMem * 100)
      },
      disk: diskUsage,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };

    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get OpenClaw paths
router.get('/paths', async (req, res) => {
  try {
    const configManager = (await import('../services/ConfigManager.js')).default;
    const cm = new configManager();
    res.json(cm.getPaths());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
