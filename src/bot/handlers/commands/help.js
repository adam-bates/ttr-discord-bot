module.exports = {
  builder: (command) =>
    command
      .setName("help")
      .setDescription("Replies with info about bot commands")
      .addBooleanOption((option) =>
        option
          .setName("public")
          .setDescription(
            "Make the output of this command public to the server"
          )
          .setRequired(false)
      ),

  execute: async (_, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    await interaction.reply({ content: "TODO", ephemeral: !isPublic });
  },
};
