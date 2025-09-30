module.exports = {
  apps: [
    {
      name: 'gacp-certification-system',
      script: 'app.js',
      cwd: './',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      
      // Environment configuration
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },

      // Performance settings
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      
      // Logging
      log_file: './logs/gacp-system.log',
      out_file: './logs/gacp-system-out.log',
      error_file: './logs/gacp-system-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Advanced settings
      watch: false, // Disable in production
      ignore_watch: ['node_modules', 'logs', 'uploads', 'certificates'],
      watch_options: {
        followSymlinks: false
      },
      
      // Auto restart settings
      autorestart: true,
      restart_delay: 4000,
      
      // Performance monitoring
      pmx: true,
      
      // Source map support
      source_map_support: true,
      
      // Process management
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Health check
      health_check_url: 'http://localhost:3000/health',
      health_check_grace_period: 30000,
      
      // Advanced process management
      exp_backoff_restart_delay: 100,
      
      // Additional options
      node_args: [
        '--max-old-space-size=1024',
        '--optimize-for-size'
      ]
    },
    
    // Separate worker process for background tasks
    {
      name: 'gacp-worker',
      script: 'worker.js',
      cwd: './',
      instances: 2,
      exec_mode: 'cluster',
      
      env: {
        NODE_ENV: 'development',
        WORKER_TYPE: 'background'
      },
      env_staging: {
        NODE_ENV: 'staging',
        WORKER_TYPE: 'background'
      },
      env_production: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'background'
      },
      
      max_memory_restart: '512M',
      min_uptime: '10s',
      max_restarts: 10,
      
      log_file: './logs/gacp-worker.log',
      out_file: './logs/gacp-worker-out.log',
      error_file: './logs/gacp-worker-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      autorestart: true,
      restart_delay: 4000,
      
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads', 'certificates'],
      
      kill_timeout: 5000,
      wait_ready: true,
      
      node_args: [
        '--max-old-space-size=512',
        '--optimize-for-size'
      ]
    }
  ],

  // Deployment configuration
  deploy: {
    staging: {
      user: 'deploy',
      host: ['staging.gacp.doa.go.th'],
      ref: 'origin/develop',
      repo: 'https://github.com/jonmaxmore/gacp-certify-flow.git',
      path: '/var/www/gacp-staging',
      'post-deploy': 'npm install && npm run certificates:setup && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': 'apt update && apt install git -y',
      ssh_options: 'StrictHostKeyChecking=no'
    },
    
    production: {
      user: 'deploy',
      host: ['gacp.doa.go.th'],
      ref: 'origin/main',
      repo: 'https://github.com/jonmaxmore/gacp-certify-flow.git',
      path: '/var/www/gacp-production',
      'post-deploy': 'npm install --production && npm run certificates:setup && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install git -y',
      ssh_options: 'StrictHostKeyChecking=no'
    }
  }
};