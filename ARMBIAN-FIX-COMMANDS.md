# Quick Commands for Armbian Device

## Apply the Frontend Fix

Copy and paste these commands into your Armbian device terminal:

```bash
# Step 1: Navigate to installation directory
cd /opt/openclaw-web

# Step 2: Pull latest changes (includes the update script)
sudo git pull

# Step 3: Make update script executable
sudo chmod +x scripts/update-frontend.sh

# Step 4: Run the update script
sudo ./scripts/update-frontend.sh
```

That's it! The script will:
- Install frontend dependencies
- Build the React application
- Set correct permissions
- Restart the service
- Verify it's working

## Expected Output

You should see:
```
==========================================
OpenClaw Web - Frontend Update
==========================================

Step 1: Building frontend...
Installing frontend dependencies...
Building React application...

Step 2: Restarting service...
✓ Service restarted successfully

==========================================
Frontend Update Complete!
==========================================

Dashboard is running at:
  - http://192.168.1.18:3000
```

## Verify It Works

```bash
# Check service status
sudo systemctl status openclaw-dashboard

# Test access
curl http://localhost:3000
```

You should see HTML content instead of the error.

## Access Dashboard

Open your browser and go to:
- http://192.168.1.18:3000

Login with:
- Username: `admin`
- Password: `admin123`

**Remember to change the password after first login!**

---

**Time Required:** 2-3 minutes
**Status:** Ready to apply
