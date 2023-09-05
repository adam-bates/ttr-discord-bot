module.exports = {
  apps: [
    {
      name: "Serve daa",
      script: "src/index.js",
      args: "-s",
      exp_backoff_restart_delay: 100,
    },
    {
      name: "Cron daa",
      script: "src/cron.js",
      exp_backoff_restart_delay: 100,
    },
  ],
};
