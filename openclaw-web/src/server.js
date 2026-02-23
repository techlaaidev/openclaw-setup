import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import FileStore from 'session-file-store';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

import { initDatabase } from './config/database.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errors.js';
import { securityHeaders } from './middleware/security.js';

// API Routes
import authRoutes from './api/auth.js';
import configRoutes from './api/config.js';
import processRoutes from './api/process.js';
import statusRoutes from './api/status.js';
import logsRoutes from './api/logs.js';
import skillsRoutes from './api/skills.js';
import systemRoutes from './api/system.js';
import providersRoutes from './api/providers.js';
import channelsRoutes from './api/channels.js';
import chatRoutes from './api/chat.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure sessions directory exists
const sessionsDir = path.join(__dirname, '../sessions');
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database (async)
let db;
try {
  db = await initDatabase();
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}

// Middleware
app.use(helmet(securityHeaders));
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false
    : ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'openclaw-dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: new FileStore(session)({
    path: sessionsDir,
    ttl: 86400
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts, please try again later.' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);

// Make db available to routes
app.set('db', db);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/config', authMiddleware, configRoutes);
app.use('/api/process', authMiddleware, processRoutes);
app.use('/api/status', authMiddleware, statusRoutes);
app.use('/api/logs', authMiddleware, logsRoutes);
app.use('/api/skills', authMiddleware, skillsRoutes);
app.use('/api/system', authMiddleware, systemRoutes);
app.use('/api/providers', authMiddleware, providersRoutes);
app.use('/api/channels', authMiddleware, channelsRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`OpenClaw Web running on http://0.0.0.0:${PORT}`);
  console.log(`OpenClaw config path: ${process.env.OPENCLAW_PATH || '~/.openclaw/'}`);
});

export default app;
