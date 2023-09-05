module.exports = {
  disabled: true,

  builder: (command) => command.setName("test").setDescription(process.env.COMMAND_NAME.toUpperCase() + "!"),

  execute: async (_, interaction) => {
    const message = await interaction.reply({
      content: "Hello world!",
      fetchReply: true,
    });

    message.react("😄");
  },
};
