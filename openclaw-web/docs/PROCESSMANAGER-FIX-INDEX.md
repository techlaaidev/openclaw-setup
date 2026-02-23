# ProcessManager Fix - Complete Implementation Plan

**Date**: 2026-02-23
**Status**: Ready for Implementation
**Risk Level**: LOW (Backward Compatible)
**Estimated Time**: 4 hours

---

## Executive Summary

The ProcessManager currently only supports ClawX bundle structure (`~/.openclaw/openclaw` and `~/.openclaw/uv`), but the system has OpenClaw installed via npm at `/opt/homebrew/bin/openclaw`. This fix adds detection logic to support both installation methods while maintaining full backward compatibility.

### Key Changes
- Add installation type detection (ClawX bundle vs system install)
- Update spawn command based on installation type
- Add diagnostics endpoint for troubleshooting
- Maintain 100% backward compatibility

### Impact
- **Users Affected**: System install users (currently broken) → will work
- **ClawX Bundle Users**: No impact (backward compatible)
- **API Changes**: Additive only (no breaking changes)
- **Risk**: LOW (easy rollback, comprehensive testing)

---

## Problem Statement

### Current Behavior
```
ProcessManager expects:
  ~/.openclaw/openclaw  ← Not found
  ~/.openclaw/uv        ← Not found

Spawn command:
  uv run openclaw gateway  ← Fails (uv/openclaw not in expected location)

Result:
  Error: "OpenClaw not found. Please install OpenClaw first."
```

### Actual System State
```
OpenClaw location:
  /opt/homebrew/bin/openclaw  ← Installed via npm, in PATH

UV location:
  /Users/hnam/.local/bin/uv   ← In PATH

Config location:
  ~/.openclaw/openclaw.json   ← Exists (config only, no binaries)

Required command:
  openclaw gateway  ← Direct execution (no uv wrapper needed)
```

### Root Cause
ProcessManager was designed exclusively for ClawX desktop app which bundles OpenClaw and UV together. It doesn't check PATH for system-installed executables.

---

## Solution Overview

### Detection Strategy
1. **Check ClawX bundle first** (backward compatibility)
   - Look for `~/.openclaw/openclaw` and `~/.openclaw/uv`
   - If both exist and are executable → use bundle

2. **Check system installation** (new functionality)
   - Run `which openclaw` to find in PATH
   - If found → use system install

3. **Neither found** (error case)
   - Throw clear error with installation instructions

### Spawn Command Logic
```javascript
if (type === 'bundle') {
  spawn(uvPath, ['run', 'openclaw', 'gateway'])
} else if (type === 'system') {
  spawn(openclawPath, ['gateway'])
}
```

### Backward Compatibility
- ClawX bundle checked **first** (priority)
- No changes to existing API structure
- Only **adds** new fields to responses
- No database changes
- No configuration changes

---

## Implementation Plan

### Phase 1: Core Detection Logic (60 min)
**Files**: `src/services/ProcessManager.js`

1. Add `detectInstallation()` method
   - Check ClawX bundle first
   - Check system install second
   - Throw error if neither found

2. Update `getOpenClawCommand()` method
   - Make async
   - Call `detectInstallation()`
   - Return installation config

3. Test detection with current system

### Phase 2: Update Start Method (60 min)
**Files**: `src/services/ProcessManager.js`

1. Rewrite `start()` method
   - Get installation config
   - Add logging for detected type
   - Conditional spawn logic (bundle vs system)
   - Return installation info in response

2. Test starting with system install
3. Test stopping and restarting

### Phase 3: Add Diagnostics (30 min)
**Files**: `src/services/ProcessManager.js`, `src/api/process.js`

1. Add `getDiagnostics()` method
   - Collect system information
   - Installation detection
   - PATH check
   - Process check
   - Config check

2. Update `/api/process/status` endpoint
   - Add installation field to response

3. Add `/api/process/diagnostics` endpoint
   - Return comprehensive diagnostic info

### Phase 4: Comprehensive Testing (60 min)
1. Test system installation (current setup)
2. Test already running scenario
3. Test error cases (not found)
4. Test restart functionality
5. Test backward compatibility (if ClawX available)

### Phase 5: Documentation (30 min)
1. Update README.md with installation methods
2. Update DEPLOYMENT.md with troubleshooting
3. Add code comments and JSDoc

### Phase 6: Final Verification (30 min)
1. Code review
2. Integration test
3. Performance check

---

## Technical Details

### New Methods

#### detectInstallation()
```javascript
async detectInstallation() {
  // Returns: { type, openclawPath, uvPath, inPath }
  // type: 'bundle' | 'system'
  // Throws error if neither found
}
```

#### getDiagnostics()
```javascript
async getDiagnostics() {
  // Returns comprehensive system info:
  // - Platform, arch, Node version
  // - Installation detection result
  // - PATH check
  // - Process status
  // - Config file status
}
```

### Modified Methods

#### getOpenClawCommand()
```javascript
// BEFORE: Synchronous, returns bundle paths only
getOpenClawCommand() {
  return { uvPath, openclawPath };
}

// AFTER: Async, returns detected installation
async getOpenClawCommand() {
  const installation = await this.detectInstallation();
  return { type, openclawPath, uvPath, inPath };
}
```

#### start()
```javascript
// BEFORE: Always spawns "uv run openclaw gateway"
spawn(uvPath, ['run', 'openclaw', 'gateway'])

// AFTER: Conditional spawn based on type
if (type === 'bundle') {
  spawn(uvPath, ['run', 'openclaw', 'gateway'])
} else if (type === 'system') {
  spawn(openclawPath, ['gateway'])
}
```

### API Changes

#### GET /api/process/status
**Before**:
```json
{
  "running": true,
  "pid": 12345,
  "cpu": 2.5,
  "memory": 150.23,
  "gatewayConnected": true
}
```

**After** (adds installation field):
```json
{
  "running": true,
  "pid": 12345,
  "cpu": 2.5,
  "memory": 150.23,
  "gatewayConnected": true,
  "installation": {
    "type": "system",
    "openclawPath": "/opt/homebrew/bin/openclaw",
    "uvPath": "/Users/hnam/.local/bin/uv",
    "inPath": true
  }
}
```

#### GET /api/process/diagnostics (NEW)
```json
{
  "timestamp": "2026-02-23T07:04:46.343Z",
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

---

## Testing Strategy

### Test Matrix

| Scenario | Expected Result | Verification |
|----------|----------------|--------------|
| System install exists | Detects as 'system', starts with `openclaw gateway` | Process runs, correct spawn command |
| ClawX bundle exists | Detects as 'bundle', starts with `uv run openclaw gateway` | Process runs, backward compatible |
| Both exist | Uses bundle (priority) | Backward compatibility maintained |
| Neither exists | Clear error with instructions | No crash, helpful message |
| Already running | Error: "already running" | No duplicate process |
| Diagnostics endpoint | Returns full system info | All fields populated |

### Test Commands

```bash
# Test detection
curl http://localhost:3000/api/process/diagnostics | jq '.installation'

# Test start
curl -X POST http://localhost:3000/api/process/start

# Test status
curl http://localhost:3000/api/process/status | jq

# Test stop
curl -X POST http://localhost:3000/api/process/stop

# Test restart
curl -X POST http://localhost:3000/api/process/restart

# Verify process
pgrep -f openclaw
```

---

## Risk Assessment

### Risk Level: LOW

**Reasons**:
- Backward compatible (ClawX bundle checked first)
- No breaking API changes (only adds fields)
- No database changes
- No configuration changes
- Easy rollback (restore backup file)
- Comprehensive error handling
- Detailed logging for troubleshooting

### Mitigation Strategies
1. **Backup files** before implementation
2. **Test thoroughly** with current system
3. **Monitor logs** after deployment
4. **Quick rollback** plan ready (< 1 minute)
5. **Gradual rollout** if multiple servers

### Rollback Plan
```bash
# If issues occur:
cp src/services/ProcessManager.js.backup src/services/ProcessManager.js
cp src/api/process.js.backup src/api/process.js
sudo systemctl restart openclaw-web
# Time: < 1 minute
```

---

## Success Criteria

### Must Have (Critical)
- ✓ System-installed OpenClaw detected correctly
- ✓ OpenClaw starts with correct command
- ✓ Process runs without errors
- ✓ Stop/restart functionality works
- ✓ Backward compatible with ClawX bundle
- ✓ No breaking API changes

### Should Have (Important)
- ✓ Status endpoint includes installation info
- ✓ Diagnostics endpoint provides useful info
- ✓ Clear error messages when OpenClaw not found
- ✓ Comprehensive logging

### Nice to Have (Optional)
- ✓ Documentation updated
- ✓ Code comments clear
- ✓ Performance metrics unchanged

---

## Timeline

### Estimated: 4 hours
- Pre-implementation: 15 min
- Phase 1 (Detection): 60 min
- Phase 2 (Start method): 60 min
- Phase 3 (Diagnostics): 30 min
- Phase 4 (Testing): 60 min
- Phase 5 (Documentation): 30 min
- Phase 6 (Verification): 30 min
- Post-implementation: 15 min

### Recommended Schedule
- **Day 1, Morning**: Implementation (Phases 1-3)
- **Day 1, Afternoon**: Testing & Documentation (Phases 4-6)
- **Day 1, Evening**: Deploy to staging
- **Day 2, Morning**: Monitor staging, deploy to production

---

## Documentation

### Files Created
1. **PROCESSMANAGER-FIX-PLAN.md** - Complete implementation plan with detailed code changes
2. **PROCESSMANAGER-FIX-SUMMARY.md** - Quick reference guide
3. **PROCESSMANAGER-FIX-CODE-PREVIEW.md** - Code changes with before/after comparison
4. **PROCESSMANAGER-FIX-FLOWCHART.md** - Visual flow diagrams
5. **PROCESSMANAGER-FIX-CHECKLIST.md** - Step-by-step implementation checklist
6. **PROCESSMANAGER-FIX-INDEX.md** - This file (overview and navigation)

### Files to Update
1. **README.md** - Add installation methods section
2. **DEPLOYMENT.md** - Add troubleshooting section
3. **src/services/ProcessManager.js** - Core implementation
4. **src/api/process.js** - API endpoint updates

---

## Quick Start

### For Implementer
1. Read this file (overview)
2. Review **PROCESSMANAGER-FIX-CODE-PREVIEW.md** (see exact code changes)
3. Follow **PROCESSMANAGER-FIX-CHECKLIST.md** (step-by-step)
4. Reference **PROCESSMANAGER-FIX-PLAN.md** (detailed explanations)

### For Reviewer
1. Read this file (overview)
2. Review **PROCESSMANAGER-FIX-FLOWCHART.md** (visual understanding)
3. Check **PROCESSMANAGER-FIX-CODE-PREVIEW.md** (code changes)
4. Verify **PROCESSMANAGER-FIX-CHECKLIST.md** (all steps completed)

### For Troubleshooter
1. Check **PROCESSMANAGER-FIX-SUMMARY.md** (quick reference)
2. Use diagnostics endpoint: `curl http://localhost:3000/api/process/diagnostics`
3. Review logs for detection messages
4. Reference **PROCESSMANAGER-FIX-PLAN.md** (detailed troubleshooting)

---

## Key Decisions

### Why Check ClawX Bundle First?
**Decision**: Check ClawX bundle before system install
**Reason**: Backward compatibility - existing ClawX users must not be affected
**Impact**: Zero risk for existing users

### Why Not Use UV for System Install?
**Decision**: System install uses `openclaw gateway` directly (no UV wrapper)
**Reason**: System-installed OpenClaw doesn't need UV wrapper, it's self-contained
**Impact**: Simpler, more direct execution

### Why Add Diagnostics Endpoint?
**Decision**: Add comprehensive diagnostics endpoint
**Reason**: Troubleshooting installation issues requires system information
**Impact**: Better support, faster issue resolution

### Why Not Require Migration?
**Decision**: No migration required for any users
**Reason**: Backward compatible, auto-detection handles both cases
**Impact**: Zero downtime, seamless upgrade

---

## Contact & Support

### Implementation Questions
- See: **PROCESSMANAGER-FIX-PLAN.md** (detailed explanations)
- See: **PROCESSMANAGER-FIX-CODE-PREVIEW.md** (exact code)

### Testing Questions
- See: **PROCESSMANAGER-FIX-CHECKLIST.md** (test procedures)
- See: **PROCESSMANAGER-FIX-FLOWCHART.md** (test scenarios)

### Troubleshooting
- Use: `curl http://localhost:3000/api/process/diagnostics`
- See: **PROCESSMANAGER-FIX-SUMMARY.md** (quick reference)
- Check: Server logs for detection messages

---

## Next Steps

1. **Review** this implementation plan
2. **Approve** the approach
3. **Schedule** implementation (4 hours)
4. **Backup** current files
5. **Implement** following checklist
6. **Test** thoroughly
7. **Deploy** to staging
8. **Monitor** for 24 hours
9. **Deploy** to production
10. **Document** any issues encountered

---

## Appendix

### Current System Information
- **OpenClaw Version**: 2026.1.30
- **OpenClaw Location**: /opt/homebrew/bin/openclaw
- **UV Location**: /Users/hnam/.local/bin/uv
- **Config Location**: ~/.openclaw/openclaw.json
- **Platform**: macOS (Darwin 25.2.0)
- **Architecture**: arm64

### Related Files
- **ProcessManager**: src/services/ProcessManager.js
- **Process API**: src/api/process.js
- **Server**: src/server.js
- **Config**: .env, config/

### Related Documentation
- **ClawX Comparison**: docs/CLAWX-COMPARISON.md
- **Deployment Guide**: docs/DEPLOYMENT.md
- **Roadmap**: docs/ROADMAP-TO-CLAWX-PARITY.md

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-23 | Initial implementation plan created |

---

## Sign-off

**Plan Created By**: Claude (AI Assistant)
**Date**: 2026-02-23
**Status**: Ready for Implementation

**To Be Implemented By**: _________________
**Implementation Date**: _________________

**To Be Reviewed By**: _________________
**Review Date**: _________________

**Approved By**: _________________
**Approval Date**: _________________

---

## Summary

This implementation plan provides a comprehensive solution to support both ClawX bundle and system-installed OpenClaw. The fix is:

- ✅ **Backward Compatible** - ClawX bundle users unaffected
- ✅ **Low Risk** - Easy rollback, no breaking changes
- ✅ **Well Tested** - Comprehensive test strategy
- ✅ **Well Documented** - Multiple documentation files
- ✅ **Production Ready** - Clear implementation path

**Estimated Time**: 4 hours
**Risk Level**: LOW
**Recommendation**: Proceed with implementation
