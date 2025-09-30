# GACP Certification System - Deployment Guide

## System Overview

The GACP (Good Agricultural and Collection Practices) Certification System is a comprehensive web application for managing agricultural certification processes. This guide covers deployment on various environments.

## Prerequisites

### System Requirements
- **Server**: Linux (Ubuntu 20.04+ recommended)
- **CPU**: Minimum 2 cores, Recommended 4+ cores
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 20GB, Recommended 50GB+
- **Network**: Stable internet connection with ports 80, 443, 3000 accessible

### Software Requirements
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Node.js**: 18+ (for development)
- **Git**: Latest version
- **SSL Certificate**: For production deployment

## Quick Start (Development)

### 1. Clone Repository
```bash
git clone https://github.com/jonmaxmore/gacp-certify-flow.git
cd gacp-certify-flow
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env file with your configuration
nano .env
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Directories
```bash
npm run certificates:setup
```

### 5. Database Migration
```bash
npm run db:migrate
```

### 6. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Docker Deployment

### Development Environment
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Environment
```bash
# Build and start production services
docker-compose -f docker-compose.yml up -d

# Start with monitoring
docker-compose --profile monitoring up -d

# Scale application instances
docker-compose up -d --scale gacp-app=3
```

## Manual Deployment (Production)

### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install PostgreSQL (optional)
sudo apt-get install -y postgresql postgresql-contrib

# Install Redis
sudo apt-get install -y redis-server

# Install Nginx
sudo apt-get install -y nginx
```

### 2. Application Setup
```bash
# Create application directory
sudo mkdir -p /var/www/gacp-production
sudo chown -R $USER:$USER /var/www/gacp-production

# Clone and setup
cd /var/www/gacp-production
git clone https://github.com/jonmaxmore/gacp-certify-flow.git .

# Install dependencies
npm install --production

# Setup environment
cp .env.example .env
# Configure production settings in .env

# Create necessary directories
npm run certificates:setup

# Run database migration
npm run db:migrate
```

### 3. Process Management with PM2
```bash
# Start application with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the instructions provided by the command

# Monitor processes
pm2 monit
```

### 4. Nginx Configuration
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/gacp-system

# Add the following configuration:
```

```nginx
server {
    listen 80;
    server_name gacp.doa.go.th www.gacp.doa.go.th;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name gacp.doa.go.th www.gacp.doa.go.th;

    ssl_certificate /etc/ssl/certs/gacp.doa.go.th.crt;
    ssl_certificate_key /etc/ssl/private/gacp.doa.go.th.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # File upload limits
    client_max_body_size 10M;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /public {
        alias /var/www/gacp-production/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Certificate downloads
    location /certificates {
        alias /var/www/gacp-production/certificates;
        add_header Content-Disposition "attachment";
        add_header X-Content-Type-Options nosniff;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

```bash
# Enable site and restart Nginx
sudo ln -s /etc/nginx/sites-available/gacp-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL Certificate Setup
```bash
# Install Certbot for Let's Encrypt
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d gacp.doa.go.th -d www.gacp.doa.go.th

# Auto-renewal setup
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Database Configuration

### MongoDB Setup
```bash
# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongosh
use admin
db.createUser({
  user: "admin",
  pwd: "secure_password",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
})

use gacp_certification
db.createUser({
  user: "gacp_user",
  pwd: "secure_password",
  roles: ["readWrite"]
})
```

### PostgreSQL Setup (Optional)
```bash
# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE gacp_licenses;
CREATE USER gacp_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE gacp_licenses TO gacp_user;
```

## Environment Variables Configuration

### Required Environment Variables
```bash
# Application
NODE_ENV=production
PORT=3000
BASE_URL=https://gacp.doa.go.th

# Security
JWT_SECRET=your_super_secure_jwt_secret_key_here_min_32_characters
BCRYPT_ROUNDS=12

# Database
MONGODB_URI=mongodb://gacp_user:secure_password@localhost:27017/gacp_certification
PG_HOST=localhost
PG_DATABASE=gacp_licenses
PG_USER=gacp_user
PG_PASSWORD=secure_password

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gacp.doa.go.th
SMTP_PASS=your_app_password

# File Storage
UPLOAD_PATH=/var/www/gacp-production/uploads
CERTIFICATE_PATH=/var/www/gacp-production/certificates
```

## Monitoring and Logging

### PM2 Monitoring
```bash
# View application status
pm2 status

# View logs
pm2 logs gacp-certification-system

# View detailed monitoring
pm2 monit

# Restart application
pm2 restart gacp-certification-system
```

### System Logs
```bash
# Application logs
tail -f /var/www/gacp-production/logs/gacp-system.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

### Performance Monitoring
```bash
# Install monitoring tools
sudo apt-get install -y htop iotop nethogs

# Monitor system resources
htop
iotop
nethogs

# Check disk usage
df -h
du -sh /var/www/gacp-production/*
```

## Backup and Recovery

### Database Backup
```bash
# MongoDB backup
mongodump --host localhost:27017 --db gacp_certification --out /backup/mongodb/$(date +%Y%m%d)

# PostgreSQL backup
pg_dump -h localhost -U gacp_user gacp_licenses > /backup/postgresql/gacp_licenses_$(date +%Y%m%d).sql
```

### File Backup
```bash
# Application files backup
tar -czf /backup/files/gacp_files_$(date +%Y%m%d).tar.gz /var/www/gacp-production/uploads /var/www/gacp-production/certificates
```

### Automated Backup Script
```bash
# Create backup script
sudo nano /usr/local/bin/gacp-backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directories
mkdir -p $BACKUP_DIR/mongodb
mkdir -p $BACKUP_DIR/postgresql
mkdir -p $BACKUP_DIR/files

# MongoDB backup
mongodump --host localhost:27017 --db gacp_certification --out $BACKUP_DIR/mongodb/$DATE

# PostgreSQL backup
pg_dump -h localhost -U gacp_user gacp_licenses > $BACKUP_DIR/postgresql/gacp_licenses_$DATE.sql

# Files backup
tar -czf $BACKUP_DIR/files/gacp_files_$DATE.tar.gz /var/www/gacp-production/uploads /var/www/gacp-production/certificates

# Remove backups older than 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

```bash
# Make script executable
sudo chmod +x /usr/local/bin/gacp-backup.sh

# Schedule daily backups
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/gacp-backup.sh
```

## Security Considerations

### Firewall Configuration
```bash
# Install and configure UFW
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow from trusted_ip to any port 27017  # MongoDB (restrict to trusted IPs)
sudo ufw allow from trusted_ip to any port 5432   # PostgreSQL (restrict to trusted IPs)
```

### Security Hardening
```bash
# Disable password authentication for SSH
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd

# Configure fail2ban
sudo apt-get install -y fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Set up automatic security updates
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Troubleshooting

### Common Issues

1. **Application Won't Start**
   ```bash
   # Check logs
   pm2 logs gacp-certification-system
   
   # Check system resources
   free -h
   df -h
   
   # Restart services
   pm2 restart all
   ```

2. **Database Connection Issues**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Test connections
   mongosh --host localhost:27017
   psql -h localhost -U gacp_user -d gacp_licenses
   ```

3. **File Upload Issues**
   ```bash
   # Check permissions
   ls -la /var/www/gacp-production/uploads
   
   # Fix permissions
   sudo chown -R $USER:$USER /var/www/gacp-production/uploads
   sudo chmod -R 755 /var/www/gacp-production/uploads
   ```

4. **SSL Certificate Issues**
   ```bash
   # Check certificate status
   sudo certbot certificates
   
   # Renew certificates
   sudo certbot renew --dry-run
   ```

### Health Checks
```bash
# Application health
curl -f http://localhost:3000/health

# Database health
mongosh --eval "db.runCommand('ping')"
psql -h localhost -U gacp_user -d gacp_licenses -c "SELECT 1"

# Service health
sudo systemctl status nginx
sudo systemctl status mongod
sudo systemctl status postgresql
```

## Performance Optimization

### Node.js Optimization
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=2048"

# Enable cluster mode in PM2
pm2 start ecosystem.config.js --env production
```

### Database Optimization
```bash
# MongoDB indexing
mongosh gacp_certification
db.applications.createIndex({ "currentStatus": 1, "createdAt": -1 })
db.applications.createIndex({ "applicantInfo.email": 1 })

# PostgreSQL optimization
sudo nano /etc/postgresql/*/main/postgresql.conf
# Adjust: shared_buffers, effective_cache_size, work_mem
```

### Nginx Optimization
```bash
# Enable gzip compression
sudo nano /etc/nginx/nginx.conf
# Add in http block:
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

## Maintenance

### Regular Maintenance Tasks
1. **Daily**: Check application logs and system resources
2. **Weekly**: Review security logs and update dependencies
3. **Monthly**: Update system packages and restart services
4. **Quarterly**: Review and rotate SSL certificates

### Update Procedure
```bash
# Stop application
pm2 stop all

# Backup current version
cp -r /var/www/gacp-production /var/www/gacp-production-backup-$(date +%Y%m%d)

# Pull latest code
cd /var/www/gacp-production
git pull origin main

# Update dependencies
npm install --production

# Run migrations
npm run db:migrate

# Restart application
pm2 restart all

# Verify deployment
curl -f http://localhost:3000/health
```

## Support and Documentation

- **System Documentation**: Available in the `/docs` directory
- **API Documentation**: `http://your-domain/api`
- **Health Dashboard**: `http://your-domain/health`
- **Monitoring**: `http://your-domain:3001` (if Grafana is enabled)

For technical support, please contact the development team or create an issue in the project repository.