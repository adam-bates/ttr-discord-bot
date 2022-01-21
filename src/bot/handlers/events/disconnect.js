module.exports = {
  name: "disconnect",
  once: true,
  execute: async ({ redis, browser }) => {
    await redis.disconnect();
    await browser.close();
  },
};
