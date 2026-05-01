module.exports = {
  apps: [
    {
      name: 'edu-connect-backend',
      script: 'server.ts',
      // We use tsx to run typescript files directly
      interpreter: 'node_modules/.bin/tsx',
      instances: 1, // Change to 'max' to use all CPU cores in production
      autorestart: true, // This is what prevents crashes!
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
