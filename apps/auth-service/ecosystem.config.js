module.exports = {
  apps: [
    {
      name: 'auth-service',
      script: 'dist/main.js',
      cwd: './apps/auth-service',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 4718,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4718,
      },
      error_file: './logs/auth-service-error.log',
      out_file: './logs/auth-service-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 3000,
      kill_timeout: 5000,
    },
  ],
};
