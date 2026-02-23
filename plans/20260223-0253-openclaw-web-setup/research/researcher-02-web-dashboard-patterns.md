# Web Dashboard Patterns for CLI Application Management

**Research Date:** 2026-02-23
**Focus:** Technical approaches for building a web-based management dashboard for CLI applications

---

## 1. Node.js Backend Patterns for Process Management

### Child Process Management

**Core Approaches:**
- **`child_process.spawn()`**: Best for long-running processes with streaming I/O
  - Non-blocking, event-driven architecture
  - Supports real-time stdout/stderr streaming
  - Proper signal handling (SIGTERM, SIGKILL)

- **`child_process.exec()`**: Suitable for short-lived commands with buffered output
  - Simpler API but limited buffer size (200KB default)
  - Good for status checks and quick operations

**Production Patterns:**
```javascript
// Robust process spawning with error handling
const { spawn } = require('child_process');

class ProcessManager {
  constructor() {
    this.processes = new Map();
  }

  start(id, command, args, options = {}) {
    const proc = spawn(command, args, {
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options
    });

    proc.stdout.on('data', (data) => this.handleOutput(id, data));
    proc.stderr.on('data', (data) => this.handleError(id, data));
    proc.on('exit', (code) => this.handleExit(id, code));

    this.processes.set(id, { proc, status: 'running' });
    return proc.pid;
  }

  stop(id, signal = 'SIGTERM') {
    const process = this.processes.get(id);
    if (process?.proc) {
      process.proc.kill(signal);
    }
  }
}
```

**Key Considerations:**
- Always handle process cleanup on server shutdown
- Implement timeout mechanisms for hung processes
- Use process groups for managing child processes
- Monitor memory and CPU usage via `process.memoryUsage()` and external tools

### PM2 Programmatic Integration

**PM2 API Patterns:**
```javascript
const pm2 = require('pm2');

// Connect to PM2 daemon
pm2.connect((err) => {
  if (err) throw err;

  // Start application
  pm2.start({
    script: './app.js',
    name: 'my-app',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }, (err, apps) => {
    pm2.disconnect();
  });
});

// List processes
pm2.list((err, list) => {
  console.log(list);
});

// Monitor events
pm2.launchBus((err, bus) => {
  bus.on('process:msg', (packet) => {
    console.log(packet);
  });
});
```

**Advantages:**
- Built-in process monitoring and auto-restart
- Log management and rotation
- Cluster mode support
- Zero-downtime reloads
- Process metrics collection

**Integration Strategy:**
- Use PM2 for managing the dashboard server itself
- Use programmatic API to control target CLI applications
- Leverage PM2's ecosystem.config.js for declarative configuration
- Access real-time metrics via PM2's event bus

---

## 2. React Dashboard UI Patterns

### Real-Time Status Monitoring

**Component Architecture:**
```javascript
// Status Dashboard Component
import { useState, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';

function ProcessDashboard() {
  const [processes, setProcesses] = useState([]);
  const { lastMessage, sendMessage } = useWebSocket('ws://localhost:3001');

  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data);
      setProcesses(prev => updateProcessState(prev, data));
    }
  }, [lastMessage]);

  return (
    <div className="dashboard">
      {processes.map(proc => (
        <ProcessCard
          key={proc.id}
          process={proc}
          onStart={() => sendMessage({ action: 'start', id: proc.id })}
          onStop={() => sendMessage({ action: 'stop', id: proc.id })}
        />
      ))}
    </div>
  );
}
```

**UI Component Patterns:**
- **Status Indicators**: Color-coded badges (green=running, red=stopped, yellow=starting)
- **Real-time Metrics**: CPU, memory, uptime displayed with auto-refresh
- **Action Buttons**: Start, stop, restart with loading states
- **Log Viewer**: Virtual scrolling for performance with large logs

**Recommended Libraries:**
- **Tanstack Query (React Query)**: Server state management and caching
- **Zustand**: Lightweight client state management
- **Recharts**: Real-time charts for metrics visualization
- **React Virtual**: Efficient rendering of large log lists
- **Tailwind CSS**: Rapid UI development with utility classes

### Configuration Forms

**Form Validation Pattern:**
```javascript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const configSchema = z.object({
  port: z.number().min(1024).max(65535),
  host: z.string().ip(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']),
  maxRetries: z.number().min(0).max(10)
});

function ConfigForm({ onSubmit }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(configSchema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('port', { valueAsNumber: true })} />
      {errors.port && <span>{errors.port.message}</span>}
      {/* Additional fields */}
    </form>
  );
}
```

**Best Practices:**
- Use schema validation (Zod, Yup) for type safety
- Implement optimistic updates for better UX
- Show validation errors inline
- Debounce auto-save functionality
- Provide visual feedback for save states

### Log Viewer Component

**Efficient Log Streaming:**
```javascript
import { useVirtualizer } from '@tanstack/react-virtual';

function LogViewer({ logs }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24,
    overscan: 5
  });

  return (
    <div ref={parentRef} className="log-container">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(item => (
          <div key={item.key} className="log-line">
            {logs[item.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 3. Authentication Strategies for LAN-Only Web Apps

### Security Considerations for LAN Environments

**Threat Model:**
- Assume network is semi-trusted (other devices on LAN)
- Protect against unauthorized access from other LAN users
- Prevent CSRF attacks from external sites
- Secure against XSS vulnerabilities

### Recommended Authentication Approaches

**1. Simple Token-Based Auth (Lightweight)**
```javascript
// Generate secure token on first run
const crypto = require('crypto');
const token = crypto.randomBytes(32).toString('hex');

// Store in config file
fs.writeFileSync('config.json', JSON.stringify({ authToken: token }));

// Middleware
function authenticate(req, res, next) {
  const providedToken = req.headers['authorization']?.split(' ')[1];
  if (providedToken === config.authToken) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
```

**2. Session-Based Auth with HTTP-Only Cookies**
```javascript
const session = require('express-session');
const FileStore = require('session-file-store')(session);

app.use(session({
  store: new FileStore({ path: './sessions' }),
  secret: crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // Set to true if using HTTPS
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Login endpoint
app.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === config.adminPassword) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});
```

**3. IP Whitelist (Additional Layer)**
```javascript
function ipWhitelist(req, res, next) {
  const allowedIPs = ['127.0.0.1', '192.168.1.0/24'];
  const clientIP = req.ip || req.connection.remoteAddress;

  if (isIPAllowed(clientIP, allowedIPs)) {
    next();
  } else {
    res.status(403).json({ error: 'IP not allowed' });
  }
}
```

### Best Practices

- **Use HTTPS even on LAN**: Self-signed certificates acceptable for LAN
- **Implement rate limiting**: Prevent brute force attacks
- **CSRF protection**: Use tokens for state-changing operations
- **Content Security Policy**: Prevent XSS attacks
- **Secure password storage**: Use bcrypt or argon2 for hashing
- **Session timeout**: Auto-logout after inactivity
- **Audit logging**: Track authentication attempts

**Recommended Libraries:**
- `express-session`: Session management
- `helmet`: Security headers
- `express-rate-limit`: Rate limiting
- `bcrypt`: Password hashing
- `csurf`: CSRF protection

---

## 4. WebSocket vs Server-Sent Events for Real-Time Updates

### Comparison Matrix

| Feature | WebSocket | Server-Sent Events (SSE) |
|---------|-----------|--------------------------|
| **Direction** | Bi-directional | Server-to-client only |
| **Protocol** | Custom over TCP | HTTP/2 or HTTP/1.1 |
| **Browser Support** | Universal | Universal (IE needs polyfill) |
| **Reconnection** | Manual implementation | Automatic |
| **Message Format** | Binary or text | Text only (UTF-8) |
| **Complexity** | Higher | Lower |
| **Firewall/Proxy** | May be blocked | Better compatibility |

### WebSocket Implementation

**Server (ws library):**
```javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3001 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send initial state
  ws.send(JSON.stringify({ type: 'init', data: getProcessState() }));

  // Handle incoming messages
  ws.on('message', (message) => {
    const { action, id } = JSON.parse(message);
    handleAction(action, id);
  });

  // Broadcast updates
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'update', data: getProcessState() }));
    }
  }, 1000);

  ws.on('close', () => {
    clearInterval(interval);
  });
});
```

**Client (React):**
```javascript
function useWebSocket(url) {
  const [ws, setWs] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    const socket = new WebSocket(url);

    socket.onopen = () => console.log('Connected');
    socket.onmessage = (event) => setLastMessage(event);
    socket.onerror = (error) => console.error(error);
    socket.onclose = () => {
      // Reconnect logic
      setTimeout(() => setWs(new WebSocket(url)), 3000);
    };

    setWs(socket);
    return () => socket.close();
  }, [url]);

  const sendMessage = (data) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  };

  return { lastMessage, sendMessage };
}
```

### Server-Sent Events Implementation

**Server (Express):**
```javascript
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial data
  res.write(`data: ${JSON.stringify(getProcessState())}\n\n`);

  // Send updates
  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify(getProcessState())}\n\n`);
  }, 1000);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});
```

**Client (React):**
```javascript
function useSSE(url) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      setData(JSON.parse(event.data));
    };

    eventSource.onerror = () => {
      eventSource.close();
      // Reconnects automatically
    };

    return () => eventSource.close();
  }, [url]);

  return data;
}
```

### Recommendation for CLI Dashboard

**Use Server-Sent Events (SSE) when:**
- Only need server-to-client updates (status, logs, metrics)
- Want simpler implementation
- Need better firewall/proxy compatibility
- Automatic reconnection is important

**Use WebSocket when:**
- Need bi-directional communication (client commands to server)
- Require binary data transfer
- Need lower latency for high-frequency updates
- Want more control over connection lifecycle

**Hybrid Approach (Recommended):**
- SSE for status updates and log streaming
- HTTP POST/PUT for commands (start, stop, config changes)
- Simpler architecture, easier to debug, better compatibility

---

## 5. Systemd Service Integration from Node.js

### Controlling Systemd Services

**Using systemctl via child_process:**
```javascript
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class SystemdManager {
  async getServiceStatus(serviceName) {
    try {
      const { stdout } = await execPromise(`systemctl status ${serviceName}`);
      return this.parseStatus(stdout);
    } catch (error) {
      // Service not running or doesn't exist
      return { active: false, error: error.message };
    }
  }

  async startService(serviceName) {
    await execPromise(`sudo systemctl start ${serviceName}`);
  }

  async stopService(serviceName) {
    await execPromise(`sudo systemctl stop ${serviceName}`);
  }

  async restartService(serviceName) {
    await execPromise(`sudo systemctl restart ${serviceName}`);
  }

  async enableService(serviceName) {
    await execPromise(`sudo systemctl enable ${serviceName}`);
  }

  async getLogs(serviceName, lines = 100) {
    const { stdout } = await execPromise(
      `journalctl -u ${serviceName} -n ${lines} --no-pager`
    );
    return stdout;
  }

  parseStatus(output) {
    const active = /Active: active/.test(output);
    const pid = output.match(/Main PID: (\d+)/)?.[1];
    const memory = output.match(/Memory: ([\d.]+\w+)/)?.[1];

    return { active, pid, memory };
  }
}
```

### Sudo Permissions Setup

**Create sudoers file for specific commands:**
```bash
# /etc/sudoers.d/dashboard-app
dashboard-user ALL=(ALL) NOPASSWD: /bin/systemctl start *
dashboard-user ALL=(ALL) NOPASSWD: /bin/systemctl stop *
dashboard-user ALL=(ALL) NOPASSWD: /bin/systemctl restart *
dashboard-user ALL=(ALL) NOPASSWD: /bin/systemctl status *
dashboard-user ALL=(ALL) NOPASSWD: /bin/journalctl *
```

### D-Bus Integration (Alternative)

**Direct D-Bus communication (no sudo required):**
```javascript
const dbus = require('dbus-next');

async function getSystemdManager() {
  const bus = dbus.systemBus();
  const obj = await bus.getProxyObject(
    'org.freedesktop.systemd1',
    '/org/freedesktop/systemd1'
  );
  return obj.getInterface('org.freedesktop.systemd1.Manager');
}

async function startService(serviceName) {
  const manager = await getSystemdManager();
  await manager.StartUnit(`${serviceName}.service`, 'replace');
}
```

**Advantages:**
- No sudo required (with proper PolicyKit configuration)
- More efficient than spawning processes
- Better error handling
- Access to systemd events

### Best Practices

- **Validate service names**: Prevent command injection
- **Use absolute paths**: For systemctl and journalctl
- **Implement timeouts**: Prevent hanging operations
- **Cache status**: Don't query systemd too frequently
- **Handle permissions**: Graceful degradation if sudo not available
- **Monitor systemd events**: Use D-Bus signals for real-time updates

---

## 6. File-Based Config Management

### Safe Read/Write Patterns

**Atomic Write with Backup:**
```javascript
const fs = require('fs').promises;
const path = require('path');

class ConfigManager {
  constructor(configPath) {
    this.configPath = configPath;
    this.backupPath = `${configPath}.backup`;
  }

  async read() {
    try {
      const data = await fs.readFile(this.configPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return this.getDefaults();
      }
      throw error;
    }
  }

  async write(config) {
    // Validate before writing
    this.validate(config);

    // Create backup of existing config
    try {
      await fs.copyFile(this.configPath, this.backupPath);
    } catch (error) {
      // Ignore if file doesn't exist
    }

    // Write to temporary file first
    const tempPath = `${this.configPath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(config, null, 2), 'utf8');

    // Atomic rename
    await fs.rename(tempPath, this.configPath);
  }

  async update(updates) {
    const current = await this.read();
    const merged = { ...current, ...updates };
    await this.write(merged);
    return merged;
  }

  validate(config) {
    // Use Zod or Joi for validation
    const schema = z.object({
      port: z.number().min(1024).max(65535),
      host: z.string(),
      processes: z.array(z.object({
        id: z.string(),
        command: z.string(),
        args: z.array(z.string())
      }))
    });

    return schema.parse(config);
  }

  getDefaults() {
    return {
      port: 3000,
      host: '0.0.0.0',
      processes: []
    };
  }
}
```

### Validation Patterns

**Schema-Based Validation (Zod):**
```javascript
const { z } = require('zod');

const processSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  command: z.string().min(1),
  args: z.array(z.string()).default([]),
  cwd: z.string().optional(),
  env: z.record(z.string()).optional(),
  autoRestart: z.boolean().default(true),
  maxRestarts: z.number().min(0).default(5)
});

const configSchema = z.object({
  version: z.string().default('1.0.0'),
  server: z.object({
    port: z.number().min(1024).max(65535),
    host: z.string().ip().or(z.literal('localhost')),
    authToken: z.string().min(32)
  }),
  processes: z.array(processSchema),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']),
    maxFiles: z.number().min(1).default(10),
    maxSize: z.string().default('10M')
  })
});

// Usage
function validateConfig(data) {
  try {
    return configSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
    }
    throw error;
  }
}
```

### File Watching for Hot Reload

**Watch for external config changes:**
```javascript
const chokidar = require('chokidar');

class ConfigWatcher {
  constructor(configPath, onChange) {
    this.configPath = configPath;
    this.onChange = onChange;
    this.watcher = null;
  }

  start() {
    this.watcher = chokidar.watch(this.configPath, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100
      }
    });

    this.watcher.on('change', async () => {
      try {
        const config = await this.readConfig();
        this.onChange(config);
      } catch (error) {
        console.error('Error reloading config:', error);
      }
    });
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
    }
  }
}
```

### Best Practices

**Security:**
- Set proper file permissions (0600 for sensitive configs)
- Never store passwords in plain text (use environment variables or secrets manager)
- Validate all input before writing
- Sanitize file paths to prevent directory traversal

**Reliability:**
- Always use atomic writes (write to temp, then rename)
- Create backups before modifying
- Implement file locking for concurrent access
- Handle partial writes and corruption gracefully

**Performance:**
- Cache config in memory, reload only on change
- Debounce file watch events
- Use streaming for large config files
- Implement lazy loading for optional sections

**Recommended Libraries:**
- `zod`: Schema validation with TypeScript support
- `chokidar`: Cross-platform file watching
- `proper-lockfile`: File locking for concurrent access
- `conf`: Electron-style config management (if needed)

---

## Production-Ready Architecture Recommendation

### Lightweight Stack

**Backend:**
- **Express.js**: Minimal, flexible web framework
- **ws**: Lightweight WebSocket library (or use SSE with native Node.js)
- **Zod**: Runtime validation
- **Helmet**: Security headers
- **express-rate-limit**: Rate limiting

**Frontend:**
- **React**: Component-based UI
- **Tanstack Query**: Server state management
- **Zustand**: Client state management
- **Tailwind CSS**: Utility-first styling
- **Vite**: Fast build tool

**Process Management:**
- **PM2**: For production deployment and monitoring
- **child_process**: For direct CLI control

### Security Checklist for LAN Deployment

- [ ] Implement authentication (token or session-based)
- [ ] Use HTTPS with self-signed certificate
- [ ] Enable CSRF protection
- [ ] Set security headers (Helmet)
- [ ] Implement rate limiting
- [ ] Validate all inputs (Zod schemas)
- [ ] Set proper file permissions (config files)
- [ ] Use HTTP-only cookies for sessions
- [ ] Implement IP whitelist (optional)
- [ ] Add audit logging for sensitive operations
- [ ] Sanitize log output (remove sensitive data)
- [ ] Set Content Security Policy

### Real-Time Monitoring Architecture

```
┌─────────────────┐
│  React Frontend │
│  (Browser)      │
└────────┬────────┘
         │ SSE (status updates)
         │ HTTP (commands)
         ▼
┌─────────────────┐
│  Express Server │
│  + SSE endpoint │
└────────┬────────┘
         │
         ├─► ConfigManager (JSON files)
         │
         ├─► ProcessManager (child_process)
         │
         └─► SystemdManager (systemctl)
```

**Update Flow:**
1. Frontend subscribes to SSE endpoint
2. Backend polls process status every 1-2 seconds
3. On change, broadcast to all connected clients
4. Frontend updates UI reactively
5. User actions sent via HTTP POST/PUT
6. Backend validates, executes, broadcasts result

### Config Validation Flow

```
User Input → Zod Schema → Validation
                              │
                    ┌─────────┴─────────┐
                    │                   │
                 Success              Failure
                    │                   │
                    ▼                   ▼
            Atomic Write         Return Errors
                    │
                    ▼
            Backup Created
                    │
                    ▼
            Temp File Written
                    │
                    ▼
            Atomic Rename
                    │
                    ▼
            Broadcast Update
```

---

## Additional Resources

### Essential NPM Packages

**Backend:**
- `express` - Web framework
- `ws` - WebSocket server
- `helmet` - Security middleware
- `express-rate-limit` - Rate limiting
- `express-session` - Session management
- `bcrypt` - Password hashing
- `zod` - Schema validation
- `chokidar` - File watching
- `pm2` - Process management
- `dbus-next` - D-Bus integration (Linux)

**Frontend:**
- `react` - UI library
- `@tanstack/react-query` - Server state
- `zustand` - Client state
- `react-hook-form` - Form handling
- `@hookform/resolvers` - Form validation
- `tailwindcss` - Styling
- `recharts` - Charts
- `@tanstack/react-virtual` - Virtual scrolling

### Performance Optimization Tips

1. **Debounce status updates**: Don't poll faster than UI can render (1-2s interval)
2. **Use virtual scrolling**: For log viewers with 1000+ lines
3. **Implement pagination**: For process lists and historical data
4. **Cache config in memory**: Reload only on file change
5. **Use compression**: Enable gzip for HTTP responses
6. **Optimize bundle size**: Code splitting, tree shaking
7. **Lazy load routes**: React.lazy() for dashboard sections

### Testing Strategies

- **Unit tests**: Config validation, process management logic
- **Integration tests**: API endpoints, WebSocket connections
- **E2E tests**: Critical user flows (start/stop processes)
- **Load tests**: Multiple concurrent connections
- **Security tests**: Authentication bypass attempts, injection attacks

---

## Conclusion

For a production-ready, lightweight CLI management dashboard:

1. **Use Express + SSE** for real-time updates (simpler than WebSocket)
2. **Implement token-based auth** with session cookies for LAN security
3. **Use PM2 programmatic API** for robust process management
4. **Build React UI** with Tanstack Query for server state
5. **Integrate systemd** via child_process with proper sudo configuration
6. **Manage config with Zod validation** and atomic file writes

This architecture provides a secure, performant, and maintainable solution for managing CLI applications via a web interface in LAN environments.
