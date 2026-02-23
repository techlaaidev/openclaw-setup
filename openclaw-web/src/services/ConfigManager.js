/**
 * Configuration Manager Service
 * Handles reading and writing OpenClaw configuration files
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { validateConfig as zodValidateConfig } from '../config/validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default OpenClaw config path
const DEFAULT_OPENCLAW_PATH = path.join(process.env.HOME || '/root', '.openclaw');

export class ConfigManager {
  constructor(openclawPath = DEFAULT_OPENCLAW_PATH) {
    this.openclawPath = openclawPath;
    this.configPath = path.join(openclawPath, 'config.yaml');
    this.envPath = path.join(openclawPath, '.env');
    this.skillsPath = path.join(openclawPath, 'skills');
    this.dataPath = path.join(openclawPath, 'data');
    this.logsPath = path.join(openclawPath, 'logs');
  }

  /**
   * Read OpenClaw configuration file
   */
  async readConfig() {
    try {
      const configContent = await fs.readFile(this.configPath, 'utf8');
      return yaml.load(configContent);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Write configuration file (atomic write with backup)
   */
  async writeConfig(config) {
    // Create backup first
    await this.createBackup();

    const tempPath = `${this.configPath}.tmp`;
    const configContent = yaml.dump(config, {
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });

    await fs.writeFile(tempPath, configContent, 'utf8');
    await fs.rename(tempPath, this.configPath);

    return config;
  }

  /**
   * Update specific config section
   */
  async updateConfig(section, updates) {
    const config = await this.readConfig() || {};
    config[section] = { ...config[section], ...updates };
    return this.writeConfig(config);
  }

  /**
   * Read .env file
   */
  async readEnv() {
    try {
      const envContent = await fs.readFile(this.envPath, 'utf8');
      const env = {};
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          env[match[1].trim()] = match[2].trim();
        }
      });
      return env;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {};
      }
      throw error;
    }
  }

  /**
   * Write .env file
   */
  async writeEnv(envVars) {
    const lines = Object.entries(envVars).map(([key, value]) => `${key}=${value}`);
    await fs.writeFile(this.envPath, lines.join('\n'), 'utf8');
  }

  /**
   * Update specific env variable
   */
  async updateEnv(key, value) {
    const env = await this.readEnv();
    env[key] = value;
    await this.writeEnv(env);
  }

  /**
   * Create config backup
   */
  async createBackup() {
    try {
      const content = await fs.readFile(this.configPath, 'utf8');
      const backupDir = path.join(this.openclawPath, 'backups');
      await fs.mkdir(backupDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `config.${timestamp}.yaml`);
      await fs.writeFile(backupPath, content, 'utf8');

      // Keep only last 10 backups
      const files = await fs.readdir(backupDir);
      const backupFiles = files
        .filter(f => f.startsWith('config.') && f.endsWith('.yaml'))
        .sort()
        .reverse();

      for (const file of backupFiles.slice(10)) {
        await fs.unlink(path.join(backupDir, file));
      }

      return backupPath;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Backup failed:', error);
      }
      return null;
    }
  }

  /**
   * List available backups
   */
  async listBackups() {
    try {
      const backupDir = path.join(this.openclawPath, 'backups');
      const files = await fs.readdir(backupDir);

      return files
        .filter(f => f.startsWith('config.') && f.endsWith('.yaml'))
        .sort()
        .reverse()
        .map(f => ({
          name: f,
          path: path.join(backupDir, f),
          created: f.replace('config.', '').replace('.yaml', '')
        }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupName) {
    const backupDir = path.join(this.openclawPath, 'backups');
    const backupPath = path.join(backupDir, backupName);

    const content = await fs.readFile(backupPath, 'utf8');
    await this.createBackup(); // Backup current before restore
    await fs.writeFile(this.configPath, content, 'utf8');

    return yaml.load(content);
  }

  /**
   * Get list of installed skills
   */
  async listSkills() {
    try {
      const skillsDir = path.join(this.skillsPath);
      const files = await fs.readdir(skillsDir);

      const skills = [];
      for (const file of files) {
        const skillPath = path.join(skillsDir, file);
        const stat = await fs.stat(skillPath);

        if (stat.isDirectory()) {
          const manifestPath = path.join(skillPath, 'manifest.json');
          try {
            const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
            skills.push({
              name: file,
              path: skillPath,
              ...manifest
            });
          } catch {
            skills.push({
              name: file,
              path: skillPath,
              description: 'No manifest found',
              enabled: true
            });
          }
        }
      }

      return skills;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Validate config
   */
  validateConfig(config) {
    // Use Zod validation
    const result = zodValidateConfig(config);

    if (!result.valid) {
      return {
        valid: false,
        errors: result.errors.map(e => e.path ? `${e.path}: ${e.message}` : e.message)
      };
    }

    return { valid: true, errors: [] };
  }

  /**
   * Get paths
   */
  getPaths() {
    return {
      openclawPath: this.openclawPath,
      configPath: this.configPath,
      envPath: this.envPath,
      skillsPath: this.skillsPath,
      dataPath: this.dataPath,
      logsPath: this.logsPath
    };
  }
}

export default ConfigManager;
