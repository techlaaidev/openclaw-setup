# OpenClaw Web Dashboard

Web-based management interface for OpenClaw AI Assistant on Armbian devices.

## Features

- 🎛️ **Process Management** - Start/stop/restart OpenClaw with systemd integration
- ⚙️ **Configuration** - Manage providers (Kimi, Claude, GPT), channels (Telegram, Zalo, WhatsApp), and skills
- 📊 **Real-time Monitoring** - Live status updates, CPU/memory metrics, logs streaming
- 💬 **Chat Interface** - Interact with OpenClaw via web interface
- 🔐 **Secure Authentication** - Session-based auth with role-based access control
- 🌐 **mDNS Support** - Access via `openclaw.local` on your LAN
- 🚀 **Auto-start** - Systemd service with automatic restart on failure

## Quick Start

### Prerequisites

- Armbian or Debian-based Linux
- Node.js 20+
- Root/sudo access
- 512MB+ RAM

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/openclaw-web.git
cd openclaw-web

# Run installer (builds frontend automatically)
sudo ./scripts/install-simple.sh
```

Access dashboard at:
- http://localhost:3000
- http://[YOUR_IP]:3000
- http://openclaw.local:3000

**Default credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **Change password immediately after first login!**

### Troubleshooting Installation

If you see "frontend/dist/index.html not found" error:

```bash
# Quick fix
sudo /opt/openclaw-web/scripts/update-frontend.sh
```

See [docs/QUICK-FIX-FRONTEND.md](docs/QUICK-FIX-FRONTEND.md) for details.

## Development

### Setup

```bash
# Install dependencies
npm run install:all

# Start backend (port 3000)
npm run dev

# Start frontend (port 5173)
npm run dev:frontend
```

### Build

```bash
# Build frontend for production
npm run build:frontend
```

## Architecture

```
openclaw-web/
├── src/
│   ├── server.js              # Express server
│   ├── api/                   # API routes
│   │   ├── auth.js           # Authentication
│   │   ├── process.js        # Process control
│   │   ├── config.js         # Configuration
│   │   ├── providers.js      # AI providers
│   │   ├── channels.js       # Communication channels
│   │   ├── skills.js         # Skills management
│   │   ├── chat.js           # Chat interface
│   │   └── logs.js           # Log streaming
│   ├── services/
│   │   ├── ProcessManager.js # Process control
│   │   ├── ConfigManager.js  # Config management
│   │   └── GatewayClient.js  # WebSocket client
│   ├── middleware/           # Express middleware
│   └── config/               # App configuration
├── frontend/                  # React frontend
├── systemd/                   # Systemd service files
├── scripts/                   # Installation scripts
└── docs/                      # Documentation
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/status` - Check auth status

### Process Management
- `GET /api/process/status` - Get process status
- `POST /api/process/start` - Start OpenClaw
- `POST /api/process/stop` - Stop OpenClaw
- `POST /api/process/restart` - Restart OpenClaw
- `GET /api/process/systemd/status` - Get systemd status
- `POST /api/process/systemd/enable` - Enable auto-start
- `POST /api/process/systemd/disable` - Disable auto-start

### Configuration
- `GET /api/config` - Get configuration
- `PUT /api/config` - Update configuration
- `POST /api/config/validate` - Validate config
- `POST /api/config/backup` - Create backup
- `GET /api/config/backups` - List backups
- `POST /api/config/restore/:id` - Restore backup

### Providers
- `GET /api/providers` - List providers
- `POST /api/providers` - Add provider
- `PUT /api/providers/:id` - Update provider
- `DELETE /api/providers/:id` - Delete provider

### Channels
- `GET /api/channels` - List channels
- `POST /api/channels` - Add channel
- `PUT /api/channels/:id` - Update channel
- `DELETE /api/channels/:id` - Delete channel

### Real-time Updates
- `GET /api/status/stream` - SSE status updates
- `GET /api/logs/stream` - SSE log streaming
- `GET /api/chat/stream/:channelId` - SSE chat messages

## Configuration

### Environment Variables

Create `.env` file:

```bash
PORT=3000
NODE_ENV=production
OPENCLAW_PATH=/home/openclaw/.openclaw
OPENCLAW_GATEWAY_PORT=18789
```

### Systemd Service

Service file: `/etc/systemd/system/openclaw-dashboard.service`

```bash
# Manage service
sudo systemctl status openclaw-dashboard
sudo systemctl restart openclaw-dashboard
sudo systemctl enable openclaw-dashboard
```

## Security

### Authentication
- Session-based with HTTP-only cookies
- bcrypt password hashing (12 rounds)
- Rate limiting (100 req/15min)
- Role-based access control

### Network
- Firewall configured for LAN access only
- HTTPS recommended (use reverse proxy)
- Security headers via Helmet.js

### File Permissions
```bash
chmod 600 /opt/openclaw-web/data/*.db
chmod 700 /opt/openclaw-web/sessions
chown -R openclaw:openclaw /opt/openclaw-web
```

## Troubleshooting

### Service won't start
```bash
sudo journalctl -u openclaw-dashboard -n 50
sudo systemctl status openclaw-dashboard
```

### Port already in use
```bash
sudo lsof -i :3000
sudo kill -9 $(lsof -ti:3000)
```

### Can't access dashboard
```bash
# Check firewall
sudo ufw status
sudo ufw allow from 192.168.0.0/16 to any port 3000

# Check service
curl http://localhost:3000/api/system/health
```

### mDNS not working
```bash
sudo systemctl restart avahi-daemon
avahi-browse -a
```

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed troubleshooting.

## Documentation

- [Deployment Guide](docs/DEPLOYMENT.md) - Installation and configuration
- [Quick Fix: Frontend Build](docs/QUICK-FIX-FRONTEND.md) - Fix frontend build issues
- [ClawX Comparison](docs/CLAWX-COMPARISON.md) - Feature comparison with ClawX
- [Roadmap to Parity](docs/ROADMAP-TO-CLAWX-PARITY.md) - 6-week roadmap to ClawX features
- [Scripts README](scripts/README.md) - Installation scripts guide

## Tech Stack

**Backend:**
- Node.js + Express
- SQLite3 (database)
- WebSocket (gateway communication)
- Zod (validation)

**Frontend:**
- React + Vite
- Tailwind CSS
- Zustand (state management)

**Deployment:**
- Systemd (service management)
- Avahi (mDNS)
- UFW (firewall)

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## License

MIT License - see [LICENSE](LICENSE) file

## Related Projects

- [OpenClaw](https://github.com/ValueCell-ai/openclaw) - AI assistant framework
- [ClawX](https://github.com/ValueCell-ai/ClawX) - Desktop application

## Support

- Issues: https://github.com/yourusername/openclaw-web/issues
- Discussions: https://github.com/yourusername/openclaw-web/discussions

---

**Note:** This is a web-based alternative to ClawX desktop app, designed specifically for Armbian devices.
