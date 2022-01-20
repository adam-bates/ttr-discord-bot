module.exports = {
  name: "disconnect",
  once: true,
  execute: async ({ redis }) => {
    await redis.disconnect();
  },
};
