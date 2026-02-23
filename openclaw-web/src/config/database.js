import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'openclaw-web.db');

// Promisify sqlite3 methods
function promisifyDb(db) {
  return {
    run: promisify(db.run.bind(db)),
    get: promisify(db.get.bind(db)),
    all: promisify(db.all.bind(db)),
    exec: promisify(db.exec.bind(db)),
    close: promisify(db.close.bind(db)),
    prepare: (sql) => {
      const stmt = db.prepare(sql);
      return {
        run: promisify(stmt.run.bind(stmt)),
        get: promisify(stmt.get.bind(stmt)),
        all: promisify(stmt.all.bind(stmt)),
        finalize: promisify(stmt.finalize.bind(stmt))
      };
    }
  };
}

export async function initDatabase() {
  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, async (err) => {
      if (err) {
        reject(err);
        return;
      }

      const promisedDb = promisifyDb(db);

      try {
        // Enable WAL mode for better concurrency
        await promisedDb.run('PRAGMA journal_mode = WAL');

        // Create tables
        await promisedDb.exec(`
          -- Users table
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME
          );

          -- Sessions table
          CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            ip_address TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          );

          -- Config versions table (for backup/restore)
          CREATE TABLE IF NOT EXISTS config_versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version TEXT NOT NULL,
            config_type TEXT NOT NULL,
            config_data TEXT NOT NULL,
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id)
          );

          -- Providers table (AI model configurations)
          CREATE TABLE IF NOT EXISTS providers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('anthropic', 'openai', 'google', 'openrouter', 'moonshot', 'siliconflow', 'ollama', 'custom')),
            base_url TEXT,
            model TEXT,
            api_key_encrypted TEXT,
            enabled INTEGER DEFAULT 1,
            config TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          -- Channels table
          CREATE TABLE IF NOT EXISTS channels (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('telegram', 'zalo', 'whatsapp')),
            enabled INTEGER DEFAULT 1,
            config TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          -- Create indexes
          CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
          CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
          CREATE INDEX IF NOT EXISTS idx_providers_type ON providers(type);
          CREATE INDEX IF NOT EXISTS idx_channels_type ON channels(type);
        `);

        // Create default admin user if not exists
        const adminExists = await promisedDb.get('SELECT id FROM users WHERE username = ?', 'admin');
        if (!adminExists) {
          const bcrypt = await import('bcrypt');
          const passwordHash = await bcrypt.hash('admin123', 12);
          await promisedDb.run(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            'admin', passwordHash, 'admin'
          );
          console.log('Default admin user created (username: admin, password: admin123)');
        }

        // Store the promisified version
        db.promisified = promisedDb;
        resolve(db);
      } catch (error) {
        reject(error);
      }
    });
  });
}

export function getDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
        return;
      }
      db.promisified = promisifyDb(db);
      resolve(db);
    });
  });
}
