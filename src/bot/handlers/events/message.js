module.exports = {
  name: "message",
  execute: async ({ client, ...rest }, message) => {
    // Only listen to bots
    if (!message.author.bot) {
      return;
    }

    console.log(message.author);
  },
};
