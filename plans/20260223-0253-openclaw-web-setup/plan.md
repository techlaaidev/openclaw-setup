# OpenClaw Web Setup Implementation Plan

**Plan ID:** 20260223-0253-openclaw-web-setup
**Date:** 2026-02-23
**Author:** AI Assistant
**Status:** Planning Complete - Ready for Implementation

---

## Executive Summary

A comprehensive plan to build an **OpenClaw Web Interface** cho Armbian devices - phiên bản web của [ClawX](https://github.com/ValueCell-ai/ClawX). Thay vì Electron desktop app, đây là web app có thể truy cập từ LAN.

**Tham khảo:** ClawX desktop app sử dụng:
- OpenClaw core: `openclaw` v2026.2.19
- Gateway port: 18789
- Providers: Anthropic, OpenAI, Google, OpenRouter, Moonshot (Kimi), SiliconFlow, Ollama, Custom

**Key Features:**
- Web-based configuration management (providers, channels, skills)
- Real-time status monitoring và process control
- Secure authentication for LAN access
- Auto-start service integration với systemd
- Kimi AI (Moonshot) model configuration
- Channel management (Telegram, Zalo, WhatsApp)
- Skill management giống như ClawX
- Chat interface (tương tự ClawX nhưng trên web)
- Log viewer và system diagnostics

**Tech Stack:** Node.js + Express backend, React frontend (giống ClawX), PM2 for process management, SQLite for configuration storage.

---

## Problem Analysis

### Current State
- OpenClaw is installed on Armbian and runs via CLI
- No web interface for configuration management
- Manual config file editing required
- No real-time monitoring capability
- No remote management from LAN

### Required Capabilities
1. Web UI accessible via LAN IP
2. Configuration editor for OpenClaw settings
3. Process start/stop/monitoring
4. Real-time status updates
5. Secure authentication
6. Auto-start on boot
7. Model selection (Kimi)
8. Platform integration management

### User Personas
1. **System Administrator**: Needs to monitor OpenClaw status, view logs, manage services
2. **Bot Operator**: Needs to configure skills, channels, and models
3. **Developer**: Needs to test configurations and troubleshoot issues

---

## Solution Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        LAN Network                              │
│  (192.168.1.0/24)                                               │
└─────────────────────┬──────────────────┬────────────────────────┘
                      │                  │
                      │ HTTP/SSE         │ SSH
                      │                  │
┌─────────────────────▼──────────────────▼────────────────────────┐
│                    Armbian Device                               │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              OpenClaw Web Dashboard                       │ │
│  │  (Port 3000)                                              │ │
│  │                                                           │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │   Express    │  │   React      │  │   SQLite     │    │ │
│  │  │   Server     │  │   Frontend   │  │   Config DB  │    │ │
│  │  │              │  │              │  │              │    │ │
│  │  │  - API       │  │  - Dashboard │  │  - Settings  │    │ │
│  │  │  - Auth      │  │  - Forms     │  │  - Sessions  │    │ │
│  │  │  - SSE       │  │  - Logs      │  │  - Cache     │    │ │
│  │  │  - Process   │  │  - Metrics   │  └──────────────┘    │ │
│  │  │    Control   │  └──────────────┘                      │ │
│  │  └──────┬───────┘                                       │ │
│  │         │                                               │ │
│  │         ▼                                               │ │
│  │  ┌──────────────┐                                       │ │
│  │  │ Process      │                                       │ │
│  │  │ Manager      │                                       │ │
│  │  │              │                                       │ │
│  │  │  - child_    │                                       │ │
│  │  │    process   │                                       │ │
│  │  │  - PM2 API   │                                       │ │
│  │  │  - systemd   │                                       │ │
│  │  └──────┬───────┘                                       │ │
│  └─────────┼───────────────────────────────────────────────┘ │
│            │                                                   │
│            ├───► OpenClaw Process (managed via CLI)          │
│            │                                                   │
│            ├───► systemd (auto-start service)                │
│            │                                                   │
│            └───► Telegram/Zalo APIs (external)                │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                Configuration Files                        │ │
│  │                                                           │ │
│  │  - /opt/openclaw/config/openclaw.yaml                    │ │
│  │  - /opt/openclaw/config/.env                             │ │
│  │  - /opt/openclaw/skills/*                                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Architecture

**Express Server Components:**
```
src/
├── server.js                 # Main server entry
├── api/
│   ├── auth.js              # Authentication endpoints
│   ├── config.js            # Config management
│   ├── process.js           # Process control
│   ├── status.js            # Status monitoring
│   ├── logs.js              # Log streaming
│   └── skills.js            # Skills management
├── services/
│   ├── ConfigManager.js     # Config file operations
│   ├── ProcessManager.js    # OpenClaw process control
│   ├── SystemdManager.js    # Systemd integration
│   ├── AuthManager.js       # Session/auth handling
│   └── SSEManager.js        # Server-Sent Events
├── middleware/
│   ├── auth.js              # Auth middleware
│   ├── validation.js        # Input validation
│   └── security.js          # Security headers
└── config/
    ├── database.js          # SQLite connection
    └── constants.js         # App constants
```

### Frontend Architecture

**React Application Structure:**
```
frontend/
├── src/
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   ├── hooks/
│   │   ├── useAuth.js       # Authentication hook
│   │   ├── useSSE.js        # SSE subscription
│   │   └── useConfig.js     # Config management
│   ├── components/
│   │   ├── Layout.jsx       # Main layout
│   │   ├── Sidebar.jsx      # Navigation
│   │   ├── StatusCard.jsx   # Process status
│   │   ├── ConfigForm.jsx   # Configuration editor
│   │   ├── LogViewer.jsx    # Real-time logs
│   │   └── SkillCard.jsx    # Skills management
│   ├── pages/
│   │   ├── Dashboard.jsx    # Main dashboard
│   │   ├── Config.jsx       # Config page
│   │   ├── Skills.jsx       # Skills page
│   │   ├── Logs.jsx         # Logs page
│   │   └── Settings.jsx     # System settings
│   ├── services/
│   │   ├── api.js           # API client
│   │   ├── auth.js          # Auth service
│   │   └── utils.js         # Utilities
│   └── store/
│       └── configStore.js   # Global state
```

### Data Flow

**Configuration Updates:**
```
User Input → React Form → Zod Validation → HTTP POST
    ↓
Express API → ConfigManager → Atomic File Write (tmp → rename)
    ↓
Backup Created → Config Saved → Broadcast Update (SSE)
    ↓
Frontend Receives Update → UI Refresh
```

**Process Control Flow:**
```
User Action → Button Click → HTTP POST /api/process/stop
    ↓
Auth Middleware → Validation → ProcessManager
    ↓
systemctl stop openclaw (via sudo)
    ↓
Status Poll → SSE Broadcast → UI Updates
```

**Real-Time Updates:**
```
Frontend: EventSource('/api/status/stream')
    ↓
Backend: SSE endpoint with 1-2s polling interval
    ↓
systemctl status openclaw + journalctl
    ↓
JSON Response → SSE → All Connected Clients
```

---

## Implementation Phases

### Phase 1: Project Setup & Backend Foundation (2 days)

**Goals:**
- Initialize project structure
- Set up Express server with basic middleware
- Implement SQLite database for user sessions and config caching
- Create foundational services (ConfigManager, AuthManager)
- Set up development environment with hot-reload

**Deliverables:**
- Working Express server on port 3000
- SQLite database schema
- Basic authentication system
- ConfigManager with file operations
- API structure for future endpoints

**Technical Tasks:**
```bash
# Project initialization
npm init -y
npm install express sqlite3 bcrypt jsonwebtoken cors helmet
npm install --save-dev nodemon

# Directory structure
mkdir -p src/{api,services,middleware,config}
touch src/server.js src/config/database.js
```

**Key Code Components:**
- `ConfigManager.js`: File-based config with atomic writes
- `AuthManager.js`: JWT token or session-based auth
- `database.js`: SQLite connection and migrations
- `security.js`: Helmet + rate limiting

**Acceptance Criteria:**
- Server starts without errors
- Can read/write config files atomically
- Authentication endpoints work (login/logout)
- Database migrations run successfully

### Phase 2: Process Management & System Integration (2 days)

**Goals:**
- Implement ProcessManager for controlling OpenClaw
- Create SystemdManager for service operations
- Add real-time status monitoring
- Implement SSE for live updates
- Create process control API endpoints

**Deliverables:**
- API to start/stop/restart OpenClaw
- Real-time status monitoring via SSE
- Systemd service integration
- Process logs retrieval
- Health check endpoint

**Technical Tasks:**
```bash
# Additional dependencies
npm install express-rate-limit
npm install --save-dev dbus-next # For alternative systemd control

# System setup
sudo visudo # Add sudoers for dashboard user
sudo systemctl edit openclaw # Add service override
```

**Key Code Components:**
- `ProcessManager.js`: child_process.spawn() wrapper
- `SystemdManager.js`: systemctl command execution
- `SSEManager.js`: Server-Sent Events implementation
- `/api/process/*`: Express routes for process control
- `/api/status/stream`: SSE endpoint

**Acceptance Criteria:**
- Can start/stop OpenClaw via API
- SSE connection works and sends updates
- Systemd status correctly parsed
- Logs retrieved from journalctl
- Health check validates OpenClaw is running

### Phase 3: React Frontend & Dashboard (3 days)

**Goals:**
- Set up React application with Vite
- Implement authentication flow
- Build main dashboard with status cards
- Create real-time status updates via SSE
- Add navigation and routing

**Deliverables:**
- Login page with auth flow
- Main dashboard with OpenClaw status
- Real-time status indicators
- Navigation sidebar
- Responsive design

**Technical Tasks:**
```bash
# Frontend setup
cd frontend
npm create vite@latest . -- --template react
npm install axios react-router-dom @tanstack/react-query
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/x-data-grid

# Additional libraries
npm install date-fns react-hot-toast
```

**Key Components:**
- `useSSE.js`: React hook for SSE subscription
- `StatusCard.jsx`: Displays process status with indicators
- `Dashboard.jsx`: Main dashboard layout
- `AuthContext.jsx`: Authentication state management
- `Layout.jsx`: App shell with sidebar

**Acceptance Criteria:**
- Frontend builds without errors
- Can login and maintain session
- Dashboard shows OpenClaw status
- Real-time updates appear automatically
- Mobile responsive design

### Phase 4: Configuration Management UI (2 days)

**Goals:**
- Build OpenClaw config editor interface
- Implement YAML/JSON parsing and validation
- Create forms for models, platforms, skills
- Add config validation with error handling
- Implement config backup/restore

**Deliverables:**
- Config editor with syntax highlighting
- Forms for Kimi model settings
- Telegram/Zalo integration setup
- Skills management interface
- Config import/export functionality

**Technical Tasks:**
```bash
# Additional dependencies
npm install js-yaml @monaco-editor/react zod
npm install react-hook-form @hookform/resolvers

# Backend validation
npm install zod
```

**Key Components:**
- `ConfigForm.jsx`: Main config editor component
- `KimiConfig.jsx`: Kimi model configuration form
- `PlatformConfig.jsx`: Telegram/Zalo settings
- `SkillsConfig.jsx`: Skills management interface
- `configValidation.js`: Zod schemas for validation

**Acceptance Criteria:**
- Can view and edit config via UI
- Validation errors show correctly
- Changes save atomically with backup
- Kimi model settings configurable
- Platform integration settings work

### Phase 5: Log Viewer & Advanced Features (2 days)

**Goals:**
- Build real-time log viewer with virtual scrolling
- Add advanced monitoring features
- Implement user management
- Add system settings page
- Create backup/restore interface

**Deliverables:**
- Real-time log streaming UI
- Virtualized log list for performance
- User management (add/remove users)
- System diagnostics page
- Backup/restore interface

**Technical Tasks:**
```bash
# Additional dependencies
npm install @tanstack/react-virtual
npm install react-json-view
```

**Key Components:**
- `LogViewer.jsx`: Real-time log streaming with virtual scroll
- `UserManagement.jsx`: User CRUD operations
- `SystemSettings.jsx`: System-level configuration
- `BackupRestore.jsx`: Backup creation and restoration
- `Diagnostics.jsx`: System health diagnostics

**Acceptance Criteria:**
- Logs stream in real-time without lag
- Can filter and search logs
- User management works with proper auth
- System settings editable
- Backups created and restorable

### Phase 6: Armbian Deployment & Systemd Integration (2 days)

**Goals:**
- Create systemd service for web dashboard
- Implement auto-start on boot
- Configure static IP/mDNS (Avahi)
- Set up firewall rules
- Create installation script

**Deliverables:**
- systemd service file for dashboard
- Auto-start configuration
- Network configuration (static IP/mDNS)
- Security hardening
- One-line installer script

**Technical Tasks:**
```bash
# Systemd service file
sudo nano /etc/systemd/system/openclaw-dashboard.service

# Avahi configuration
sudo nano /etc/avahi/avahi-daemon.conf

# Network setup
nmcli connection modify "Wired connection 1" ipv4.addresses 192.168.1.100/24

# Firewall
sudo ufw allow from 192.168.1.0/24 to any port 3000
```

**Key Components:**
- `openclaw-dashboard.service`: Systemd service file
- `install.sh`: One-line installation script
- `config/openclaw-dashboard.conf`: Default config
- `/etc/avahi/services/openclaw.service`: mDNS advertisement
- Security configuration (UFW, user permissions)

**Acceptance Criteria:**
- Dashboard starts on boot
- Accessible via static IP or mDNS
- Firewall properly configured
- Service runs as non-root user
- Installation script works end-to-end

### Phase 7: Testing, Security & Polish (2 days)

**Goals:**
- Comprehensive testing of all features
- Security audit and hardening
- Performance optimization
- User experience improvements
- Documentation and deployment guide

**Deliverables:**
- Test suite for backend API
- Frontend component tests
- Security audit report
- Performance benchmarks
- User documentation
- Deployment guide

**Technical Tasks:**
```bash
# Testing
npm install --save-dev jest supertest @testing-library/react
npm run test:backend
npm run test:frontend

# Security audit
npm audit
npx helmet-csp --report | npx --yes ssv-scanner

# Performance
npm install --save-dev autocannon
npm run benchmark
```

**Key Components:**
- `*.test.js`: Jest test files for backend
- `*.spec.jsx`: React Testing Library tests
- `SECURITY.md`: Security configuration guide
- `docs/`: User documentation
- `README.md`: Installation and usage guide

**Acceptance Criteria:**
- All tests pass with >80% coverage
- No critical security vulnerabilities
- Performance meets targets (API <100ms)
- Documentation complete and accurate
- Deployment guide tested on fresh Armbian

---

## Technical Details

### Backend API Endpoints

**Authentication:**
```javascript
POST   /api/auth/login          # Login with password
POST   /api/auth/logout         # Logout and clear session
GET    /api/auth/status         # Check auth status
```

**Providers (AI Models):**
```javascript
GET    /api/providers           # List all providers
POST   /api/providers           # Add new provider
GET    /api/providers/:id       # Get provider details
PUT    /api/providers/:id       # Update provider
DELETE /api/providers/:id      # Delete provider
POST   /api/providers/:id/test  # Test provider connection
GET    /api/providers/types     # Get supported provider types
```

**Channels:**
```javascript
GET    /api/channels            # List all channels
POST   /api/channels            # Add new channel
GET    /api/channels/:id        # Get channel details
PUT    /api/channels/:id        # Update channel
DELETE /api/channels/:id       # Delete channel
POST   /api/channels/:id/enable  # Enable channel
POST   /api/channels/:id/disable # Disable channel
GET    /api/channels/types       # Get supported channel types
```

**Chat (Gateway Communication):**
```javascript
GET    /api/chat/channels       # Get available chat channels
GET    /api/chat/messages/:channelId  # Get messages
POST   /api/chat/messages/:channelId  # Send message
GET    /api/chat/stream/:channelId    # SSE for incoming messages
DELETE /api/chat/messages/:channelId/:messageId  # Delete message
```

**Configuration:**
```javascript
GET    /api/config              # Get current config
PUT    /api/config              # Update config
POST   /api/config/validate     # Validate config
POST   /api/config/backup       # Create backup
GET    /api/config/backups      # List backups
POST   /api/config/restore/:id  # Restore from backup
```

**Process Management:**
```javascript
GET    /api/process/status      # Get current status
POST   /api/process/start       # Start OpenClaw
POST   /api/process/stop        # Stop OpenClaw
POST   /api/process/restart     # Restart OpenClaw
GET    /api/process/logs        # Get recent logs
GET    /api/process/metrics     # Get process metrics (CPU, memory)
```

**Real-Time Updates:**
```javascript
GET    /api/status/stream       # SSE stream for updates
GET    /api/logs/stream         # Real-time log streaming
```

**Skills Management:**
```javascript
GET    /api/skills              # List all skills
GET    /api/skills/:name        # Get skill config
PUT    /api/skills/:name        # Update skill
POST   /api/skills/reload       # Reload skills
POST   /api/skills/install      # Install from marketplace
GET    /api/skills/marketplace  # Browse skill marketplace
```

**System:**
```javascript
GET    /api/system/info         # System information
GET    /api/system/health       # Health check
GET    /api/system/network      # Network configuration
GET    /api/system/metrics      # System metrics
```

### Frontend Routes

```javascript
/                     # Dashboard (login if not authenticated)
/login                # Login page
/chat                 # Chat interface (giống ClawX)
/chat/:channelId      # Chat với channel cụ thể
/settings             # Settings overview
/settings/providers   # AI Provider configuration (Kimi, Claude, etc.)
/settings/channels    # Channel management (Telegram, Zalo, WhatsApp)
/settings/skills      # Skills management
/settings/advanced   # Advanced settings (Developer mode)
/logs                 # Log viewer
/users                # User management (admin)
/system               # System diagnostics
```

### Database Schema

**Users Table:**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);
```

**Sessions Table:**
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  ip_address TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Config Versions Table:**
```sql
CREATE TABLE config_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL,
  config_data TEXT NOT NULL,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### Security Measures

**Authentication:**
- Session-based authentication with HTTP-only cookies
- bcrypt password hashing
- Rate limiting on auth endpoints (5 attempts per minute)
- Session timeout after 24 hours
- IP tracking and concurrent session limit

**Authorization:**
- Role-based access control (admin/user)
- Admin can manage users and system settings
- Regular users can manage config and monitor
- API endpoints protected by auth middleware

**Input Validation:**
- Zod schemas for all API inputs
- Sanitization of config values
- File path validation to prevent directory traversal
- Command injection prevention in ProcessManager

**Network Security:**
- Helmet.js for security headers
- CORS enabled for LAN only
- Rate limiting: 100 requests per 15 minutes per IP
- Block common attack patterns

**File Security:**
- Config files: 600 permissions (owner read/write only)
- Upload directory isolation
- Backup files encrypted (optional)
- No sensitive data in logs

### Performance Considerations

**Backend Optimization:**
- Config cached in memory (refreshed on file change)
- Child process pooling for frequent operations
- SQLite connection pooling
- Gzip compression for API responses
- Redis caching layer (optional)

**Frontend Optimization:**
- React.lazy() for route-based code splitting
- Virtual scrolling for log lists
- Debounced API calls (300ms)
- Service worker for offline support
- Image compression and WebP format

**Network Optimization:**
- SSE instead of WebSocket (lighter)
- HTTP/2 server push for critical resources
- Cache-Control headers for static assets
- Brotli compression (if nginx used)

---

## File Structure

```
openclaw-dashboard/
├── src/
│   ├── server.js                      # Main server entry
│   ├── api/
│   │   ├── auth.js                    # Auth endpoints
│   │   ├── config.js                  # Config management
│   │   ├── process.js                 # Process control
│   │   ├── status.js                  # Status monitoring
│   │   ├── logs.js                    # Log retrieval
│   │   ├── skills.js                  # Skills management
│   │   └── system.js                  # System info
│   ├── services/
│   │   ├── ConfigManager.js           # Config operations
│   │   ├── ProcessManager.js          # Process control
│   │   ├── SystemdManager.js          # Systemd integration
│   │   ├── AuthManager.js             # Authentication
│   │   ├── SSEManager.js              # SSE handling
│   │   └── Logger.js                  # Logging service
│   ├── middleware/
│   │   ├── auth.js                    # Auth middleware
│   │   ├── validation.js              # Input validation
│   │   ├── security.js                # Security headers
│   │   └── errors.js                  # Error handling
│   ├── config/
│   │   ├── database.js                # DB connection
│   │   ├── constants.js               # App constants
│   │   └── zod-schemas.js             # Validation schemas
│   ├── models/
│   │   ├── User.js                    # User model
│   │   ├── Session.js                 # Session model
│   │   └── ConfigVersion.js           # Config version model
│   └── utils/
│       ├── crypto.js                  # Crypto utilities
│       ├── validators.js              # Validation helpers
│       └── errors.js                  # Error utilities
├── frontend/
│   ├── public/
│   │   └── icons/                     # App icons
│   ├── src/
│   │   ├── App.jsx                    # Main app
│   │   ├── main.jsx                   # Entry point
│   │   ├── hooks/
│   │   │   ├── useAuth.js             # Auth hook
│   │   │   ├── useSSE.js              # SSE hook
│   │   │   ├── useConfig.js           # Config hook
│   │   │   └── useLogs.js             # Logs hook
│   │   ├── components/
│   │   │   ├── Layout.jsx             # App layout
│   │   │   ├── Sidebar.jsx            # Navigation
│   │   │   ├── StatusCard.jsx         # Status display
│   │   │   ├── ConfigEditor.jsx       # Config editor
│   │   │   ├── LogViewer.jsx          # Log viewer
│   │   │   ├── SkillCard.jsx          # Skill display
│   │   │   ├── PlatformCard.jsx       # Platform display
│   │   │   ├── AuthForm.jsx           # Login form
│   │   │   └── UserMenu.jsx           # User menu
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx          # Main dashboard
│   │   │   ├── Login.jsx              # Login page
│   │   │   ├── Config.jsx             # Config page
│   │   │   ├── Skills.jsx             # Skills page
│   │   │   ├── Platforms.jsx          # Platforms page
│   │   │   ├── Logs.jsx               # Logs page
│   │   │   ├── Users.jsx              # User management
│   │   │   └── System.jsx             # System diagnostics
│   │   ├── services/
│   │   │   ├── api.js                 # API client
│   │   │   ├── auth.js                # Auth service
│   │   │   └── utils.js               # Utilities
│   │   ├── store/
│   │   │   ├── AuthContext.jsx        # Auth context
│   │   │   └── ConfigContext.jsx      # Config context
│   │   ├── styles/
│   │   │   ├── theme.js                 # MUI theme
│   │   │   └── global.css               # Global styles
│   │   └── utils/
│   │       ├── validation.js            # Client validation
│   │       └── constants.js             # Frontend constants
├── config/
│   ├── default.yaml                     # Default config
│   ├── default.env                      # Default env template
│   └── dashboard.yaml                   # Dashboard config
├── scripts/
│   ├── install.sh                       # Installation script
│   ├── setup-service.sh                 # Service setup
│   └── backup.sh                        # Backup script
├── systemd/
│   └── openclaw-dashboard.service       # Systemd service
├── tests/
│   ├── backend/                         # Backend tests
│   └── frontend/                        # Frontend tests
├── docs/
│   ├── deployment.md                    # Deployment guide
│   ├── configuration.md                 # Config guide
│   ├── troubleshooting.md               # Troubleshooting
│   └── api.md                           # API documentation
├── package.json                         # Backend dependencies
├── frontend/package.json                # Frontend dependencies
├── README.md                            # Main documentation
└── LICENSE                              # License file
```

---

## Configuration Management

### OpenClaw Gateway & Providers

Dựa trên cấu trúc của ClawX, OpenClaw sử dụng:

**Gateway Configuration:**
- Gateway port: `18789` (mặc định)
- WebSocket connection cho real-time communication

**Supported Providers:**
```typescript
// Từ ClawX providers.ts
PROVIDER_TYPES = [
  'anthropic',    // Claude
  'openai',       // GPT
  'google',       // Gemini
  'openrouter',   // Multi-Model
  'moonshot',     // Kimi (default)
  'siliconflow',  // Chinese models
  'ollama',       // Local models
  'custom',       // Custom provider
] as const;
```

**Provider Configuration:**
```typescript
interface ProviderConfig {
  id: string;
  name: string;
  type: ProviderType;
  baseUrl?: string;      // Custom endpoint
  model?: string;       // Model ID (e.g., "kimi-k2.5")
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**Moonshot (Kimi) Settings:**
```yaml
# Provider config example
{
  "id": "moonshot-1",
  "name": "Kimi",
  "type": "moonshot",
  "baseUrl": "https://api.moonshot.cn/v1",
  "model": "kimi-k2.5",
  "enabled": true
}
```

### Channels Configuration

**Supported Channels (từ ClawX):**
- Telegram Bot
- Zalo Official Account
- WhatsApp (via Baileys)

**Telegram Config:**
```json
{
  "type": "telegram",
  "enabled": true,
  "bot_token": "${TELEGRAM_BOT_TOKEN}",
  "allowed_users": [],
  "admin_users": ["123456789"]
}
```

**Zalo Config:**
```json
{
  "type": "zalo",
  "enabled": true,
  "app_id": "${ZALO_APP_ID}",
  "app_secret": "${ZALO_APP_SECRET}",
  "oa_id": "${ZALO_OA_ID}",
  "webhook_url": "${ZALO_WEBHOOK_URL}",
  "verify_token": "${ZALO_VERIFY_TOKEN}"
}
```

### Skills Management

Skills được quản lý qua skill marketplace và lưu trong:
- Skills directory: `/opt/openclaw/skills/`
- Config: Enable/disable, cấu hình parameters

### Environment Variables (.env)

```bash
# OpenClaw Gateway
OPENCLAW_GATEWAY_PORT=18789

# Kimi AI (Moonshot)
MOONSHOT_API_KEY=your_kimi_api_key

# Providers
ANTHROPIC_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key
GOOGLE_API_KEY=your_google_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# Channels
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
ZALO_APP_ID=your_zalo_app_id
ZALO_APP_SECRET=your_zalo_app_secret
ZALO_OA_ID=your_zalo_oa_id

# Ollama (local models)
OLLAMA_BASE_URL=http://localhost:11434
```

### Dashboard Configuration

```yaml
# /opt/openclaw-dashboard/config/dashboard.yaml

dashboard:
  server:
    port: 3000
    host: "0.0.0.0"

  openclaw:
    gateway_port: 18789
    config_path: "~/.config/openclaw"
    data_path: "~/.local/share/openclaw"

  security:
    session_timeout: 86400  # 24 hours
    rate_limit_window: 15   # minutes
    max_requests_per_window: 100

  features:
    log_retention_days: 7
    config_backup_count: 5
    max_log_lines: 10000

  openclaw:
    service_name: "openclaw"
    config_path: "/opt/openclaw/config/openclaw.yaml"
    data_path: "/opt/openclaw/data"
    log_path: "/opt/openclaw/logs"
    skills_path: "/opt/openclaw/skills"
```

---

## Security Considerations

### Authentication & Authorization

**Session Management:**
- HTTP-only cookies for session tokens
- 24-hour session timeout
- Regenerate session ID on login
- Limit concurrent sessions per user
- IP-based session binding

**Password Security:**
- bcrypt hashing with salt rounds: 12
- Minimum password length: 8 characters
- Password complexity requirements
- Account lockout after 5 failed attempts
- No password logging or storage in plain text

**Authorization:**
- Role-based access control (RBAC)
- Two roles: admin, user
- Admin: Full access (user management, system settings)
- User: Config management, monitoring
- API endpoints check roles

### Network Security

**Firewall (UFW):**
```bash
# Allow SSH from LAN only
sudo ufw allow from 192.168.1.0/24 to any port 22

# Allow dashboard from LAN
sudo ufw allow from 192.168.1.0/24 to any port 3000

# Deny all other incoming
sudo ufw default deny incoming
```

**HTTPS (Optional but Recommended):**
```bash
# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/openclaw.key \
  -out /etc/ssl/certs/openclaw.crt \
  -subj "/C=US/ST=State/L=City/O=OpenClaw/CN=openclaw.local"
```

**Rate Limiting:**
```javascript
// Express rate limiter
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);

// Stricter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts
  message: 'Too many login attempts'
});

app.use('/api/auth/login', authLimiter);
```

### Input Validation & Sanitization

**Zod Validation Schemas:**
```javascript
const { z } = require('zod');

const configSchema = z.object({
  app: z.object({
    name: z.string().min(1).max(100),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    environment: z.enum(['development', 'staging', 'production']),
    log_level: z.enum(['debug', 'info', 'warn', 'error'])
  }),
  models: z.object({
    default: z.string().min(1),
    kimi: z.object({
      provider: z.literal('moonshot'),
      api_key: z.string().min(10),
      model: z.enum(['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k']),
      temperature: z.number().min(0).max(2),
      max_tokens: z.number().min(1).max(128000)
    })
  })
});

// Usage
function validateConfig(config) {
  try {
    return configSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors);
    }
    throw error;
  }
}
```

**Command Injection Prevention:**
```javascript
// Don't: direct string interpolation
const dangerous = `systemctl start ${userInput}`;
exec(dangerous);

// Do: validate and whitelist
const allowedServices = ['openclaw', 'nginx', 'avahi-daemon'];

function startService(serviceName) {
  if (!allowedServices.includes(serviceName)) {
    throw new Error('Invalid service name');
  }
  return exec(`systemctl start ${serviceName}`);
}

// Even better: use systemd D-Bus API
async function startService(serviceName) {
  validateServiceName(serviceName);
  const manager = await getSystemdManager();
  return manager.StartUnit(`${serviceName}.service`, 'replace');
}
```

### File System Security

**Config File Permissions:**
```bash
# Set ownership
sudo chown openclaw:openclaw /opt/openclaw/config/openclaw.yaml
sudo chown openclaw:openclaw /opt/openclaw/config/.env

# Set permissions (owner read/write only)
sudo chmod 600 /opt/openclaw/config/openclaw.yaml
sudo chmod 600 /opt/openclaw/config/.env

# Directory permissions
sudo chmod 750 /opt/openclaw/config
sudo chmod 750 /opt/openclaw/data
```

**Secure File Operations:**
```javascript
const fs = require('fs').promises;
const path = require('path');

class SecureConfigManager {
  constructor(configDir) {
    this.configDir = configDir;
  }

  validatePath(filePath) {
    const resolved = path.resolve(filePath);
    const configDirResolved = path.resolve(this.configDir);

    if (!resolved.startsWith(configDirResolved)) {
      throw new Error('Path traversal detected');
    }

    return resolved;
  }

  async readConfig(fileName) {
    const filePath = this.validatePath(path.join(this.configDir, fileName));
    return fs.readFile(filePath, 'utf8');
  }

  async writeConfig(fileName, content) {
    const filePath = this.validatePath(path.join(this.configDir, fileName));

    // Atomic write: temp file + rename
    const tempPath = `${filePath}.tmp`;
    await fs.writeFile(tempPath, content, { mode: 0o600 });
    await fs.rename(tempPath, filePath);

    return filePath;
  }
}
```

---

## Testing Strategy

### Backend Testing

**Unit Tests (Jest):**
```javascript
// services/ConfigManager.test.js
des('ConfigManager', () => {
  test('should read config file', async () => {
    const manager = new ConfigManager('/tmp/config');
    await manager.writeConfig('test.yaml', 'key: value');
    const config = await manager.readConfig('test.yaml');
    expect(config).toContain('key: value');
  });

  test('should prevent path traversal', async () => {
    const manager = new ConfigManager('/tmp/config');
    await expect(
      manager.readConfig('../../../etc/passwd')
    ).rejects.toThrow('Path traversal detected');
  });
});
```

**Integration Tests (Supertest):**
```javascript
// api/auth.test.js
describe('Authentication API', () => {
  test('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'password' })
      .expect(200);

    expect(response.body).toHaveProperty('token');
  });

  test('should reject invalid credentials', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrong' })
      .expect(401);
  });
});
```

**Performance Tests (Autocannon):**
```javascript
// benchmarks/api.benchmark.js
const autocannon = require('autocannon');

async function runBenchmark() {
  const result = await autocannon({
    url: 'http://localhost:3000/api/status',
    connections: 10,
    duration: 30
  });

  console.log(`Requests/sec: ${result.requests.mean}`);
  console.log(`Latency (ms): ${result.latency.mean}`);
}
```

### Frontend Testing

**Component Tests (React Testing Library):**
```javascript
// components/StatusCard.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import StatusCard from './StatusCard';

test('displays OpenClaw status', async () => {
  render(<StatusCard />);

  await waitFor(() => {
    expect(screen.getByText(/OpenClaw Status/i)).toBeInTheDocument();
  });

  const statusBadge = screen.getByTestId('status-badge');
  expect(statusBadge).toHaveClass('running');
});
```

**E2E Tests (Playwright):**
```javascript
// e2e/dashboard.spec.js
const { test, expect } = require('@playwright/test');

test('user can login and view dashboard', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Login
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Verify dashboard
  await expect(page).toHaveURL('http://localhost:3000/dashboard');
  await expect(page.locator('text=OpenClaw Status')).toBeVisible();

  // Check status
  const status = page.locator('[data-testid="status"]');
  await expect(status).toContainText(/running|stopped/);
});
```

**Visual Regression Tests (Percy/Storybook):**
```javascript
// visual/status-card.percy.js
import { render } from '@testing-library/react';
import StatusCard from './StatusCard';

describe('StatusCard Visual', () => {
  it('running state', () => {
    const { container } = render(
      <StatusCard status="running" uptime="2h 30m" />
    );
    cy.percySnapshot('StatusCard - Running');
  });

  it('stopped state', () => {
    const { container } = render(
      <StatusCard status="stopped" />
    );
    cy.percySnapshot('StatusCard - Stopped');
  });
});
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Armbian system fully updated
- [ ] Node.js 20+ installed
- [ ] Static IP or mDNS configured
- [ ] Firewall rules set up
- [ ] OpenClaw installed and working via CLI

### Application Deployment

- [ ] Clone repository to /opt/openclaw-dashboard
- [ ] Install dependencies (npm ci --production)
- [ ] Create config directory
- [ ] Set up environment variables
- [ ] Create initial admin user
- [ ] Build frontend (npm run build)

### System Integration

- [ ] Create dedicated user (openclaw-dashboard)
- [ ] Set proper file permissions
- [ ] Install systemd service
- [ ] Enable service auto-start
- [ ] Configure Avahi (mDNS)
- [ ] Create backup directory
- [ ] Set up log rotation

### Security Hardening

- [ ] Run as non-root user
- [ ] Set restrictive file permissions
- [ ] Configure UFW firewall
- [ ] Enable fail2ban for SSH
- [ ] Set up automatic security updates
- [ ] Configure HTTPS (optional but recommended)

### Testing

- [ ] All API endpoints work
- [ ] Frontend loads correctly
- [ ] Authentication functions
- [ ] Process control works
- [ ] Real-time updates received
- [ ] Config changes saved correctly
- [ ] Logs display properly
- [ ] Auto-start on boot works
- [ ] Accessible via LAN IP/mDNS

### Documentation

- [ ] Deployment guide completed
- [ ] User manual written
- [ ] API documentation generated
- [ ] Troubleshooting guide created
- [ ] README updated
- [ ] CHANGELOG created

---

## Rollback Plan

### If Deployment Fails

**Automated Rollback (install.sh):**
```bash
#!/bin/bash
# Backup existing OpenClaw config
sudo cp -r /opt/openclaw /opt/openclaw.pre-dashboard.bak

# Download and run installer
wget https://github.com/yourusername/openclaw-dashboard/raw/main/scripts/install.sh
chmod +x install.sh

# Run with rollback capability
./install.sh --with-rollback

# On failure, automatically restores backup
```

**Manual Rollback Steps:**

1. Stop dashboard service:
```bash
sudo systemctl stop openclaw-dashboard
```

2. Restore OpenClaw config if corrupted:
```bash
sudo cp /opt/openclaw.pre-dashboard.bak/config/openclaw.yaml \
  /opt/openclaw/config/openclaw.yaml
```

3. Verify OpenClaw still works:
```bash
openclaw status
```

4. Uninstall dashboard if needed:
```bash
sudo systemctl disable openclaw-dashboard
sudo rm /etc/systemd/system/openclaw-dashboard.service
sudo rm -rf /opt/openclaw-dashboard
```

**Recovery Points:**
- Pre-installation OpenClaw backup
- Config file backups before each change
- Git repository for code rollback
- System snapshot (if using LVM or similar)

---

## Monitoring & Maintenance

### System Monitoring

**Dashboard Health Checks:**
```bash
# Check dashboard status
curl -f http://localhost:3000/api/system/health

# Check OpenClaw status
sudo systemctl status openclaw

# View logs
sudo journalctl -u openclaw-dashboard -f
sudo journalctl -u openclaw -f
```

**Resource Monitoring:**
```bash
# Monitor memory usage
htop -p $(pgrep -f openclaw)

# Disk space
df -h /opt/openclaw

# Network connections
netstat -tulpn | grep 3000
```

**Performance Metrics:**
```javascript
// Exposed via /api/system/metrics
{
  "timestamp": "2026-02-23T10:30:00Z",
  "uptime": 86400,
  "memory": {
    "used_mb": 256,
    "total_mb": 512,
    "percent": 50
  },
  "cpu": {
    "percent": 25,
    "cores": 4
  },
  "disk": {
    "used_gb": 8.5,
    "total_gb": 16,
    "percent": 53
  },
  "openclaw": {
    "status": "running",
    "uptime": 43200,
    "pid": 1234,
    "memory_mb": 128
  }
}
```

### Maintenance Tasks

**Daily:**
- [ ] Check dashboard accessibility
- [ ] Verify OpenClaw is running
- [ ] Review error logs
- [ ] Check disk space

**Weekly:**
- [ ] Review access logs for suspicious activity
- [ ] Check for system updates
- [ ] Verify backup completion
- [ ] Monitor memory usage trends

**Monthly:**
- [ ] Rotate API keys if needed
- [ ] Clean old logs and backups
- [ ] Performance review and optimization
- [ ] Security audit

**Quarterly:**
- [ ] Full system backup
- [ ] Update dependencies
- [ ] Review and update firewall rules
- [ ] Test disaster recovery procedures

### Alerting

**Setup Notifications:**
```bash
# Email alerts (install ssmtp or postfix)
# Telegram alerts via bot
# Zabbix or Prometheus monitoring (optional)
```

**Alert Conditions:**
- Dashboard service down
- OpenClaw process crashed
- High memory usage (>80%)
- Disk space low (<20%)
- High error rate (>5% of requests)
- Failed authentication attempts (>10 in 5 minutes)

---

## Future Enhancements

### Phase 8: Advanced Features (Post MVP)

**High Priority:**
- [ ] Dark mode UI toggle
- [ ] Multi-language support (Vietnamese, English)
- [ ] Mobile app (React Native)
- [ ] Voice commands integration
- [ ] Advanced analytics dashboard
- [ ] Plugin marketplace integration

**Medium Priority:**
- [ ] OAuth2/OIDC integration
- [ ] 2FA authentication
- [ ] WebSocket alternative for real-time (bi-directional)
- [ ] Config version control (Git integration)
- [ ] A/B testing for skills
- [ ] Advanced monitoring (Prometheus/Grafana)

**Low Priority:**
- [ ] Theme customization
- [ ] Plugin development UI
- [ ] Team collaboration features
- [ ] Public API for external integrations
- [ ] Machine learning model management
- [ ] Multi-instance management

---

## Cost Analysis

### Development Costs

**Time Investment:**
- Total development: ~12-15 days
- Testing & debugging: ~2-3 days
- Documentation: ~1-2 days
- **Total: ~15-20 days**

**Tooling Costs (if using):**
- Domain name: $10-15/year (optional)
- SSL certificate: Free (Let's Encrypt) or $50-200/year
- Monitoring service: Free to $20/month
- Cloud backup: $5-10/month (optional)

### Resource Usage

**Memory:**
- Dashboard: ~100-150 MB
- OpenClaw: ~100-200 MB
- Total: ~200-350 MB

**CPU:**
- Idle: <1%
- Under load: 5-15%
- Peak: 20-30%

**Storage:**
- Code: ~50 MB
- Dependencies: ~200 MB
- Logs: ~10-50 MB/day (configurable)
- Backups: ~500 MB/week (compressed)

### Running Costs

**Self-Hosted on Armbian:**
- Hardware: $0 (existing device)
- Power: ~2-5W = ~$2-5/year
- Network: $0 (existing LAN)
- **Total: ~$2-5/year**

**Comparison:**
- Cloud VPS: $5-20/month = $60-240/year
- Managed service: $50-200/month = $600-2400/year
- **Savings: $55-2395/year**

---

## Success Metrics

### Technical Metrics

**Performance:**
- API response time: <100ms (p95)
- Dashboard load time: <2 seconds
- SSE latency: <1 second
- Log viewer: handles 10,000+ lines smoothly

**Reliability:**
- Uptime: >99.5%
- Successful config saves: >99%
- Process control success: >95%
- Zero data loss

**Security:**
- Zero critical vulnerabilities
- No unauthorized access attempts succeed
- All auth attempts logged
- Regular security updates applied

### User Experience Metrics

**Usability:**
- Task completion rate: >90%
- Time to configure: <5 minutes
- User satisfaction: >4/5
- Support tickets: <2 per month

**Feature Usage:**
- Daily active users: Track usage
- Most used features: Dashboard, logs, config
- Least used features: Consider removal
- Feature requests: Track and prioritize

### Business Impact

**Efficiency:**
- Time saved: 80% reduction in management time
- Error reduction: 90% fewer config errors
- Downtime reduction: 50% faster issue resolution

**Adoption:**
- User onboarding time: <10 minutes
- Self-service rate: >90%
- Reduction in manual support: >70%

---

## Risk Mitigation

### Technical Risks

**Risk: Breaking OpenClaw config**
- **Mitigation:** Atomic writes, backups before changes, validation
- **Contingency:** Auto-restore previous config if OpenClaw fails to start

**Risk: High resource usage on ARM device**
- **Mitigation:** Memory limits, efficient code, monitoring
- **Contingency:** Restart service if memory exceeds threshold

**Risk: Security vulnerabilities**
- **Mitigation:** Regular audits, dependency updates, minimal permissions
- **Contingency:** Quick patch deployment, firewall blocking

### Operational Risks

**Risk: Dashboard becomes unavailable**
- **Mitigation:** Auto-restart service, monitoring alerts
- **Contingency:** Direct CLI access to manage OpenClaw

**Risk: Data corruption**
- **Mitigation:** Atomic writes, transaction logs, regular backups
- **Contingency:** Restore from last good backup

**Risk: User lockout**
- **Mitigation:** Emergency admin account, session management
- **Contingency:** CLI tool to reset admin password

---

## Conclusion

This plan provides a comprehensive roadmap for building a production-ready OpenClaw web management interface. The solution is designed specifically for Armbian devices with considerations for limited resources, security, and ease of use.

**Key Benefits:**
- Complete OpenClaw management via web UI
- Real-time monitoring and control
- Secure LAN access with authentication
- Kimi AI model configuration and management
- Telegram/Zalo integration setup
- Auto-start and systemd integration
- Comprehensive logging and diagnostics

**Next Steps:**
1. Review and approve plan
2. Set up development environment
3. Begin Phase 1: Backend foundation
4. Iterate and test continuously
5. Deploy to production Armbian device

---

## Appendix

### A. OpenClaw CLI Commands Reference

```bash
# Service management
openclaw start [--config FILE] [--daemon]
openclaw stop
openclaw restart
openclaw status

# Configuration
openclaw config validate
openclaw config show
openclaw config set KEY VALUE

# Skills
openclaw skills list
openclaw skills enable <name>
openclaw skills disable <name>

# Logs
openclaw logs [--follow] [--lines N]

# Testing
openclaw test message "Hello"
```

### B. Systemd Commands Reference

```bash
# Service management
sudo systemctl start openclaw
sudo systemctl stop openclaw
sudo systemctl restart openclaw
sudo systemctl status openclaw
sudo systemctl enable openclaw  # Auto-start on boot
sudo systemctl disable openclaw # Disable auto-start

# Logs
sudo journalctl -u openclaw -f          # Follow logs
sudo journalctl -u openclaw -n 100      # Last 100 lines
sudo journalctl -u openclaw --since today

# Service configuration
sudo systemctl edit openclaw            # Edit override
sudo systemctl daemon-reload            # Reload configs
```

### C. Armbian Network Configuration

**Static IP (NetworkManager):**
```bash
nmcli connection modify "Wired connection 1" \
  ipv4.addresses 192.168.1.100/24 \
  ipv4.gateway 192.168.1.1 \
  ipv4.dns "8.8.8.8 8.8.4.4" \
  ipv4.method manual
nmcli connection up "Wired connection 1"
```

**Static IP (interfaces):**
```bash
# /etc/network/interfaces
auto eth0
iface eth0 inet static
    address 192.168.1.100
    netmask 255.255.255.0
    gateway 192.168.1.1
    dns-nameservers 8.8.8.8 8.8.4.4
```

### D. Useful Commands for Development

```bash
# Development
npm run dev          # Start dev server with hot-reload
npm run dev:frontend # Start frontend dev server only
npm run dev:backend  # Start backend dev server only

# Testing
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report

# Production
npm start            # Start production server
npm run build        # Build frontend
npm run build:frontend # Build only frontend

# Linting
npm run lint         # ESLint
npm run lint:fix     # Fix linting issues

# Database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:backup    # Backup database
```

### E. Troubleshooting Commands

```bash
# Check if dashboard is running
curl http://localhost:3000/api/system/health

# Check OpenClaw process
ps aux | grep openclaw
sudo systemctl status openclaw

# Check ports
sudo netstat -tulpn | grep 3000
sudo netstat -tulpn | grep 8080

# Check logs
sudo journalctl -u openclaw-dashboard -f
sudo journalctl -u openclaw -f
tail -f /opt/openclaw/logs/*.log

# Check disk space
df -h
du -sh /opt/openclaw/*

# Check memory
free -h
top
htop

# Network diagnostics
ping openclaw.local
avahi-browse -a
nmcli device status
```

---

**End of Plan**
