module.exports = {
  apps: [
    {
      name: 'cipherchat-server',
      script: './server.js',
      instances: 'max', // Utilizes all available CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
