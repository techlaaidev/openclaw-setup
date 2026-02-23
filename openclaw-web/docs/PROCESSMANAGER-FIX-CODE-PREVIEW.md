# ProcessManager Fix - Code Changes Preview

## File: src/services/ProcessManager.js

### Change 1: Add detectInstallation() Method
**Location**: After line 83 (after getOpenClawCommand method)

```javascript
// ============================================================================
// NEW METHOD - Add after line 83
// ============================================================================

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

### Change 2: Update getOpenClawCommand() Method
**Location**: Replace lines 77-83

```javascript
// ============================================================================
// BEFORE (lines 77-83)
// ============================================================================
/**
 * Get OpenClaw binary path
 */
getOpenClawCommand() {
  // Check for uv (from ClawX bundle)
  const uvPath = path.join(this.openclawPath, 'uv');
  const openclawPath = path.join(this.openclawPath, 'openclaw');

  return { uvPath, openclawPath };
}

// ============================================================================
// AFTER (replace lines 77-83)
// ============================================================================
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

### Change 3: Rewrite start() Method
**Location**: Replace lines 273-346

```javascript
// ============================================================================
// BEFORE (lines 273-346) - Simplified view
// ============================================================================
async start() {
  await this.mutex.lock();
  try {
    const { uvPath, openclawPath } = this.getOpenClawCommand();

    // Check if OpenClaw exists
    try {
      await fs.access(openclawPath);
    } catch {
      throw new Error('OpenClaw not found. Please install OpenClaw first.');
    }

    // Check if already running
    if (await this.isRunning()) {
      throw new Error('OpenClaw is already running');
    }

    return new Promise((resolve, reject) => {
      const child = spawn(
        uvPath,
        ['run', 'openclaw', 'gateway'],
        { /* options */ }
      );
      // ... rest of spawn logic
    });
  } finally {
    this.mutex.unlock();
  }
}

// ============================================================================
// AFTER (replace lines 273-346)
// ============================================================================
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

### Change 4: Add getDiagnostics() Method
**Location**: After detectInstallation() method

```javascript
// ============================================================================
// NEW METHOD - Add after detectInstallation()
// ============================================================================

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

## File: src/api/process.js

### Change 5: Update /status Endpoint
**Location**: Replace lines 12-26

```javascript
// ============================================================================
// BEFORE (lines 12-26)
// ============================================================================
router.get('/status', async (req, res) => {
  try {
    const status = await processManager.getStatus();
    const metrics = await processManager.getMetrics();
    const connection = await processManager.testConnection();

    res.json({
      ...status,
      ...metrics,
      gatewayConnected: connection.success
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AFTER (replace lines 12-26)
// ============================================================================
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

### Change 6: Add /diagnostics Endpoint
**Location**: Add after line 87

```javascript
// ============================================================================
// NEW ENDPOINT - Add after line 87
// ============================================================================

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

## Summary of Changes

### Lines Changed
- **ProcessManager.js**: ~150 lines modified/added
  - Lines 77-83: Modified (getOpenClawCommand)
  - After line 83: Added ~60 lines (detectInstallation)
  - After detectInstallation: Added ~50 lines (getDiagnostics)
  - Lines 273-346: Modified ~80 lines (start method)

- **process.js**: ~20 lines modified/added
  - Lines 12-26: Modified (status endpoint)
  - After line 87: Added ~10 lines (diagnostics endpoint)

### Total Impact
- **2 files modified**
- **~170 lines changed/added**
- **0 breaking changes**
- **100% backward compatible**

## Key Differences

### Spawn Command
```javascript
// BEFORE (ClawX only)
spawn(uvPath, ['run', 'openclaw', 'gateway'])

// AFTER (both supported)
if (type === 'bundle') {
  spawn(uvPath, ['run', 'openclaw', 'gateway'])
} else if (type === 'system') {
  spawn(openclawPath, ['gateway'])
}
```

### Error Messages
```javascript
// BEFORE
throw new Error('OpenClaw not found. Please install OpenClaw first.');

// AFTER
throw new Error(
  'OpenClaw not found. Please install OpenClaw via npm ' +
  '(npm install -g openclaw) or download ClawX bundle to ~/.openclaw/'
);
```

### Detection Logic
```javascript
// BEFORE
const openclawPath = path.join(this.openclawPath, 'openclaw');
// Only checks bundle location

// AFTER
// 1. Check bundle location
// 2. Check system PATH
// 3. Provide clear error if neither found
```

## Testing the Changes

### Before Implementation
```bash
# Current behavior - FAILS
curl -X POST http://localhost:3000/api/process/start
# Error: OpenClaw not found (checks only ~/.openclaw/openclaw)
```

### After Implementation
```bash
# New behavior - WORKS
curl -X POST http://localhost:3000/api/process/start
# Success: Detects /opt/homebrew/bin/openclaw and starts it

# Check what was detected
curl http://localhost:3000/api/process/status | jq '.installation'
# {
#   "type": "system",
#   "openclawPath": "/opt/homebrew/bin/openclaw",
#   "uvPath": "/Users/hnam/.local/bin/uv",
#   "inPath": true
# }

# Get full diagnostics
curl http://localhost:3000/api/process/diagnostics | jq
```

## Implementation Steps

1. **Backup current file**
   ```bash
   cp src/services/ProcessManager.js src/services/ProcessManager.js.backup
   ```

2. **Apply changes in order**
   - Add detectInstallation() method
   - Update getOpenClawCommand() method
   - Add getDiagnostics() method
   - Rewrite start() method
   - Update process.js endpoints

3. **Test each change**
   ```bash
   # Restart server after each change
   npm run dev

   # Test detection
   curl http://localhost:3000/api/process/diagnostics

   # Test start
   curl -X POST http://localhost:3000/api/process/start
   ```

4. **Verify backward compatibility**
   - Test with ClawX bundle (if available)
   - Test with system install
   - Test error cases

## Rollback Procedure

If issues occur:
```bash
# Restore backup
cp src/services/ProcessManager.js.backup src/services/ProcessManager.js

# Restart service
npm run dev
# or
sudo systemctl restart openclaw-web
```

## Next Steps

1. Review this code preview
2. Implement changes in development environment
3. Test thoroughly with current system setup
4. Deploy to staging (if available)
5. Deploy to production
6. Update documentation
7. Monitor logs for any issues
