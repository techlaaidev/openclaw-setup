# ProcessManager Fix - Visual Flow Diagram

## Current Problem Flow

```
User clicks "Start OpenClaw"
         ↓
    POST /api/process/start
         ↓
    processManager.start()
         ↓
    getOpenClawCommand()
         ↓
    Returns: {
      uvPath: ~/.openclaw/uv,
      openclawPath: ~/.openclaw/openclaw
    }
         ↓
    Check if ~/.openclaw/openclaw exists
         ↓
    ❌ NOT FOUND
         ↓
    Error: "OpenClaw not found. Please install OpenClaw first."
         ↓
    User sees error (but OpenClaw IS installed at /opt/homebrew/bin/openclaw)
```

## Fixed Flow

```
User clicks "Start OpenClaw"
         ↓
    POST /api/process/start
         ↓
    processManager.start()
         ↓
    getOpenClawCommand()
         ↓
    detectInstallation()
         ↓
    ┌─────────────────────────────────────┐
    │  Check ClawX Bundle First           │
    │  (Backward Compatibility)           │
    │                                     │
    │  Does ~/.openclaw/openclaw exist?   │
    │  Does ~/.openclaw/uv exist?         │
    └─────────────────────────────────────┘
         ↓
    ┌───YES─────────────────────────┐
    │                                │
    │  Return:                       │
    │  {                             │
    │    type: 'bundle',             │
    │    openclawPath: '~/.openclaw/openclaw', │
    │    uvPath: '~/.openclaw/uv'    │
    │  }                             │
    │                                │
    │  Spawn Command:                │
    │  uv run openclaw gateway       │
    └────────────────────────────────┘
         ↓
    ✅ ClawX Bundle Started

         ↓ NO
    ┌─────────────────────────────────────┐
    │  Check System Installation          │
    │                                     │
    │  Run: which openclaw                │
    │  Is it in PATH?                     │
    └─────────────────────────────────────┘
         ↓
    ┌───YES─────────────────────────┐
    │                                │
    │  Return:                       │
    │  {                             │
    │    type: 'system',             │
    │    openclawPath: '/opt/homebrew/bin/openclaw', │
    │    uvPath: '/Users/hnam/.local/bin/uv', │
    │    inPath: true                │
    │  }                             │
    │                                │
    │  Spawn Command:                │
    │  openclaw gateway              │
    └────────────────────────────────┘
         ↓
    ✅ System Install Started

         ↓ NO
    ┌─────────────────────────────────────┐
    │  Neither Installation Found         │
    │                                     │
    │  Error: "OpenClaw not found.        │
    │  Please install OpenClaw via npm    │
    │  (npm install -g openclaw) or       │
    │  download ClawX bundle to           │
    │  ~/.openclaw/"                      │
    └─────────────────────────────────────┘
         ↓
    ❌ Clear Error with Instructions
```

## Detection Logic Flowchart

```
                    detectInstallation()
                            ↓
        ┌───────────────────────────────────────┐
        │   Check: ~/.openclaw/openclaw exists? │
        │   Check: ~/.openclaw/uv exists?       │
        │   Check: Both are executable?         │
        └───────────────────────────────────────┘
                            ↓
                    ┌───────┴───────┐
                    │               │
                   YES              NO
                    │               │
                    ↓               ↓
        ┌─────────────────┐   ┌─────────────────┐
        │  ClawX Bundle   │   │  Check System   │
        │  type: 'bundle' │   │  Installation   │
        │                 │   │                 │
        │  Return paths   │   │  which openclaw │
        └─────────────────┘   └─────────────────┘
                                      ↓
                              ┌───────┴───────┐
                              │               │
                            FOUND          NOT FOUND
                              │               │
                              ↓               ↓
                  ┌─────────────────┐   ┌─────────────────┐
                  │  System Install │   │  Throw Error    │
                  │  type: 'system' │   │  with install   │
                  │                 │   │  instructions   │
                  │  Return paths   │   │                 │
                  └─────────────────┘   └─────────────────┘
```

## Spawn Command Decision Tree

```
                    start() called
                          ↓
                  detectInstallation()
                          ↓
                    ┌─────┴─────┐
                    │           │
              type='bundle'  type='system'
                    │           │
                    ↓           ↓
        ┌──────────────────┐  ┌──────────────────┐
        │  ClawX Bundle    │  │  System Install  │
        │                  │  │                  │
        │  Command:        │  │  Command:        │
        │  spawn(          │  │  spawn(          │
        │    uvPath,       │  │    openclawPath, │
        │    ['run',       │  │    ['gateway']   │
        │     'openclaw',  │  │  )               │
        │     'gateway']   │  │                  │
        │  )               │  │  Working Dir:    │
        │                  │  │  ~/.openclaw     │
        │  Working Dir:    │  │  (for config)    │
        │  ~/.openclaw     │  │                  │
        └──────────────────┘  └──────────────────┘
                    │           │
                    └─────┬─────┘
                          ↓
                  Process spawned
                          ↓
                  Wait 3 seconds
                          ↓
                  Check if running
                          ↓
                    ┌─────┴─────┐
                    │           │
                  YES           NO
                    │           │
                    ↓           ↓
              ✅ Success    ❌ Error
```

## API Response Flow

```
GET /api/process/status
         ↓
    ┌─────────────────────────────────┐
    │  Get process status             │
    │  Get metrics (CPU, memory)      │
    │  Test gateway connection        │
    │  Detect installation type ← NEW │
    └─────────────────────────────────┘
         ↓
    Return JSON:
    {
      "running": true,
      "pid": 12345,
      "cpu": 2.5,
      "memory": 150.23,
      "uptime": 3600,
      "gatewayConnected": true,
      "installation": {              ← NEW
        "type": "system",            ← NEW
        "openclawPath": "/opt/homebrew/bin/openclaw", ← NEW
        "uvPath": "/Users/hnam/.local/bin/uv",        ← NEW
        "inPath": true               ← NEW
      }
    }
```

## Diagnostics Endpoint Flow

```
GET /api/process/diagnostics
         ↓
    ┌─────────────────────────────────┐
    │  Collect system information     │
    │  - Platform, arch, Node version │
    │  - Installation detection       │
    │  - PATH check                   │
    │  - Process check                │
    │  - Config file check            │
    └─────────────────────────────────┘
         ↓
    Return comprehensive diagnostics:
    {
      "timestamp": "2026-02-23T07:02:29.658Z",
      "platform": "darwin",
      "arch": "arm64",
      "nodeVersion": "v20.x.x",
      "openclawPath": "/Users/hnam/.openclaw",
      "installation": {
        "type": "system",
        "openclawPath": "/opt/homebrew/bin/openclaw",
        "uvPath": "/Users/hnam/.local/bin/uv",
        "inPath": true
      },
      "pathCheck": {
        "path": "/opt/homebrew/bin:/Users/hnam/.local/bin:...",
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

## Installation Type Comparison

```
┌─────────────────────────────────────────────────────────────────┐
│                    ClawX Bundle vs System Install               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ClawX Bundle (type: 'bundle')                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Location:     ~/.openclaw/openclaw                       │ │
│  │  UV Location:  ~/.openclaw/uv                             │ │
│  │  Command:      uv run openclaw gateway                    │ │
│  │  Config:       ~/.openclaw/openclaw.json                  │ │
│  │  Use Case:     ClawX desktop app users                    │ │
│  │  Detection:    Check file existence + executable bit      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  System Install (type: 'system')                                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Location:     /opt/homebrew/bin/openclaw (in PATH)      │ │
│  │  UV Location:  /Users/hnam/.local/bin/uv (optional)      │ │
│  │  Command:      openclaw gateway                           │ │
│  │  Config:       ~/.openclaw/openclaw.json                  │ │
│  │  Use Case:     npm/Homebrew install users                 │ │
│  │  Detection:    which openclaw                             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
                    start() called
                          ↓
                  Try detectInstallation()
                          ↓
                    ┌─────┴─────┐
                    │           │
                SUCCESS      EXCEPTION
                    │           │
                    ↓           ↓
        ┌──────────────────┐  ┌──────────────────┐
        │  Proceed with    │  │  Catch error     │
        │  spawn logic     │  │                  │
        │                  │  │  Return:         │
        │  Check if        │  │  {               │
        │  already running │  │    error:        │
        │                  │  │    "OpenClaw not │
        │  Spawn process   │  │     found..."    │
        │                  │  │  }               │
        │  Wait 3 seconds  │  │                  │
        │                  │  │  User sees clear │
        │  Verify running  │  │  instructions    │
        └──────────────────┘  └──────────────────┘
                    │
                    ↓
            ┌───────┴───────┐
            │               │
        RUNNING         NOT RUNNING
            │               │
            ↓               ↓
    ┌──────────────┐  ┌──────────────┐
    │  Success     │  │  Error       │
    │  {           │  │  {           │
    │    success:  │  │    error:    │
    │    true,     │  │    "Failed   │
    │    pid: XXX, │  │     to start"│
    │    type: ... │  │  }           │
    │  }           │  │              │
    └──────────────┘  └──────────────┘
```

## Backward Compatibility Guarantee

```
┌─────────────────────────────────────────────────────────────────┐
│                    Backward Compatibility                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Existing ClawX Bundle Users                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Before Fix:  ✅ Works (uv run openclaw gateway)          │ │
│  │  After Fix:   ✅ Still works (detected as 'bundle')       │ │
│  │  Migration:   ❌ Not required                             │ │
│  │  Risk:        🟢 Zero - checked first in detection       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  New System Install Users                                       │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Before Fix:  ❌ Fails (not found)                        │ │
│  │  After Fix:   ✅ Works (detected as 'system')            │ │
│  │  Migration:   ❌ Not required                             │ │
│  │  Risk:        🟢 Zero - new functionality                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  API Consumers                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Before Fix:  Returns status without installation info   │ │
│  │  After Fix:   Returns status WITH installation info      │ │
│  │  Breaking:    ❌ No - only adds new fields               │ │
│  │  Risk:        🟢 Zero - additive change only             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Testing Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                         Test Scenarios                          │
├──────────────┬──────────────────┬──────────────────────────────┤
│  Scenario    │  Expected Result │  Verification                │
├──────────────┼──────────────────┼──────────────────────────────┤
│  ClawX       │  type: 'bundle'  │  Spawns: uv run openclaw     │
│  Bundle      │  Starts OK       │  Process running             │
│  Exists      │                  │  Config from ~/.openclaw     │
├──────────────┼──────────────────┼──────────────────────────────┤
│  System      │  type: 'system'  │  Spawns: openclaw gateway    │
│  Install     │  Starts OK       │  Process running             │
│  (npm/brew)  │                  │  Config from ~/.openclaw     │
├──────────────┼──────────────────┼──────────────────────────────┤
│  Both        │  type: 'bundle'  │  Bundle takes priority       │
│  Exist       │  Uses bundle     │  Backward compatibility      │
├──────────────┼──────────────────┼──────────────────────────────┤
│  Neither     │  Error message   │  Clear install instructions  │
│  Exists      │  with help       │  No crash                    │
├──────────────┼──────────────────┼──────────────────────────────┤
│  Already     │  Error:          │  No duplicate process        │
│  Running     │  "already        │  Existing process preserved  │
│              │   running"       │                              │
├──────────────┼──────────────────┼──────────────────────────────┤
│  Diagnostics │  Full system     │  All fields populated        │
│  Endpoint    │  info returned   │  Installation detected       │
└──────────────┴──────────────────┴──────────────────────────────┘
```

## Implementation Timeline

```
Day 1 - Implementation (3 hours)
├─ Hour 1: Core detection logic
│  ├─ Add detectInstallation() method
│  ├─ Update getOpenClawCommand()
│  └─ Test detection with current system
│
├─ Hour 2: Start method rewrite
│  ├─ Update start() method
│  ├─ Add spawn logic for both types
│  └─ Test starting with system install
│
└─ Hour 3: Diagnostics & API
   ├─ Add getDiagnostics() method
   ├─ Update API endpoints
   └─ Test all endpoints

Day 1 - Testing (1 hour)
├─ Test system install (current setup)
├─ Test error cases
├─ Test diagnostics endpoint
└─ Verify backward compatibility

Day 1 - Documentation (30 minutes)
├─ Update README.md
├─ Update DEPLOYMENT.md
└─ Add troubleshooting guide

Total: ~4.5 hours
```

## Success Criteria Checklist

```
✓ Detection Logic
  ☐ Detects ClawX bundle correctly
  ☐ Detects system install correctly
  ☐ Prioritizes bundle over system (backward compat)
  ☐ Provides clear error when neither found

✓ Start Functionality
  ☐ Starts ClawX bundle with: uv run openclaw gateway
  ☐ Starts system install with: openclaw gateway
  ☐ Prevents duplicate processes
  ☐ Returns installation info in response

✓ API Endpoints
  ☐ /status includes installation field
  ☐ /diagnostics returns complete info
  ☐ No breaking changes to existing endpoints
  ☐ Error responses are clear and helpful

✓ Error Handling
  ☐ Clear error when OpenClaw not found
  ☐ Clear error when already running
  ☐ Spawn errors logged properly
  ☐ Diagnostics help troubleshooting

✓ Backward Compatibility
  ☐ ClawX bundle users unaffected
  ☐ Existing API consumers work
  ☐ No database migrations needed
  ☐ Configuration preserved

✓ Documentation
  ☐ README updated with install methods
  ☐ DEPLOYMENT updated with troubleshooting
  ☐ Code comments clear and helpful
  ☐ Implementation plan documented
```

## Risk Mitigation

```
Risk Level: 🟢 LOW

Reasons:
├─ Backward compatible (ClawX bundle checked first)
├─ No breaking API changes (only adds fields)
├─ No database changes
├─ Easy rollback (restore backup file)
├─ Comprehensive error handling
└─ Detailed logging for troubleshooting

Rollback Plan:
├─ Keep backup: ProcessManager.js.backup
├─ If issues: cp backup to original
├─ Restart service: systemctl restart openclaw-web
└─ Time to rollback: < 1 minute
```
