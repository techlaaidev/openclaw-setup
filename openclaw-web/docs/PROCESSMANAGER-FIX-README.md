# ProcessManager Fix Documentation

This directory contains comprehensive documentation for fixing the ProcessManager to support both ClawX bundle and system-installed OpenClaw.

## Quick Navigation

### 🚀 Getting Started
- **Start Here**: [PROCESSMANAGER-FIX-INDEX.md](PROCESSMANAGER-FIX-INDEX.md) - Complete overview and navigation guide
- **Quick Reference**: [PROCESSMANAGER-FIX-SUMMARY.md](PROCESSMANAGER-FIX-SUMMARY.md) - TL;DR version with key points

### 📋 Implementation
- **Step-by-Step**: [PROCESSMANAGER-FIX-CHECKLIST.md](PROCESSMANAGER-FIX-CHECKLIST.md) - Detailed implementation checklist
- **Code Changes**: [PROCESSMANAGER-FIX-CODE-PREVIEW.md](PROCESSMANAGER-FIX-CODE-PREVIEW.md) - Before/after code comparison
- **Full Plan**: [PROCESSMANAGER-FIX-PLAN.md](PROCESSMANAGER-FIX-PLAN.md) - Complete implementation plan

### 📊 Visual Guides
- **Flow Diagrams**: [PROCESSMANAGER-FIX-FLOWCHART.md](PROCESSMANAGER-FIX-FLOWCHART.md) - Visual flow diagrams and decision trees

## Document Purpose

| Document | Purpose | Audience |
|----------|---------|----------|
| **INDEX** | Overview and navigation | Everyone |
| **SUMMARY** | Quick reference guide | Developers, Support |
| **PLAN** | Detailed implementation plan | Implementers, Reviewers |
| **CODE-PREVIEW** | Exact code changes | Developers |
| **CHECKLIST** | Step-by-step implementation | Implementers |
| **FLOWCHART** | Visual diagrams | Reviewers, Architects |

## Problem Summary

ProcessManager currently only supports ClawX bundle structure, but the system has OpenClaw installed via npm. This fix adds detection logic to support both installation methods.

### Current State
```
❌ System install: /opt/homebrew/bin/openclaw (NOT DETECTED)
✅ ClawX bundle: ~/.openclaw/openclaw (EXPECTED but not present)
```

### After Fix
```
✅ System install: /opt/homebrew/bin/openclaw (DETECTED)
✅ ClawX bundle: ~/.openclaw/openclaw (STILL SUPPORTED)
```

## Key Features

- ✅ **Dual Installation Support** - Works with both ClawX bundle and system install
- ✅ **Backward Compatible** - Existing ClawX users unaffected
- ✅ **Auto-Detection** - Automatically detects which installation is available
- ✅ **Better Errors** - Clear error messages with installation instructions
- ✅ **Diagnostics** - New endpoint for troubleshooting
- ✅ **Low Risk** - Easy rollback, no breaking changes

## Implementation Overview

### Files Modified
1. `src/services/ProcessManager.js` - Core detection and spawn logic
2. `src/api/process.js` - API endpoint updates

### New Methods
- `detectInstallation()` - Detect installation type
- `getDiagnostics()` - Comprehensive system diagnostics

### New Endpoints
- `GET /api/process/diagnostics` - System diagnostic information

### Modified Methods
- `getOpenClawCommand()` - Now async, returns installation config
- `start()` - Conditional spawn based on installation type

## Quick Start

### For Implementers
1. Read [PROCESSMANAGER-FIX-INDEX.md](PROCESSMANAGER-FIX-INDEX.md) for overview
2. Review [PROCESSMANAGER-FIX-CODE-PREVIEW.md](PROCESSMANAGER-FIX-CODE-PREVIEW.md) for exact changes
3. Follow [PROCESSMANAGER-FIX-CHECKLIST.md](PROCESSMANAGER-FIX-CHECKLIST.md) step-by-step
4. Reference [PROCESSMANAGER-FIX-PLAN.md](PROCESSMANAGER-FIX-PLAN.md) for details

### For Reviewers
1. Read [PROCESSMANAGER-FIX-INDEX.md](PROCESSMANAGER-FIX-INDEX.md) for overview
2. Review [PROCESSMANAGER-FIX-FLOWCHART.md](PROCESSMANAGER-FIX-FLOWCHART.md) for visual understanding
3. Check [PROCESSMANAGER-FIX-CODE-PREVIEW.md](PROCESSMANAGER-FIX-CODE-PREVIEW.md) for code quality
4. Verify [PROCESSMANAGER-FIX-CHECKLIST.md](PROCESSMANAGER-FIX-CHECKLIST.md) completeness

### For Troubleshooters
1. Check [PROCESSMANAGER-FIX-SUMMARY.md](PROCESSMANAGER-FIX-SUMMARY.md) for quick reference
2. Use diagnostics: `curl http://localhost:3000/api/process/diagnostics`
3. Review server logs for detection messages
4. Reference [PROCESSMANAGER-FIX-PLAN.md](PROCESSMANAGER-FIX-PLAN.md) for troubleshooting

## Estimated Timeline

- **Implementation**: 2-3 hours
- **Testing**: 1 hour
- **Documentation**: 30 minutes
- **Total**: ~4 hours

## Risk Assessment

**Risk Level**: 🟢 LOW

- Backward compatible
- No breaking changes
- Easy rollback
- Comprehensive testing
- Detailed documentation

## Success Criteria

- ✓ System-installed OpenClaw detected and starts correctly
- ✓ ClawX bundle continues to work (backward compatible)
- ✓ Clear error messages when OpenClaw not found
- ✓ Diagnostics endpoint provides useful information
- ✓ No breaking API changes
- ✓ All tests pass

## Testing

### Quick Test Commands
```bash
# Check diagnostics
curl http://localhost:3000/api/process/diagnostics | jq

# Start OpenClaw
curl -X POST http://localhost:3000/api/process/start

# Check status
curl http://localhost:3000/api/process/status | jq

# Stop OpenClaw
curl -X POST http://localhost:3000/api/process/stop
```

## Rollback Plan

If issues occur:
```bash
# Restore backups
cp src/services/ProcessManager.js.backup src/services/ProcessManager.js
cp src/api/process.js.backup src/api/process.js

# Restart service
sudo systemctl restart openclaw-web

# Time to rollback: < 1 minute
```

## Support

### Common Issues

**Issue**: OpenClaw not detected
**Solution**: Check diagnostics endpoint, verify OpenClaw is in PATH

**Issue**: Process fails to start
**Solution**: Check server logs for spawn errors, verify permissions

**Issue**: Already running error
**Solution**: Stop existing process: `pkill -f openclaw`

### Diagnostic Commands
```bash
# Check OpenClaw installation
which openclaw
openclaw --version

# Check if running
pgrep -f openclaw

# Check diagnostics
curl http://localhost:3000/api/process/diagnostics | jq

# View logs
curl http://localhost:3000/api/process/logs?lines=50
```

## Related Documentation

- [ClawX Comparison](CLAWX-COMPARISON.md) - Feature comparison with ClawX
- [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions
- [Roadmap](ROADMAP-TO-CLAWX-PARITY.md) - Future development plans

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-23 | Initial documentation created |

## Contributing

When implementing this fix:
1. Follow the checklist exactly
2. Test thoroughly before deploying
3. Document any issues encountered
4. Update this documentation if needed

## License

Same as parent project (MIT)

## Contact

For questions or issues:
- Review the documentation files
- Check diagnostics endpoint
- Review server logs
- Consult implementation plan

---

**Status**: Ready for Implementation
**Last Updated**: 2026-02-23
**Estimated Effort**: 4 hours
**Risk Level**: LOW
