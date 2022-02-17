module.exports = {
  disabled: true,

  builder: (command) => command.setName("test").setDescription("TTR!"),

  execute: async (_, interaction) => {
    const message = await interaction.reply({
      content: "Hello world!",
      fetchReply: true,
    });

    message.react("😄");
  },
};
