# Armbian Deployment Patterns for Web Applications

**Research Date:** 2026-02-23
**Focus:** Node.js web application deployment on ARM-based Armbian systems

## 1. Systemd Service Setup for Node.js Applications

### Basic Service Configuration

Create a systemd service file at `/etc/systemd/system/your-app.service`:

```ini
[Unit]
Description=Node.js Web Application
Documentation=https://your-app-docs.com
After=network.target

[Service]
Type=simple
User=nodejs
Group=nodejs
WorkingDirectory=/opt/your-app
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=your-app

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/your-app/data

[Install]
WantedBy=multi-user.target
```

### Service Management Commands

```bash
# Enable service to start on boot
sudo systemctl enable your-app.service

# Start the service
sudo systemctl start your-app.service

# Check status
sudo systemctl status your-app.service

# View logs
sudo journalctl -u your-app.service -f

# Restart service
sudo systemctl restart your-app.service
```

### Alternative: PM2 with Systemd Integration

PM2 provides process management with automatic restarts and monitoring:

```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start server.js --name your-app

# Generate systemd service
pm2 startup systemd

# Save PM2 process list
pm2 save
```

PM2 benefits:
- Automatic restart on crashes
- Built-in load balancing (cluster mode)
- Log management
- Zero-downtime reloads
- Process monitoring

## 2. Network Configuration for LAN Access

### Static IP Configuration

Armbian typically uses NetworkManager or traditional `/etc/network/interfaces`.

#### Method 1: NetworkManager (nmcli)

```bash
# List connections
nmcli connection show

# Set static IP
nmcli connection modify "Wired connection 1" \
  ipv4.addresses 192.168.1.100/24 \
  ipv4.gateway 192.168.1.1 \
  ipv4.dns "8.8.8.8 8.8.4.4" \
  ipv4.method manual

# Apply changes
nmcli connection up "Wired connection 1"
```

#### Method 2: /etc/network/interfaces

```bash
# Edit /etc/network/interfaces
auto eth0
iface eth0 inet static
    address 192.168.1.100
    netmask 255.255.255.0
    gateway 192.168.1.1
    dns-nameservers 8.8.8.8 8.8.4.4
```

### mDNS/Avahi Configuration

Avahi enables `.local` domain discovery on the network.

```bash
# Install Avahi
sudo apt-get update
sudo apt-get install avahi-daemon avahi-utils

# Enable and start service
sudo systemctl enable avahi-daemon
sudo systemctl start avahi-daemon
```

Configure hostname in `/etc/hostname`:
```
openclaw
```

Configure Avahi in `/etc/avahi/avahi-daemon.conf`:
```ini
[server]
host-name=openclaw
domain-name=local
use-ipv4=yes
use-ipv6=no

[publish]
publish-addresses=yes
publish-hinfo=yes
publish-workstation=yes
publish-domain=yes
```

After configuration, the device will be accessible at `openclaw.local`.

### Custom Service Advertisement

Create `/etc/avahi/services/http.service`:
```xml
<?xml version="1.0" standalone='no'?>
<!DOCTYPE service-group SYSTEM "avahi-service.dtd">
<service-group>
  <name replace-wildcards="yes">%h Web Interface</name>
  <service>
    <type>_http._tcp</type>
    <port>3000</port>
    <txt-record>path=/</txt-record>
  </service>
</service-group>
```

## 3. Auto-Start on Boot Configuration

### Systemd Service Auto-Start

```bash
# Enable service
sudo systemctl enable your-app.service

# Verify enabled services
systemctl list-unit-files | grep enabled | grep your-app
```

### Boot Order Dependencies

Ensure proper startup order in systemd service:

```ini
[Unit]
After=network-online.target
Wants=network-online.target
```

For database dependencies:
```ini
[Unit]
After=network-online.target postgresql.service
Requires=postgresql.service
```

### Delayed Start (if needed)

For services that need extra time after network:

```ini
[Service]
ExecStartPre=/bin/sleep 10
```

### Health Check Script

Create a health check that runs after boot:

```bash
#!/bin/bash
# /usr/local/bin/check-app-health.sh

MAX_RETRIES=30
RETRY_DELAY=2
URL="http://localhost:3000/health"

for i in $(seq 1 $MAX_RETRIES); do
    if curl -f -s "$URL" > /dev/null; then
        echo "Application is healthy"
        exit 0
    fi
    sleep $RETRY_DELAY
done

echo "Application failed to start"
exit 1
```

## 4. Resource Constraints and Optimization for ARM Devices

### Memory Optimization

#### Node.js V8 Flags

For devices with limited RAM (512MB-1GB):

```bash
# In systemd service file
Environment=NODE_OPTIONS="--max-old-space-size=256 --optimize-for-size"
```

For 2GB+ devices:
```bash
Environment=NODE_OPTIONS="--max-old-space-size=512"
```

#### Swap Configuration

Enable swap for memory-constrained devices:

```bash
# Create 1GB swap file
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent in /etc/fstab
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize swappiness for SSD/eMMC
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

### CPU Optimization

#### Process Priority

```ini
[Service]
Nice=10
CPUQuota=50%
```

#### Cluster Mode for Multi-Core ARM

```javascript
// Use PM2 cluster mode
pm2 start server.js -i 2  // 2 instances for dual-core

// Or native Node.js cluster
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < Math.min(numCPUs, 2); i++) {
    cluster.fork();
  }
} else {
  // Worker process
  require('./app');
}
```

### Storage Optimization

#### Log Rotation

Configure journald limits in `/etc/systemd/journald.conf`:

```ini
[Journal]
SystemMaxUse=100M
SystemMaxFileSize=10M
MaxRetentionSec=7day
```

For application logs:

```bash
# Install logrotate
sudo apt-get install logrotate

# Create /etc/logrotate.d/your-app
/var/log/your-app/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 nodejs nodejs
}
```

### Network Optimization

Reduce keep-alive timeouts for limited connections:

```javascript
const server = app.listen(3000);
server.keepAliveTimeout = 30000;
server.headersTimeout = 31000;
```

## 5. Package Management and Dependencies

### System Packages

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Essential build tools
sudo apt-get install -y build-essential git

# Optional: nginx as reverse proxy
sudo apt-get install -y nginx
```

### Node.js Dependency Management

#### Production Installation

```bash
# Install only production dependencies
npm ci --only=production

# Or with npm 9+
npm install --omit=dev
```

#### Minimize Dependencies

```json
{
  "scripts": {
    "prune": "npm prune --production"
  }
}
```

#### Lock File Management

Always commit and deploy with `package-lock.json` for reproducible builds.

### Nginx Reverse Proxy Setup

```nginx
# /etc/nginx/sites-available/your-app
server {
    listen 80;
    server_name openclaw.local;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/your-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 6. Security Hardening for Embedded Devices

### Firewall Configuration (UFW)

```bash
# Install UFW
sudo apt-get install ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change port if needed)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow from local network only
sudo ufw allow from 192.168.1.0/24 to any port 3000

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### User Isolation

```bash
# Create dedicated user
sudo useradd -r -s /bin/false nodejs

# Set ownership
sudo chown -R nodejs:nodejs /opt/your-app

# Restrict permissions
sudo chmod 750 /opt/your-app
```

### Systemd Security Features

Enhanced service file security:

```ini
[Service]
# Prevent privilege escalation
NoNewPrivileges=true

# Filesystem protection
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/your-app/data /opt/your-app/logs
PrivateTmp=true

# Network restrictions
RestrictAddressFamilies=AF_INET AF_INET6

# Capability restrictions
CapabilityBoundingSet=
AmbientCapabilities=

# System call filtering
SystemCallFilter=@system-service
SystemCallErrorNumber=EPERM
```

### SSH Hardening

Edit `/etc/ssh/sshd_config`:

```bash
# Disable root login
PermitRootLogin no

# Use key-based authentication
PasswordAuthentication no
PubkeyAuthentication yes

# Limit users
AllowUsers your-username

# Change default port (optional)
Port 2222
```

### Automatic Security Updates

```bash
# Install unattended-upgrades
sudo apt-get install unattended-upgrades

# Configure in /etc/apt/apt.conf.d/50unattended-upgrades
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
};

# Enable automatic updates
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Fail2Ban for Intrusion Prevention

```bash
# Install fail2ban
sudo apt-get install fail2ban

# Create local config
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit /etc/fail2ban/jail.local
[sshd]
enabled = true
port = 22
maxretry = 3
bantime = 3600

# Start service
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Production Deployment Checklist

### Pre-Deployment

- [ ] System updated: `sudo apt-get update && sudo apt-get upgrade`
- [ ] Node.js installed (LTS version recommended)
- [ ] Application user created with limited privileges
- [ ] Application directory created with proper permissions
- [ ] Environment variables configured
- [ ] Dependencies installed (`npm ci --only=production`)
- [ ] Static IP or mDNS configured
- [ ] Firewall rules configured

### Service Configuration

- [ ] Systemd service file created
- [ ] Service enabled for auto-start: `sudo systemctl enable your-app`
- [ ] Service tested: `sudo systemctl start your-app`
- [ ] Logs verified: `sudo journalctl -u your-app -f`
- [ ] Health check endpoint responding
- [ ] Service survives reboot test

### Network Configuration

- [ ] Static IP assigned (if required)
- [ ] Avahi/mDNS configured for `.local` access
- [ ] Nginx reverse proxy configured (if used)
- [ ] Port forwarding configured (if external access needed)
- [ ] DNS records updated (if using domain)

### Security Hardening

- [ ] UFW firewall enabled and configured
- [ ] SSH hardened (key-only, non-root)
- [ ] Fail2Ban installed and configured
- [ ] Automatic security updates enabled
- [ ] Application running as non-root user
- [ ] Systemd security features enabled
- [ ] Unnecessary services disabled

### Monitoring and Maintenance

- [ ] Log rotation configured
- [ ] Disk space monitoring set up
- [ ] Memory usage monitored
- [ ] CPU temperature monitoring (for ARM devices)
- [ ] Backup strategy implemented
- [ ] Update procedure documented

### Performance Optimization

- [ ] Node.js memory limits configured
- [ ] Swap configured (if needed)
- [ ] Log levels set to production
- [ ] Compression enabled (gzip)
- [ ] Static assets cached
- [ ] Database connections pooled

### Documentation

- [ ] Deployment procedure documented
- [ ] Service restart procedure documented
- [ ] Troubleshooting guide created
- [ ] Network configuration documented
- [ ] Backup/restore procedure documented

## Common Issues and Solutions

### Service Fails to Start

```bash
# Check service status
sudo systemctl status your-app

# View detailed logs
sudo journalctl -u your-app -n 50 --no-pager

# Check permissions
ls -la /opt/your-app

# Verify Node.js path
which node
```

### Network Not Accessible

```bash
# Check if service is listening
sudo netstat -tlnp | grep 3000

# Test locally
curl http://localhost:3000

# Check firewall
sudo ufw status

# Verify Avahi
avahi-browse -a
```

### High Memory Usage

```bash
# Monitor memory
free -h
htop

# Check Node.js process
ps aux | grep node

# Adjust V8 heap size
# Edit systemd service file
Environment=NODE_OPTIONS="--max-old-space-size=256"
```

### Service Crashes on Boot

```bash
# Add delay before start
[Service]
ExecStartPre=/bin/sleep 5

# Or use proper dependencies
[Unit]
After=network-online.target
Wants=network-online.target
```

## Additional Resources

- Armbian Documentation: https://docs.armbian.com/
- Systemd Service Documentation: https://www.freedesktop.org/software/systemd/man/systemd.service.html
- Node.js Production Best Practices: https://nodejs.org/en/docs/guides/
- Avahi Documentation: https://www.avahi.org/
- UFW Documentation: https://help.ubuntu.com/community/UFW

## Summary

Deploying Node.js applications on Armbian requires careful consideration of:

1. **Systemd services** for reliable process management and auto-start
2. **Network configuration** with static IP or mDNS for easy LAN access
3. **Resource optimization** due to ARM device constraints
4. **Security hardening** appropriate for embedded/IoT environments
5. **Monitoring and maintenance** for long-term reliability

The combination of systemd, Avahi, proper security measures, and resource optimization creates a robust deployment suitable for ARM-based embedded systems running Armbian.
