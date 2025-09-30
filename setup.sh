#!/bin/bash

# GACP Certification System - Automated Setup Script
# This script automates the deployment process for the GACP system

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="gacp-certification-system"
APP_DIR="/var/www/gacp-production"
REPO_URL="https://github.com/jonmaxmore/gacp-certify-flow.git"
NODE_VERSION="18"
BACKUP_DIR="/backup"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should not be run as root for security reasons"
        log_info "Please run as a regular user with sudo privileges"
        exit 1
    fi
}

check_sudo() {
    if ! sudo -n true 2>/dev/null; then
        log_error "This script requires sudo privileges"
        log_info "Please ensure your user has sudo access"
        exit 1
    fi
}

install_node() {
    log_info "Installing Node.js ${NODE_VERSION}..."
    
    # Install Node.js
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Install PM2 globally
    sudo npm install -g pm2
    
    log_success "Node.js and PM2 installed successfully"
}

install_mongodb() {
    log_info "Installing MongoDB..."
    
    # Import MongoDB GPG key
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
    
    # Add MongoDB repository
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    
    # Update package list and install
    sudo apt-get update
    sudo apt-get install -y mongodb-org
    
    # Start and enable MongoDB
    sudo systemctl start mongod
    sudo systemctl enable mongod
    
    log_success "MongoDB installed and started"
}

install_postgresql() {
    log_info "Installing PostgreSQL..."
    
    sudo apt-get install -y postgresql postgresql-contrib
    
    # Start and enable PostgreSQL
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    log_success "PostgreSQL installed and started"
}

install_redis() {
    log_info "Installing Redis..."
    
    sudo apt-get install -y redis-server
    
    # Configure Redis
    sudo sed -i 's/^supervised no/supervised systemd/' /etc/redis/redis.conf
    
    # Start and enable Redis
    sudo systemctl restart redis.service
    sudo systemctl enable redis
    
    log_success "Redis installed and configured"
}

install_nginx() {
    log_info "Installing Nginx..."
    
    sudo apt-get install -y nginx
    
    # Start and enable Nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    log_success "Nginx installed and started"
}

install_docker() {
    log_info "Installing Docker and Docker Compose..."
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    
    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    rm get-docker.sh
    
    log_success "Docker and Docker Compose installed"
    log_warning "Please log out and log back in for Docker group changes to take effect"
}

setup_application() {
    log_info "Setting up application..."
    
    # Create application directory
    sudo mkdir -p $APP_DIR
    sudo chown -R $USER:$USER $APP_DIR
    
    # Clone repository
    if [ -d "$APP_DIR/.git" ]; then
        log_info "Repository already exists, pulling latest changes..."
        cd $APP_DIR
        git pull origin main
    else
        log_info "Cloning repository..."
        git clone $REPO_URL $APP_DIR
        cd $APP_DIR
    fi
    
    # Install dependencies
    log_info "Installing application dependencies..."
    npm install --production
    
    # Setup directories
    log_info "Creating necessary directories..."
    npm run certificates:setup
    
    # Copy environment file
    if [ ! -f ".env" ]; then
        cp .env.example .env
        log_warning "Please configure the .env file with your settings"
    fi
    
    log_success "Application setup completed"
}

setup_database() {
    log_info "Setting up databases..."
    
    cd $APP_DIR
    
    # Generate random passwords
    MONGO_PASSWORD=$(openssl rand -base64 32)
    PG_PASSWORD=$(openssl rand -base64 32)
    
    # Setup MongoDB
    log_info "Configuring MongoDB..."
    mongosh --eval "
    use admin
    db.createUser({
      user: 'admin',
      pwd: '$MONGO_PASSWORD',
      roles: ['userAdminAnyDatabase', 'dbAdminAnyDatabase', 'readWriteAnyDatabase']
    })
    use gacp_certification
    db.createUser({
      user: 'gacp_user',
      pwd: '$MONGO_PASSWORD',
      roles: ['readWrite']
    })
    "
    
    # Setup PostgreSQL
    log_info "Configuring PostgreSQL..."
    sudo -u postgres psql -c "CREATE DATABASE gacp_licenses;"
    sudo -u postgres psql -c "CREATE USER gacp_user WITH PASSWORD '$PG_PASSWORD';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE gacp_licenses TO gacp_user;"
    
    # Update environment file
    sed -i "s/MONGO_PASSWORD=.*/MONGO_PASSWORD=$MONGO_PASSWORD/" .env
    sed -i "s/PG_PASSWORD=.*/PG_PASSWORD=$PG_PASSWORD/" .env
    
    # Run migrations
    log_info "Running database migrations..."
    npm run db:migrate
    
    log_success "Database setup completed"
    log_info "MongoDB password: $MONGO_PASSWORD"
    log_info "PostgreSQL password: $PG_PASSWORD"
    log_warning "Please save these passwords securely!"
}

setup_nginx() {
    log_info "Configuring Nginx..."
    
    # Create Nginx configuration
    sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null <<EOF
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # File upload limits
    client_max_body_size 10M;
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Static files
    location /public {
        alias $APP_DIR/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
EOF
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload Nginx
    sudo nginx -t
    sudo systemctl reload nginx
    
    log_success "Nginx configured successfully"
}

setup_pm2() {
    log_info "Setting up PM2..."
    
    cd $APP_DIR
    
    # Start application with PM2
    pm2 start ecosystem.config.js --env production
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup script
    pm2 startup | grep -E '^sudo' | bash
    
    log_success "PM2 configured successfully"
}

setup_firewall() {
    log_info "Configuring firewall..."
    
    # Install and configure UFW
    sudo ufw --force enable
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow ssh
    sudo ufw allow 80
    sudo ufw allow 443
    
    log_success "Firewall configured"
}

setup_backup() {
    log_info "Setting up backup system..."
    
    # Create backup directory
    sudo mkdir -p $BACKUP_DIR/{mongodb,postgresql,files}
    sudo chown -R $USER:$USER $BACKUP_DIR
    
    # Create backup script
    sudo tee /usr/local/bin/gacp-backup.sh > /dev/null <<'EOF'
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
EOF
    
    sudo chmod +x /usr/local/bin/gacp-backup.sh
    
    # Schedule daily backups
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/gacp-backup.sh") | crontab -
    
    log_success "Backup system configured"
}

install_security_tools() {
    log_info "Installing security tools..."
    
    # Install fail2ban
    sudo apt-get install -y fail2ban
    sudo systemctl enable fail2ban
    sudo systemctl start fail2ban
    
    # Install automatic security updates
    sudo apt-get install -y unattended-upgrades
    echo 'Unattended-Upgrade::Automatic-Reboot "false";' | sudo tee -a /etc/apt/apt.conf.d/50unattended-upgrades
    
    log_success "Security tools installed"
}

show_status() {
    log_info "System Status:"
    echo "=========================="
    
    # Application status
    echo "Application: $(pm2 list | grep -q $APP_NAME && echo "Running" || echo "Stopped")"
    
    # Database status
    echo "MongoDB: $(systemctl is-active mongod)"
    echo "PostgreSQL: $(systemctl is-active postgresql)"
    echo "Redis: $(systemctl is-active redis)"
    
    # Web server status
    echo "Nginx: $(systemctl is-active nginx)"
    
    # Firewall status
    echo "Firewall: $(sudo ufw status | head -n1 | cut -d' ' -f2)"
    
    echo "=========================="
    
    # Application URLs
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")
    echo "Application URL: http://$SERVER_IP"
    echo "Health Check: http://$SERVER_IP/health"
    echo "API Documentation: http://$SERVER_IP/api"
    
    echo "=========================="
    echo "Setup completed successfully!"
    echo "Please review the .env file and restart the application if needed:"
    echo "  cd $APP_DIR"
    echo "  pm2 restart $APP_NAME"
}

# Main execution
main() {
    echo "========================================"
    echo "GACP Certification System Setup"
    echo "========================================"
    
    # Validate environment
    check_root
    check_sudo
    
    # Get deployment type
    echo "Select deployment type:"
    echo "1) Full installation (Node.js, MongoDB, PostgreSQL, Redis, Nginx)"
    echo "2) Docker deployment"
    echo "3) Application only (requires existing services)"
    read -p "Enter choice [1-3]: " DEPLOYMENT_TYPE
    
    case $DEPLOYMENT_TYPE in
        1)
            log_info "Starting full installation..."
            
            # Update system
            log_info "Updating system packages..."
            sudo apt-get update && sudo apt-get upgrade -y
            
            # Install dependencies
            sudo apt-get install -y curl wget git software-properties-common apt-transport-https ca-certificates gnupg lsb-release
            
            # Install services
            install_node
            install_mongodb
            install_postgresql
            install_redis
            install_nginx
            install_security_tools
            
            # Setup application
            setup_application
            setup_database
            setup_nginx
            setup_pm2
            setup_firewall
            setup_backup
            
            show_status
            ;;
        2)
            log_info "Starting Docker deployment..."
            install_docker
            setup_application
            
            log_info "To start with Docker, run:"
            echo "  cd $APP_DIR"
            echo "  cp .env.example .env"
            echo "  # Edit .env file with your configuration"
            echo "  docker-compose up -d"
            ;;
        3)
            log_info "Setting up application only..."
            setup_application
            setup_pm2
            
            log_warning "Please ensure MongoDB, PostgreSQL, and Redis are running"
            log_info "Configure .env file and run: pm2 restart $APP_NAME"
            ;;
        *)
            log_error "Invalid choice"
            exit 1
            ;;
    esac
    
    log_success "Setup script completed!"
}

# Run main function
main "$@"