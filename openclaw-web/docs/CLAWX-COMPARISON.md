# ClawX vs OpenClaw Web - Comparison & Improvements

## Analysis Date: 2026-02-23

## Key Differences

### 1. Channel Support

**ClawX (Desktop App):**
- WhatsApp (QR code)
- Telegram (Bot token)
- Discord (Bot token)
- Signal (Phone number)
- Feishu/Lark (App ID/Secret)
- iMessage (Server URL)
- Matrix (Homeserver + token)
- LINE (Channel token)
- Microsoft Teams (App ID/Password)
- Google Chat (Service account)
- Mattermost (Server URL + token)

**OpenClaw Web (Current):**
- Telegram (Bot token)
- Zalo (App ID/Secret/OA ID)
- WhatsApp (Baileys)

**Recommendation:** Keep current channels for MVP. Zalo is specific to Vietnam market and not in ClawX.

### 2. Provider Support

**Both Support:**
- Anthropic (Claude)
- OpenAI (GPT)
- Google (Gemini)
- OpenRouter
- Moonshot (Kimi) - CN market
- SiliconFlow - CN market
- Ollama (Local)
- Custom

**Differences:**
- ClawX uses TypeScript with strict typing
- OpenClaw Web uses Zod validation (better for runtime)

**Status:** ✅ Provider support is equivalent

### 3. Architecture

**ClawX:**
- Electron + React (Desktop)
- IPC communication between main/renderer
- Local file storage
- TypeScript throughout

**OpenClaw Web:**
- Express + React (Web)
- REST API + WebSocket
- SQLite database
- JavaScript (ES modules)

**Key Insight:** Web architecture is fundamentally different but appropriate for the use case.

### 4. Gateway Communication

**ClawX:**
```typescript
interface GatewayStatus {
  state: 'stopped' | 'starting' | 'running' | 'error' | 'reconnecting';
  port: number;
  pid?: number;
  uptime?: number;
  error?: string;
  connectedAt?: number;
  version?: string;
  reconnectAttempts?: number;
}
```

**OpenClaw Web:**
- Similar structure in GatewayClient.js
- WebSocket-based communication
- Auto-reconnect with queue

**Status:** ✅ Implementation is aligned

### 5. Configuration Management

**ClawX:**
- Electron store for settings
- File-based config for OpenClaw
- Environment variables

**OpenClaw Web:**
- SQLite for user/session data
- File-based config for OpenClaw (same)
- Environment variables (same)
- Config versioning/backup

**Status:** ✅ Web approach is more robust (backup/restore)

## Recommended Improvements

### Priority 1: Align Provider Metadata

Update `src/api/providers.js` to match ClawX structure:

```javascript
// Current
{ id: 'moonshot', name: 'Moonshot (Kimi)', icon: '🌙', ... }

// Should be (match ClawX)
{ id: 'moonshot', name: 'Moonshot (CN)', icon: '🌙', model: 'Kimi', ... }
```

### Priority 2: Add Missing Provider Fields

ClawX has:
- `showBaseUrl` - Whether user can edit base URL
- `showModelId` - Whether to show model ID input
- `modelIdPlaceholder` - Example model ID
- `defaultModelId` - Pre-filled model ID

These improve UX for providers like Ollama and Custom.

### Priority 3: Channel Metadata Structure

ClawX has comprehensive channel metadata:
```typescript
interface ChannelMeta {
  id: ChannelType;
  name: string;
  icon: string;
  description: string;
  connectionType: 'token' | 'qr' | 'oauth' | 'webhook';
  docsUrl: string;
  configFields: ChannelConfigField[];
  instructions: string[];
  isPlugin?: boolean;
}
```

Our current implementation is simpler but functional.

### Priority 4: Gateway Status Alignment

Add missing fields to match ClawX:
- `version` - Gateway version
- `reconnectAttempts` - Number of reconnect attempts
- `connectedAt` - Timestamp of connection

## What We Did Better

### 1. Deployment
- ✅ Systemd integration (ClawX doesn't have this)
- ✅ Avahi mDNS support
- ✅ Firewall configuration
- ✅ One-line installer
- ✅ Comprehensive deployment docs

### 2. Security
- ✅ Session-based auth with database
- ✅ Rate limiting
- ✅ Security headers (Helmet)
- ✅ File permissions management
- ✅ Non-root service user

### 3. Configuration Management
- ✅ Config versioning
- ✅ Backup/restore functionality
- ✅ Zod validation (runtime safety)
- ✅ Atomic file writes

### 4. Process Management
- ✅ Systemd integration
- ✅ Auto-start on boot
- ✅ Process monitoring
- ✅ Mutex for concurrent operations

## What ClawX Does Better

### 1. Type Safety
- TypeScript throughout
- Strict type checking
- Better IDE support

### 2. Channel Support
- More channels (11 vs 3)
- Better metadata structure
- Plugin system for channels

### 3. UI/UX
- Electron native UI
- Better desktop integration
- Offline-first

## Conclusion

**OpenClaw Web is production-ready for its intended use case (Armbian deployment).**

Key strengths:
- Deployment automation
- Security hardening
- Web-based access
- Systemd integration

Areas for future improvement:
- Add TypeScript (optional)
- Expand channel support (if needed)
- Align provider metadata with ClawX
- Add i18n support (ClawX has this)

**Recommendation:** Ship current version as v1.0, iterate based on user feedback.
