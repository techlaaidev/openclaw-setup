# ProcessManager Fix - Implementation Plan

## Date: 2026-02-23

## Problem Summary

ProcessManager currently only supports ClawX bundle structure (`~/.openclaw/openclaw` and `~/.openclaw/uv`), but the system has OpenClaw installed via npm at `/opt/homebrew/bin/openclaw` (in PATH) and UV at `/Users/hnam/.local/bin/uv` (in PATH).

### Current Behavior
- **Expected paths**: `~/.openclaw/openclaw` and `~/.openclaw/uv`
- **Actual paths**: `/opt/homebrew/bin/openclaw` and `/Users/hnam/.local/bin/uv`
- **Current spawn command**: `uv run openclaw gateway` (requires ClawX bundle)
- **Needed spawn command**: `openclaw gateway` (direct execution for system install)

### System Information
- **OpenClaw version**: 2026.1.30
- **OpenClaw location**: `/opt/homebrew/bin/openclaw` (Homebrew/npm install)
- **UV location**: `/Users/hnam/.local/bin/uv`
- **ClawX directory exists**: Yes (`~/.openclaw/` contains config but no binaries)
- **Platform**: macOS (Darwin 25.2.0)

## Root Cause Analysis

The ProcessManager was designed for ClawX desktop app which bundles OpenClaw and UV together in `~/.openclaw/`. When OpenClaw is installed system-wide via npm/Homebrew, the binaries are in PATH but not in the expected bundle location.

### Key Issues in Current Code

**File**: `/Users/hnam/Desktop/openclaw-setup/openclaw-web/src/services/ProcessManager.js`

1. **Lines 77-83**: `getOpenClawCommand()` only returns ClawX bundle paths
2. **Lines 276-283**: `start()` checks for bundle path existence, fails if not found
3. **Lines 291-303**: `start()` spawns `uv run openclaw gateway` (ClawX-specific)
4. **Line 187**: `isRunning()` uses `pgrep -f "openclaw"` (works for both)

## Implementation Plan

### Phase 1: Detection Logic

#### Step 1.1: Add Installation Type Detection
**Location**: After line 83 in ProcessManager.js

Add new method to detect which installation type is available:

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

**Why**: This provides a clear detection mechanism with fallback logic and maintains backward compatibility.

#### Step 1.2: Update getOpenClawCommand()
**Location**: Replace lines 77-83

```javascript
/**
 * Get OpenClaw command configuration
 * @returns {Promise<Object>} Command configuration
 */
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

**Why**: Makes the method async and returns installation-specific configuration.

### Phase 2: Update Start Method

#### Step 2.1: Modify start() Method
**Location**: Replace lines 273-346

```javascript
/**
 * Start OpenClaw process
 */
async start() {
  await this.mutex.lock();
  try {
    // Detect installation type
    const config = await this.getOpenClawCommand();

    console.log(`[ProcessManager] Detected ${config.type} installation`);
    console.log(`[ProcessManager] OpenClaw: ${config.openclawPath}`);
    if (config.uvPath) {
      console.log(`[ProcessManager] UV: ${config.uvPath}`);
    }

    // Check if already running
    if (await this.isRunning()) {
      throw new Error('OpenClaw is already running');
    }

    return new Promise((resolve, reject) => {
      let child;

      if (config.type === 'bundle') {
        // ClawX bundle: use uv run openclaw gateway
        console.log('[ProcessManager] Starting with ClawX bundle (uv run openclaw gateway)');
        child = spawn(
          config.uvPath,
          ['run', 'openclaw', 'gateway'],
          {
            cwd: this.openclawPath,
            detached: true,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
              ...process.env,
              OPENCLAW_PATH: this.openclawPath
            }
          }
        );
      } else if (config.type === 'system') {
        // System install: run openclaw gateway directly
        console.log('[ProcessManager] Starting with system installation (openclaw gateway)');
        child = spawn(
          config.openclawPath,
          ['gateway'],
          {
            cwd: this.openclawPath, // Use ~/.openclaw for config
            detached: true,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
              ...process.env,
              OPENCLAW_PATH: this.openclawPath
            }
          }
        );
      } else {
        reject(new Error('Unknown installation type'));
        return;
      }

      // Unref so parent can exit
      child.unref();

      this.process = child;
      this.pid = child.pid;
      this.startTime = Date.now();
      this.status = 'starting';

      child.stdout.on('data', (data) => {
        console.log('[OpenClaw]', data.toString().trim());
      });

      child.stderr.on('data', (data) => {
        console.error('[OpenClaw Error]', data.toString().trim());
      });

      child.on('error', (error) => {
        this.status = 'error';
        console.error('[ProcessManager] Spawn error:', error);
        reject(error);
      });

      child.on('exit', (code) => {
        this.status = code === 0 ? 'stopped' : 'crashed';
        this.process = null;
        this.pid = null;
        console.log(`[ProcessManager] OpenClaw exited with code ${code}`);
      });

      // Wait and verify startup
      setTimeout(async () => {
        if (await this.isRunning()) {
          this.status = 'running';
          console.log('[ProcessManager] OpenClaw started successfully');
          resolve({
            success: true,
            pid: this.pid,
            type: config.type,
            path: config.openclawPath
          });
        } else {
          this.status = 'error';
          reject(new Error('Failed to start OpenClaw - process not found after 3 seconds'));
        }
      }, 3000);
    });
  } finally {
    this.mutex.unlock();
  }
}
```

**Why**:
- Handles both installation types with appropriate spawn commands
- Provides detailed logging for troubleshooting
- Returns installation info in response
- Maintains backward compatibility with ClawX bundle

### Phase 3: Enhanced Error Handling

#### Step 3.1: Add Diagnostic Method
**Location**: After the detectInstallation() method

```javascript
/**
 * Get diagnostic information for troubleshooting
 * @returns {Promise<Object>} Diagnostic info
 */
async getDiagnostics() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    openclawPath: this.openclawPath,
    installation: null,
    pathCheck: {},
    processCheck: null,
    configCheck: null
  };

  // Check installation
  try {
    diagnostics.installation = await this.detectInstallation();
  } catch (error) {
    diagnostics.installation = { error: error.message };
  }

  // Check PATH
  try {
    const { stdout } = await execAsync('echo $PATH');
    diagnostics.pathCheck.path = stdout.trim();
    diagnostics.pathCheck.hasHomebrew = stdout.includes('/opt/homebrew/bin');
    diagnostics.pathCheck.hasLocal = stdout.includes('.local/bin');
  } catch (error) {
    diagnostics.pathCheck.error = error.message;
  }

  // Check if process is running
  diagnostics.processCheck = await this.isRunning();

  // Check config directory
  try {
    const configPath = path.join(this.openclawPath, 'openclaw.json');
    await fs.access(configPath);
    diagnostics.configCheck = { exists: true, path: configPath };
  } catch {
    diagnostics.configCheck = { exists: false };
  }

  return diagnostics;
}
```

**Why**: Provides comprehensive diagnostic information for troubleshooting installation issues.

### Phase 4: Update API Response

#### Step 4.1: Add Installation Info to Status Endpoint
**Location**: `/Users/hnam/Desktop/openclaw-setup/openclaw-web/src/api/process.js`

Update the `/status` endpoint (lines 12-26):

```javascript
// Get process status
router.get('/status', async (req, res) => {
  try {
    const status = await processManager.getStatus();
    const metrics = await processManager.getMetrics();
    const connection = await processManager.testConnection();

    // Add installation info
    let installation = null;
    try {
      installation = await processManager.detectInstallation();
    } catch (error) {
      installation = { error: error.message };
    }

    res.json({
      ...status,
      ...metrics,
      gatewayConnected: connection.success,
      installation
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Why**: Frontend can display installation type and troubleshoot issues.

#### Step 4.2: Add Diagnostics Endpoint
**Location**: Add after line 87 in process.js

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

**Why**: Provides a dedicated endpoint for troubleshooting.

### Phase 5: Testing Strategy

#### Test Case 1: System Installation (Current Setup)
```bash
# Prerequisites
which openclaw  # Should return /opt/homebrew/bin/openclaw
which uv        # Should return /Users/hnam/.local/bin/uv

# Test
curl -X POST http://localhost:3000/api/process/start
# Expected: Spawns "openclaw gateway" directly
# Expected: Process starts successfully

curl http://localhost:3000/api/process/status
# Expected: installation.type = "system"
# Expected: running = true
```

#### Test Case 2: ClawX Bundle (Backward Compatibility)
```bash
# Prerequisites (simulate ClawX bundle)
# Create mock executables in ~/.openclaw/
mkdir -p ~/.openclaw
echo '#!/bin/bash\necho "mock openclaw"' > ~/.openclaw/openclaw
echo '#!/bin/bash\necho "mock uv"' > ~/.openclaw/uv
chmod +x ~/.openclaw/openclaw ~/.openclaw/uv

# Test
curl -X POST http://localhost:3000/api/process/start
# Expected: Spawns "uv run openclaw gateway"
# Expected: Uses bundle executables
```

#### Test Case 3: No Installation
```bash
# Prerequisites
# Temporarily rename openclaw
sudo mv /opt/homebrew/bin/openclaw /opt/homebrew/bin/openclaw.bak

# Test
curl -X POST http://localhost:3000/api/process/start
# Expected: Error message with installation instructions
# Expected: Clear error about missing OpenClaw

# Cleanup
sudo mv /opt/homebrew/bin/openclaw.bak /opt/homebrew/bin/openclaw
```

#### Test Case 4: Already Running
```bash
# Prerequisites
openclaw gateway &  # Start manually
OPENCLAW_PID=$!

# Test
curl -X POST http://localhost:3000/api/process/start
# Expected: Error "OpenClaw is already running"

# Cleanup
kill $OPENCLAW_PID
```

#### Test Case 5: Diagnostics
```bash
curl http://localhost:3000/api/process/diagnostics
# Expected: Complete diagnostic information
# Expected: Shows installation type, paths, config status
```

### Phase 6: Documentation Updates

#### Update 1: README.md
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

#### Update 2: DEPLOYMENT.md
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

### Phase 7: Migration Path

#### For Existing Users

1. **No action required** - The fix is backward compatible
2. If using ClawX bundle, it will continue to work
3. If switching to system install:
   ```bash
   npm install -g openclaw
   # Restart openclaw-web service
   sudo systemctl restart openclaw-web
   ```

#### For New Users

1. Install OpenClaw: `npm install -g openclaw`
2. Install openclaw-web (existing process)
3. System will automatically detect and use system installation

## Implementation Checklist

- [ ] Add `detectInstallation()` method to ProcessManager.js
- [ ] Update `getOpenClawCommand()` to be async and use detection
- [ ] Rewrite `start()` method to handle both installation types
- [ ] Add `getDiagnostics()` method for troubleshooting
- [ ] Update `/api/process/status` endpoint to include installation info
- [ ] Add `/api/process/diagnostics` endpoint
- [ ] Add comprehensive logging throughout
- [ ] Update README.md with installation methods
- [ ] Update DEPLOYMENT.md with troubleshooting section
- [ ] Test with system installation (current setup)
- [ ] Test with ClawX bundle (backward compatibility)
- [ ] Test error cases (no installation, already running)
- [ ] Test diagnostics endpoint
- [ ] Update frontend to display installation type (optional)

## Risk Assessment

### Low Risk
- Backward compatible with ClawX bundle
- Only affects process spawning logic
- No database changes
- No API breaking changes

### Mitigation
- Comprehensive error messages
- Diagnostic endpoint for troubleshooting
- Detailed logging
- Fallback to ClawX bundle if both exist

## Estimated Implementation Time

- **Phase 1-2**: 1 hour (core detection and start logic)
- **Phase 3-4**: 30 minutes (diagnostics and API updates)
- **Phase 5**: 1 hour (testing all scenarios)
- **Phase 6-7**: 30 minutes (documentation)

**Total**: ~3 hours

## Success Criteria

1. System-installed OpenClaw starts successfully with `openclaw gateway` command
2. ClawX bundle continues to work with `uv run openclaw gateway` command
3. Clear error messages when OpenClaw is not installed
4. Diagnostic endpoint provides useful troubleshooting information
5. All existing functionality (stop, restart, logs, metrics) continues to work
6. No breaking changes to API or frontend

## Next Steps

1. Review this plan with team
2. Create backup of ProcessManager.js
3. Implement changes in order (Phase 1 → Phase 7)
4. Test each phase before moving to next
5. Deploy to staging environment
6. Test with real system installation
7. Deploy to production

## Notes

- The `~/.openclaw/` directory is still used for configuration even with system install
- UV is optional for system installation (only needed for ClawX bundle)
- The `pgrep -f "openclaw"` command works for both installation types
- Process management (stop, restart) works the same for both types
- Logging and metrics collection is installation-agnostic
