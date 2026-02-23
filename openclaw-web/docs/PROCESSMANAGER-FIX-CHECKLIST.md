# ProcessManager Fix - Implementation Checklist

## Date: 2026-02-23
## Estimated Time: 4 hours
## Risk Level: LOW (Backward compatible)

---

## Pre-Implementation

### 1. Backup Current Files
```bash
cd /Users/hnam/Desktop/openclaw-setup/openclaw-web

# Backup ProcessManager
cp src/services/ProcessManager.js src/services/ProcessManager.js.backup

# Backup process API
cp src/api/process.js src/api/process.js.backup

# Create git branch (if using git)
git checkout -b fix/processmanager-dual-install
```

**Status**: ☐ Complete

### 2. Verify Current System State
```bash
# Check OpenClaw location
which openclaw
# Expected: /opt/homebrew/bin/openclaw

# Check UV location
which uv
# Expected: /Users/hnam/.local/bin/uv

# Check OpenClaw version
openclaw --version
# Expected: 2026.1.30

# Check if OpenClaw is running
pgrep -f openclaw
# Expected: empty or PID if running

# Check config directory
ls -la ~/.openclaw/openclaw.json
# Expected: file exists
```

**Status**: ☐ Complete

### 3. Stop OpenClaw Web Server
```bash
# If running via npm
# Press Ctrl+C in terminal

# If running via systemd
sudo systemctl stop openclaw-web

# Verify stopped
curl http://localhost:3000/api/process/status
# Expected: Connection refused
```

**Status**: ☐ Complete

---

## Phase 1: Core Detection Logic (60 minutes)

### 1.1 Add detectInstallation() Method
**File**: `src/services/ProcessManager.js`
**Location**: After line 83 (after `getOpenClawCommand` method)

```javascript
/**
 * Detect OpenClaw installation type
 * @returns {Promise<Object>} Installation info
 */
async detectInstallation() {
  const result = {
    type: null,
    openclawPath: null,
    uvPath: null,
    inPath: false
  };

  // Check for ClawX bundle first (backward compatibility)
  const bundleOpenClaw = path.join(this.openclawPath, 'openclaw');
  const bundleUv = path.join(this.openclawPath, 'uv');

  try {
    await fs.access(bundleOpenClaw, fs.constants.X_OK);
    await fs.access(bundleUv, fs.constants.X_OK);

    result.type = 'bundle';
    result.openclawPath = bundleOpenClaw;
    result.uvPath = bundleUv;
    return result;
  } catch {
    // Bundle not found, check system install
  }

  // Check for system installation (in PATH)
  try {
    const { stdout: openclawPath } = await execAsync('which openclaw');
    result.openclawPath = openclawPath.trim();
    result.inPath = true;

    // UV is optional for system install
    try {
      const { stdout: uvPath } = await execAsync('which uv');
      result.uvPath = uvPath.trim();
    } catch {
      // UV not required for system install
    }

    result.type = 'system';
    return result;
  } catch {
    // Neither installation found
  }

  throw new Error(
    'OpenClaw not found. Please install OpenClaw via npm (npm install -g openclaw) ' +
    'or download ClawX bundle to ~/.openclaw/'
  );
}
```

**Checklist**:
- ☐ Code added after line 83
- ☐ No syntax errors
- ☐ Proper indentation
- ☐ Comments included

**Status**: ☐ Complete

### 1.2 Update getOpenClawCommand() Method
**File**: `src/services/ProcessManager.js`
**Location**: Replace lines 77-83

**BEFORE**:
```javascript
getOpenClawCommand() {
  // Check for uv (from ClawX bundle)
  const uvPath = path.join(this.openclawPath, 'uv');
  const openclawPath = path.join(this.openclawPath, 'openclaw');

  return { uvPath, openclawPath };
}
```

**AFTER**:
```javascript
async getOpenClawCommand() {
  const installation = await this.detectInstallation();

  return {
    type: installation.type,
    openclawPath: installation.openclawPath,
    uvPath: installation.uvPath,
    inPath: installation.inPath
  };
}
```

**Checklist**:
- ☐ Method is now `async`
- ☐ Calls `detectInstallation()`
- ☐ Returns installation object
- ☐ No syntax errors

**Status**: ☐ Complete

### 1.3 Test Detection Logic
```bash
# Start server
npm run dev

# In another terminal, test detection
node -e "
const ProcessManager = require('./src/services/ProcessManager.js').ProcessManager;
const pm = new ProcessManager();
pm.detectInstallation().then(result => {
  console.log('Detection result:', JSON.stringify(result, null, 2));
}).catch(err => {
  console.error('Detection error:', err.message);
});
"
```

**Expected Output**:
```json
{
  "type": "system",
  "openclawPath": "/opt/homebrew/bin/openclaw",
  "uvPath": "/Users/hnam/.local/bin/uv",
  "inPath": true
}
```

**Checklist**:
- ☐ Detection returns "system" type
- ☐ Correct OpenClaw path
- ☐ Correct UV path
- ☐ No errors

**Status**: ☐ Complete

---

## Phase 2: Update Start Method (60 minutes)

### 2.1 Rewrite start() Method
**File**: `src/services/ProcessManager.js`
**Location**: Replace lines 273-346

**See**: `docs/PROCESSMANAGER-FIX-CODE-PREVIEW.md` for complete code

**Key Changes**:
1. Call `await this.getOpenClawCommand()` to get config
2. Add logging for detected installation type
3. Add conditional spawn logic:
   - If `type === 'bundle'`: spawn `uv run openclaw gateway`
   - If `type === 'system'`: spawn `openclaw gateway`
4. Return installation info in success response

**Checklist**:
- ☐ Method calls `getOpenClawCommand()` with `await`
- ☐ Logging added for installation type
- ☐ Bundle spawn logic preserved
- ☐ System spawn logic added
- ☐ Error handling preserved
- ☐ Success response includes installation info
- ☐ No syntax errors

**Status**: ☐ Complete

### 2.2 Test Start Method
```bash
# Ensure OpenClaw is not running
pkill -f openclaw

# Start server
npm run dev

# In another terminal, test start
curl -X POST http://localhost:3000/api/process/start

# Expected response:
# {
#   "success": true,
#   "pid": 12345,
#   "type": "system",
#   "path": "/opt/homebrew/bin/openclaw"
# }

# Verify process is running
pgrep -f openclaw
# Should return PID

# Check server logs for:
# [ProcessManager] Detected system installation
# [ProcessManager] OpenClaw: /opt/homebrew/bin/openclaw
# [ProcessManager] Starting with system installation (openclaw gateway)
# [ProcessManager] OpenClaw started successfully
```

**Checklist**:
- ☐ Start request succeeds
- ☐ Returns correct installation type
- ☐ Process is actually running
- ☐ Logs show correct detection
- ☐ Logs show correct spawn command

**Status**: ☐ Complete

### 2.3 Test Stop Method
```bash
# Stop OpenClaw
curl -X POST http://localhost:3000/api/process/stop

# Expected response:
# {
#   "success": true,
#   "message": "OpenClaw stopped"
# }

# Verify process stopped
pgrep -f openclaw
# Should return empty
```

**Checklist**:
- ☐ Stop request succeeds
- ☐ Process actually stopped
- ☐ No errors in logs

**Status**: ☐ Complete

---

## Phase 3: Add Diagnostics (30 minutes)

### 3.1 Add getDiagnostics() Method
**File**: `src/services/ProcessManager.js`
**Location**: After `detectInstallation()` method

**See**: `docs/PROCESSMANAGER-FIX-CODE-PREVIEW.md` for complete code

**Checklist**:
- ☐ Method added after `detectInstallation()`
- ☐ Returns comprehensive diagnostic info
- ☐ Handles errors gracefully
- ☐ No syntax errors

**Status**: ☐ Complete

### 3.2 Update Status Endpoint
**File**: `src/api/process.js`
**Location**: Replace lines 12-26

**Key Changes**:
1. Call `processManager.detectInstallation()`
2. Add `installation` field to response
3. Handle detection errors gracefully

**Checklist**:
- ☐ Calls `detectInstallation()`
- ☐ Adds `installation` to response
- ☐ Error handling added
- ☐ No syntax errors

**Status**: ☐ Complete

### 3.3 Add Diagnostics Endpoint
**File**: `src/api/process.js`
**Location**: After line 87

```javascript
// Get diagnostics
router.get('/diagnostics', async (req, res) => {
  try {
    const diagnostics = await processManager.getDiagnostics();
    res.json(diagnostics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Checklist**:
- ☐ Endpoint added after line 87
- ☐ Calls `getDiagnostics()`
- ☐ Returns JSON response
- ☐ Error handling included
- ☐ No syntax errors

**Status**: ☐ Complete

### 3.4 Test Diagnostics
```bash
# Test status endpoint
curl http://localhost:3000/api/process/status | jq

# Should include:
# {
#   "running": true/false,
#   "installation": {
#     "type": "system",
#     "openclawPath": "/opt/homebrew/bin/openclaw",
#     ...
#   }
# }

# Test diagnostics endpoint
curl http://localhost:3000/api/process/diagnostics | jq

# Should return comprehensive info:
# {
#   "timestamp": "...",
#   "platform": "darwin",
#   "installation": { ... },
#   "pathCheck": { ... },
#   "processCheck": [...],
#   "configCheck": { ... }
# }
```

**Checklist**:
- ☐ Status endpoint includes installation
- ☐ Diagnostics endpoint returns full info
- ☐ All fields populated correctly
- ☐ No errors

**Status**: ☐ Complete

---

## Phase 4: Comprehensive Testing (60 minutes)

### 4.1 Test System Installation (Current Setup)
```bash
# Ensure OpenClaw is in PATH
which openclaw
# Expected: /opt/homebrew/bin/openclaw

# Stop any running OpenClaw
pkill -f openclaw

# Test start
curl -X POST http://localhost:3000/api/process/start

# Verify
curl http://localhost:3000/api/process/status | jq '.installation'
# Expected: type = "system"

pgrep -f openclaw
# Expected: PID

# Test stop
curl -X POST http://localhost:3000/api/process/stop

# Verify
pgrep -f openclaw
# Expected: empty
```

**Checklist**:
- ☐ Detects system installation
- ☐ Starts successfully
- ☐ Process runs correctly
- ☐ Stops successfully
- ☐ No errors in logs

**Status**: ☐ Complete

### 4.2 Test Already Running Scenario
```bash
# Start OpenClaw manually
openclaw gateway &
OPENCLAW_PID=$!

# Try to start via API
curl -X POST http://localhost:3000/api/process/start

# Expected response:
# {
#   "error": "OpenClaw is already running"
# }

# Cleanup
kill $OPENCLAW_PID
```

**Checklist**:
- ☐ Detects already running process
- ☐ Returns appropriate error
- ☐ Doesn't create duplicate process

**Status**: ☐ Complete

### 4.3 Test Error Cases
```bash
# Test 1: OpenClaw not in PATH (simulate)
# Temporarily rename openclaw
sudo mv /opt/homebrew/bin/openclaw /opt/homebrew/bin/openclaw.bak

# Try to start
curl -X POST http://localhost:3000/api/process/start

# Expected: Error with installation instructions

# Restore
sudo mv /opt/homebrew/bin/openclaw.bak /opt/homebrew/bin/openclaw

# Test 2: Check diagnostics when not found
curl http://localhost:3000/api/process/diagnostics | jq '.installation'
# Should show error or detection result
```

**Checklist**:
- ☐ Clear error when OpenClaw not found
- ☐ Error includes installation instructions
- ☐ Diagnostics help troubleshooting

**Status**: ☐ Complete

### 4.4 Test Restart Functionality
```bash
# Start OpenClaw
curl -X POST http://localhost:3000/api/process/start

# Wait for it to start
sleep 3

# Restart
curl -X POST http://localhost:3000/api/process/restart

# Verify
curl http://localhost:3000/api/process/status
# Should show running with new PID
```

**Checklist**:
- ☐ Restart stops old process
- ☐ Restart starts new process
- ☐ New PID assigned
- ☐ No errors

**Status**: ☐ Complete

### 4.5 Test Backward Compatibility (Optional)
**Note**: Only if ClawX bundle is available

```bash
# Create mock ClawX bundle for testing
mkdir -p ~/.openclaw-test
echo '#!/bin/bash\necho "mock openclaw"' > ~/.openclaw-test/openclaw
echo '#!/bin/bash\necho "mock uv"' > ~/.openclaw-test/uv
chmod +x ~/.openclaw-test/openclaw ~/.openclaw-test/uv

# Modify ProcessManager temporarily to use test path
# Or test with actual ClawX bundle if available

# Expected: Detects as 'bundle' type
# Expected: Uses 'uv run openclaw gateway' command
```

**Checklist**:
- ☐ Detects bundle installation
- ☐ Uses correct spawn command
- ☐ Bundle takes priority over system

**Status**: ☐ Complete (or N/A)

---

## Phase 5: Documentation (30 minutes)

### 5.1 Update README.md
**File**: `README.md`

Add section about installation methods:

```markdown
## OpenClaw Installation

OpenClaw Web supports two installation methods:

### System Installation (Recommended)
Install OpenClaw globally via npm:
```bash
npm install -g openclaw
```

The web interface will automatically detect and use the system installation.

### ClawX Bundle
If you have ClawX desktop app installed, the web interface will use the bundled OpenClaw from `~/.openclaw/`.

The system automatically detects which installation method is available and uses the appropriate one.
```

**Checklist**:
- ☐ Section added to README
- ☐ Both installation methods documented
- ☐ Clear and concise

**Status**: ☐ Complete

### 5.2 Update DEPLOYMENT.md
**File**: `docs/DEPLOYMENT.md`

Add troubleshooting section:

```markdown
## Troubleshooting

### OpenClaw Not Starting

Check installation type:
```bash
curl http://localhost:3000/api/process/diagnostics
```

Verify OpenClaw is installed:
```bash
which openclaw
openclaw --version
```

Check if already running:
```bash
pgrep -f openclaw
```

View detailed logs:
```bash
curl http://localhost:3000/api/process/logs?lines=50
```
```

**Checklist**:
- ☐ Troubleshooting section added
- ☐ Diagnostic commands included
- ☐ Clear instructions

**Status**: ☐ Complete

### 5.3 Add Code Comments
**File**: `src/services/ProcessManager.js`

Ensure all new methods have:
- JSDoc comments
- Parameter descriptions
- Return type descriptions
- Inline comments for complex logic

**Checklist**:
- ☐ All methods have JSDoc
- ☐ Complex logic commented
- ☐ Clear and helpful

**Status**: ☐ Complete

---

## Phase 6: Final Verification (30 minutes)

### 6.1 Code Review Checklist
```bash
# Check for syntax errors
npm run dev
# Should start without errors

# Check for linting issues (if applicable)
npm run lint
# Should pass or show only warnings
```

**Checklist**:
- ☐ No syntax errors
- ☐ No linting errors
- ☐ Code follows project style
- ☐ All comments clear
- ☐ No console.log left in code (except intentional logging)

**Status**: ☐ Complete

### 6.2 Integration Test
```bash
# Full workflow test
# 1. Start server
npm run dev

# 2. Check diagnostics
curl http://localhost:3000/api/process/diagnostics | jq

# 3. Start OpenClaw
curl -X POST http://localhost:3000/api/process/start

# 4. Check status
curl http://localhost:3000/api/process/status | jq

# 5. Test gateway connection
curl http://localhost:3000/api/process/test | jq

# 6. Get logs
curl http://localhost:3000/api/process/logs?lines=20

# 7. Stop OpenClaw
curl -X POST http://localhost:3000/api/process/stop

# All should work without errors
```

**Checklist**:
- ☐ All endpoints respond correctly
- ☐ Start/stop works
- ☐ Status shows correct info
- ☐ Logs accessible
- ☐ No errors in server logs

**Status**: ☐ Complete

### 6.3 Performance Check
```bash
# Check memory usage
ps aux | grep node

# Check response times
time curl http://localhost:3000/api/process/status

# Should be < 100ms
```

**Checklist**:
- ☐ No memory leaks
- ☐ Response times acceptable
- ☐ No performance degradation

**Status**: ☐ Complete

---

## Post-Implementation

### 1. Commit Changes
```bash
# Check what changed
git status
git diff

# Add files
git add src/services/ProcessManager.js
git add src/api/process.js
git add README.md
git add docs/DEPLOYMENT.md
git add docs/PROCESSMANAGER-FIX-*.md

# Commit
git commit -m "Fix ProcessManager to support both ClawX bundle and system-installed OpenClaw

- Add detectInstallation() to detect installation type
- Update start() to use appropriate spawn command
- Add getDiagnostics() for troubleshooting
- Update API endpoints to include installation info
- Maintain backward compatibility with ClawX bundle
- Add comprehensive documentation

Fixes issue where system-installed OpenClaw (via npm) was not detected."

# Push (if applicable)
git push origin fix/processmanager-dual-install
```

**Status**: ☐ Complete

### 2. Deploy to Production
```bash
# If using systemd
sudo systemctl stop openclaw-web
sudo systemctl start openclaw-web
sudo systemctl status openclaw-web

# Check logs
sudo journalctl -u openclaw-web -f
```

**Status**: ☐ Complete

### 3. Monitor
```bash
# Check if OpenClaw starts correctly
curl http://localhost:3000/api/process/status

# Monitor logs for any issues
tail -f logs/openclaw-web.log

# Check for errors
curl http://localhost:3000/api/process/diagnostics | jq
```

**Status**: ☐ Complete

### 4. Cleanup
```bash
# Remove backup files (after confirming everything works)
rm src/services/ProcessManager.js.backup
rm src/api/process.js.backup

# Or keep them for a few days just in case
```

**Status**: ☐ Complete

---

## Rollback Plan (If Needed)

### If Issues Occur:
```bash
# 1. Stop server
sudo systemctl stop openclaw-web

# 2. Restore backups
cp src/services/ProcessManager.js.backup src/services/ProcessManager.js
cp src/api/process.js.backup src/api/process.js

# 3. Restart server
sudo systemctl start openclaw-web

# 4. Verify
curl http://localhost:3000/api/process/status

# Time to rollback: < 1 minute
```

**Status**: ☐ N/A (hopefully!)

---

## Success Criteria

All items must be checked:

- ☐ System-installed OpenClaw detected correctly
- ☐ OpenClaw starts with correct command
- ☐ Process runs without errors
- ☐ Stop/restart functionality works
- ☐ Status endpoint includes installation info
- ☐ Diagnostics endpoint provides useful info
- ☐ Clear error messages when OpenClaw not found
- ☐ Backward compatible with ClawX bundle
- ☐ No breaking API changes
- ☐ Documentation updated
- ☐ All tests pass
- ☐ No performance degradation
- ☐ Code reviewed and clean
- ☐ Deployed successfully
- ☐ Monitoring shows no issues

---

## Time Tracking

| Phase | Estimated | Actual | Notes |
|-------|-----------|--------|-------|
| Pre-Implementation | 15 min | | |
| Phase 1: Detection | 60 min | | |
| Phase 2: Start Method | 60 min | | |
| Phase 3: Diagnostics | 30 min | | |
| Phase 4: Testing | 60 min | | |
| Phase 5: Documentation | 30 min | | |
| Phase 6: Verification | 30 min | | |
| Post-Implementation | 15 min | | |
| **Total** | **4 hours** | | |

---

## Notes

- Keep backups until confirmed working in production
- Monitor logs for first 24 hours after deployment
- Document any issues encountered during implementation
- Update this checklist if any steps were missed or incorrect

---

## Sign-off

- ☐ Implementation complete
- ☐ Testing complete
- ☐ Documentation complete
- ☐ Deployed to production
- ☐ Monitoring confirmed stable

**Implemented by**: _________________
**Date**: _________________
**Reviewed by**: _________________
**Date**: _________________
