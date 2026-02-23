/**
 * Process Manager Service
 * Handles starting, stopping, and monitoring OpenClaw process
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

// Default OpenClaw path
const DEFAULT_OPENCLAW_PATH = path.join(process.env.HOME || '/root', '.openclaw');

// Singleton instance
let instance = null;

// Mutex for concurrent operations
class Mutex {
  constructor() {
    this.locked = false;
    this.queue = [];
  }

  async lock() {
    if (!this.locked) {
      this.locked = true;
      return;
    }

    return new Promise(resolve => {
      this.queue.push(resolve);
    });
  }

  unlock() {
    if (this.queue.length > 0) {
      const resolve = this.queue.shift();
      resolve();
    } else {
      this.locked = false;
    }
  }
}

export class ProcessManager {
  constructor(openclawPath = DEFAULT_OPENCLAW_PATH) {
    if (instance) {
      return instance;
    }

    this.openclawPath = openclawPath;
    this.process = null;
    this.pid = null;
    this.status = 'stopped';
    this.startTime = null;
    this.mutex = new Mutex();

    instance = this;
  }

  /**
   * Get singleton instance
   */
  static getInstance(openclawPath = DEFAULT_OPENCLAW_PATH) {
    if (!instance) {
      instance = new ProcessManager(openclawPath);
    }
    return instance;
  }

  /**
   * Check if command exists in PATH
   */
  async commandExists(command) {
    try {
      await execAsync(`which ${command}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Detect OpenClaw installation type
   * Returns: 'bundle' | 'system' | null
   */
  async detectInstallation() {
    // Check for ClawX bundle first (backward compatibility)
    const bundleUvPath = path.join(this.openclawPath, 'uv');
    const bundleOpenclawPath = path.join(this.openclawPath, 'openclaw');

    const hasBundleUv = await this.fileExists(bundleUvPath);
    const hasBundleOpenclaw = await this.fileExists(bundleOpenclawPath);

    if (hasBundleUv && hasBundleOpenclaw) {
      return 'bundle';
    }

    // Check for system installation
    const hasSystemOpenclaw = await this.commandExists('openclaw');

    if (hasSystemOpenclaw) {
      return 'system';
    }

    return null;
  }

  /**
   * Get OpenClaw command based on installation type
   */
  async getOpenClawCommand() {
    const installType = await this.detectInstallation();

    if (installType === 'bundle') {
      // ClawX bundle: use uv run openclaw
      return {
        type: 'bundle',
        command: path.join(this.openclawPath, 'uv'),
        args: ['run', 'openclaw', 'gateway'],
        cwd: this.openclawPath
      };
    } else if (installType === 'system') {
      // System installation: use openclaw directly
      return {
        type: 'system',
        command: 'openclaw',
        args: ['gateway'],
        cwd: this.openclawPath
      };
    } else {
      throw new Error('OpenClaw not found. Please install OpenClaw first.\n\nInstallation options:\n- npm install -g openclaw\n- brew install openclaw\n- Download from https://github.com/ValueCell-ai/openclaw');
    }
  }

  /**
   * Get diagnostics information
   */
  async getDiagnostics() {
    const installType = await this.detectInstallation();

    const diagnostics = {
      installationType: installType,
      openclawPath: this.openclawPath,
      checks: {}
    };

    // Check bundle installation
    const bundleUvPath = path.join(this.openclawPath, 'uv');
    const bundleOpenclawPath = path.join(this.openclawPath, 'openclaw');
    diagnostics.checks.bundleUv = await this.fileExists(bundleUvPath);
    diagnostics.checks.bundleOpenclaw = await this.fileExists(bundleOpenclawPath);

    // Check system installation
    diagnostics.checks.systemOpenclaw = await this.commandExists('openclaw');
    diagnostics.checks.systemUv = await this.commandExists('uv');

    // Get paths
    try {
      const { stdout: openclawWhich } = await execAsync('which openclaw');
      diagnostics.paths = { openclaw: openclawWhich.trim() };
    } catch {
      diagnostics.paths = { openclaw: null };
    }

    try {
      const { stdout: uvWhich } = await execAsync('which uv');
      diagnostics.paths.uv = uvWhich.trim();
    } catch {
      diagnostics.paths.uv = null;
    }

    // Get version if available
    if (diagnostics.checks.systemOpenclaw) {
      try {
        const { stdout } = await execAsync('openclaw --version');
        diagnostics.version = stdout.trim();
      } catch {
        diagnostics.version = null;
      }
    }

    return diagnostics;
  }

  /**
   * Check if systemd is available
   */
  async isSystemdAvailable() {
    try {
      await execAsync('which systemctl');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if OpenClaw is managed by systemd
   */
  async isSystemdManaged() {
    if (!await this.isSystemdAvailable()) {
      return false;
    }

    try {
      await execAsync('systemctl is-enabled openclaw 2>/dev/null');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get systemd service status
   */
  async getSystemdStatus() {
    if (!await this.isSystemdAvailable()) {
      return null;
    }

    try {
      const { stdout } = await execAsync('systemctl status openclaw --no-pager 2>/dev/null || echo "not-found"');

      if (stdout.includes('not-found')) {
        return { exists: false, active: false, enabled: false };
      }

      const active = stdout.includes('Active: active');
      const enabled = stdout.includes('enabled;');

      return {
        exists: true,
        active,
        enabled,
        output: stdout
      };
    } catch {
      return { exists: false, active: false, enabled: false };
    }
  }

  /**
   * Enable auto-start on boot
   */
  async enableAutoStart() {
    await this.mutex.lock();
    try {
      if (!await this.isSystemdAvailable()) {
        throw new Error('Systemd is not available on this system');
      }

      const status = await this.getSystemdStatus();
      if (!status.exists) {
        throw new Error('OpenClaw systemd service not found. Please create the service first.');
      }

      await execAsync('sudo systemctl enable openclaw');
      return { success: true, message: 'Auto-start enabled' };
    } finally {
      this.mutex.unlock();
    }
  }

  /**
   * Disable auto-start on boot
   */
  async disableAutoStart() {
    await this.mutex.lock();
    try {
      if (!await this.isSystemdAvailable()) {
        throw new Error('Systemd is not available on this system');
      }

      await execAsync('sudo systemctl disable openclaw 2>/dev/null || true');
      return { success: true, message: 'Auto-start disabled' };
    } finally {
      this.mutex.unlock();
    }
  }

  /**
   * Check if OpenClaw is running
   */
  async isRunning() {
    try {
      // Check for process
      const { stdout } = await execAsync('pgrep -f "openclaw"');
      const pids = stdout.trim().split('\n').filter(p => p);
      return pids.length > 0 ? pids : false;
    } catch {
      return false;
    }
  }

  /**
   * Get process status
   */
  async getStatus() {
    const pids = await this.isRunning();

    if (pids) {
      // Get process info
      try {
        const { stdout } = await execAsync(`ps -p ${pids[0]} -o pid,ppid,%cpu,%mem,etime,cmd`);
        const lines = stdout.trim().split('\n');
        if (lines.length > 1) {
          const parts = lines[1].trim().split(/\s+/);
          return {
            running: true,
            pid: parseInt(parts[0]),
            ppid: parseInt(parts[1]),
            cpu: parseFloat(parts[2]),
            memory: parseFloat(parts[3]),
            elapsed: parts[4],
            command: parts.slice(5).join(' ')
          };
        }
      } catch {
        // Process might have ended
      }
    }

    return {
      running: false,
      pid: null,
      cpu: 0,
      memory: 0,
      elapsed: null,
      command: null
    };
  }

  /**
   * Get process metrics (CPU, memory over time)
   */
  async getMetrics() {
    const status = await this.getStatus();

    if (!status.running) {
      return {
        cpu: 0,
        memory: 0,
        pid: null,
        uptime: 0
      };
    }

    // Get memory in MB
    const memMB = status.memory / 100 * os.totalmem() / 1024 / 1024;

    // Calculate uptime from elapsed time
    let uptime = 0;
    if (status.elapsed) {
      const parts = status.elapsed.split(':');
      if (parts.length === 3) {
        uptime = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
      } else if (parts.length === 2) {
        uptime = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      }
    }

    return {
      cpu: status.cpu,
      memory: Math.round(memMB * 100) / 100,
      pid: status.pid,
      uptime
    };
  }

  /**
   * Start OpenClaw process
   */
  async start() {
    await this.mutex.lock();
    try {
      // Get command based on installation type
      const commandInfo = await this.getOpenClawCommand();

      // Check if already running
      if (await this.isRunning()) {
        throw new Error('OpenClaw is already running');
      }

      return new Promise((resolve, reject) => {
        const child = spawn(
          commandInfo.command,
          commandInfo.args,
          {
            cwd: commandInfo.cwd,
            detached: true,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
              ...process.env,
              OPENCLAW_PATH: this.openclawPath
            }
          }
        );

        // Unref so parent can exit
        child.unref();

        this.process = child;
        this.pid = child.pid;
        this.startTime = Date.now();
        this.status = 'starting';

        console.log(`[OpenClaw] Starting with ${commandInfo.type} installation`);
        console.log(`[OpenClaw] Command: ${commandInfo.command} ${commandInfo.args.join(' ')}`);

        child.stdout.on('data', (data) => {
          console.log('[OpenClaw]', data.toString().trim());
        });

        child.stderr.on('data', (data) => {
          console.error('[OpenClaw Error]', data.toString().trim());
        });

        child.on('error', (error) => {
          this.status = 'error';
          console.error('[OpenClaw] Spawn error:', error);
          reject(error);
        });

        child.on('exit', (code) => {
          this.status = code === 0 ? 'stopped' : 'crashed';
          this.process = null;
          this.pid = null;
          console.log(`[OpenClaw] Exited with code ${code}`);
        });

        // Wait a bit and check if started
        setTimeout(async () => {
          if (await this.isRunning()) {
            this.status = 'running';
            console.log(`[OpenClaw] Started successfully (PID: ${this.pid})`);
            resolve({ success: true, pid: this.pid, type: commandInfo.type });
          } else {
            reject(new Error('Failed to start OpenClaw. Check logs for details.'));
          }
        }, 3000);
      });
    } finally {
      this.mutex.unlock();
    }
  }

  /**
   * Stop OpenClaw process
   */
  async stop() {
    await this.mutex.lock();
    try {
      const pids = await this.isRunning();

      if (!pids) {
        return { success: true, message: 'OpenClaw is not running' };
      }

      // Try graceful shutdown first
      for (const pid of pids) {
        try {
          process.kill(parseInt(pid), 'SIGTERM');
        } catch {
          // Process might already be gone
        }
      }

      // Wait for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Force kill if still running
      if (await this.isRunning()) {
        for (const pid of pids) {
          try {
            process.kill(parseInt(pid), 'SIGKILL');
          } catch {
            // Already gone
          }
        }
      }

      this.status = 'stopped';
      return { success: true, message: 'OpenClaw stopped' };
    } finally {
      this.mutex.unlock();
    }
  }

  /**
   * Restart OpenClaw
   */
  async restart() {
    await this.stop();
    return this.start();
  }

  /**
   * Get recent logs
   */
  async getLogs(lines = 100) {
    const logsPath = path.join(this.openclawPath, 'logs', 'openclaw.log');

    try {
      const { stdout } = await execAsync(`tail -n ${lines} ${logsPath}`);
      return stdout;
    } catch {
      // Try journalctl if log file not found
      try {
        const { stdout } = await execAsync(
          `journalctl -u openclaw --no-pager -n ${lines} 2>/dev/null || echo "No logs available"`
        );
        return stdout;
      } catch {
        return 'No logs available';
      }
    }
  }

  /**
   * Follow logs (streaming)
   */
  async *streamLogs() {
    const logsPath = path.join(this.openclawPath, 'logs', 'openclaw.log');

    try {
      const tail = spawn('tail', ['-f', logsPath], {
        cwd: this.openclawPath
      });

      for await (const chunk of tail.stdout) {
        yield chunk.toString();
      }
    } catch (error) {
      yield `Error streaming logs: ${error.message}`;
    }
  }

  /**
   * Test OpenClaw connection
   */
  async testConnection(port = 18789) {
    const http = await import('http');

    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${port}/health`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ success: true, data: json });
          } catch {
            resolve({ success: true, data: 'Connected' });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      req.setTimeout(5000, () => {
        req.destroy();
        resolve({ success: false, error: 'Connection timeout' });
      });
    });
  }
}

export default ProcessManager;
