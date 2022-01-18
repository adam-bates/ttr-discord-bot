module.exports = {
  name: "ready",
  once: true,
  execute: async (client) => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
  },
};
