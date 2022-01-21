module.exports = {
  builder: (command) => command.setName("test").setDescription("TLC!"),

  execute: async (_, interaction) => {
    const message = await interaction.reply({
      content: "Hello world!",
      fetchReply: true,
    });

    message.react("😄");
  },
};
