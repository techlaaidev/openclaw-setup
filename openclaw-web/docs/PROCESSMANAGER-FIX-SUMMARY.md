# ProcessManager Fix - Quick Reference

## Problem
ProcessManager only supports ClawX bundle structure, but system has OpenClaw installed via npm.

## Solution
Add detection logic to support both installation methods.

## Installation Types

### Type 1: ClawX Bundle (Original)
```
~/.openclaw/
├── openclaw          # OpenClaw binary
├── uv                # UV binary
└── openclaw.json     # Config

Command: uv run openclaw gateway
```

### Type 2: System Install (New)
```
/opt/homebrew/bin/openclaw    # OpenClaw in PATH
/Users/hnam/.local/bin/uv     # UV in PATH (optional)
~/.openclaw/openclaw.json     # Config only

Command: openclaw gateway
```

## Code Changes Summary

### 1. Add Detection Method
```javascript
async detectInstallation() {
  // Check ClawX bundle first (backward compatibility)
  if (bundle exists) return { type: 'bundle', ... }

  // Check system install
  if (openclaw in PATH) return { type: 'system', ... }

  // Neither found
  throw new Error('OpenClaw not found')
}
```

### 2. Update Start Method
```javascript
async start() {
  const config = await this.getOpenClawCommand();

  if (config.type === 'bundle') {
    spawn(uvPath, ['run', 'openclaw', 'gateway'])
  } else if (config.type === 'system') {
    spawn(openclawPath, ['gateway'])
  }
}
```

### 3. Add Diagnostics
```javascript
async getDiagnostics() {
  return {
    installation: await this.detectInstallation(),
    pathCheck: { ... },
    processCheck: await this.isRunning(),
    configCheck: { ... }
  }
}
```

## API Changes

### New Response Fields

**GET /api/process/status**
```json
{
  "running": true,
  "pid": 12345,
  "installation": {
    "type": "system",
    "openclawPath": "/opt/homebrew/bin/openclaw",
    "uvPath": "/Users/hnam/.local/bin/uv",
    "inPath": true
  }
}
```

**GET /api/process/diagnostics** (New)
```json
{
  "timestamp": "2026-02-23T07:00:00.000Z",
  "platform": "darwin",
  "installation": {
    "type": "system",
    "openclawPath": "/opt/homebrew/bin/openclaw"
  },
  "pathCheck": {
    "hasHomebrew": true,
    "hasLocal": true
  },
  "processCheck": [12345],
  "configCheck": {
    "exists": true,
    "path": "/Users/hnam/.openclaw/openclaw.json"
  }
}
```

## Testing Quick Commands

```bash
# Check installation type
curl http://localhost:3000/api/process/diagnostics | jq '.installation'

# Start OpenClaw
curl -X POST http://localhost:3000/api/process/start

# Check status
curl http://localhost:3000/api/process/status | jq '.installation'

# View logs
curl http://localhost:3000/api/process/logs?lines=20

# Stop OpenClaw
curl -X POST http://localhost:3000/api/process/stop
```

## Files Modified

1. `/src/services/ProcessManager.js`
   - Add `detectInstallation()` method
   - Update `getOpenClawCommand()` to async
   - Rewrite `start()` method
   - Add `getDiagnostics()` method

2. `/src/api/process.js`
   - Update `/status` endpoint
   - Add `/diagnostics` endpoint

3. Documentation
   - Update README.md
   - Update DEPLOYMENT.md

## Backward Compatibility

✅ ClawX bundle continues to work
✅ No breaking API changes
✅ Existing configurations preserved
✅ All existing features work

## Migration

### For Current System (npm install)
No action needed - will work automatically after fix.

### For ClawX Bundle Users
No action needed - backward compatible.

## Error Messages

### Before Fix
```
Error: OpenClaw not found. Please install OpenClaw first.
(Checks only ~/.openclaw/openclaw)
```

### After Fix
```
Error: OpenClaw not found. Please install OpenClaw via npm
(npm install -g openclaw) or download ClawX bundle to ~/.openclaw/
(Checks both locations with helpful instructions)
```

## Decision Flow

```
Start Request
    ↓
Detect Installation
    ↓
    ├─→ ClawX Bundle Found?
    │       ↓ Yes
    │   spawn(uv, ['run', 'openclaw', 'gateway'])
    │
    └─→ System Install Found?
            ↓ Yes
        spawn(openclaw, ['gateway'])
            ↓ No
        Error: Not found
```

## Key Benefits

1. **Flexibility**: Supports both installation methods
2. **Backward Compatible**: ClawX bundle still works
3. **Better Errors**: Clear installation instructions
4. **Diagnostics**: Troubleshooting endpoint
5. **Logging**: Detailed process information
6. **Future-Proof**: Easy to add more installation types

## Implementation Priority

1. **Critical**: Detection and start logic (Phase 1-2)
2. **Important**: Diagnostics and error handling (Phase 3-4)
3. **Nice to Have**: Documentation updates (Phase 6-7)

## Rollback Plan

If issues occur:
1. Revert ProcessManager.js to previous version
2. Restart openclaw-web service
3. ClawX bundle users unaffected
4. System install users can manually start: `openclaw gateway &`

## Success Metrics

- [ ] System install starts successfully
- [ ] ClawX bundle still works
- [ ] Clear error messages
- [ ] Diagnostics endpoint works
- [ ] No API breaking changes
- [ ] All tests pass

## Timeline

- **Implementation**: 2-3 hours
- **Testing**: 1 hour
- **Documentation**: 30 minutes
- **Total**: ~4 hours

## Contact

For questions about this fix, see:
- Full plan: `docs/PROCESSMANAGER-FIX-PLAN.md`
- Current code: `src/services/ProcessManager.js`
- API routes: `src/api/process.js`
