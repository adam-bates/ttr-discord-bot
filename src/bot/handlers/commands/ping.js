module.exports = {
  builder: (command) =>
    command
      .setName("ping")
      .setDescription("Replies with Pong!")
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

    await interaction.reply({ content: "Pong!", ephemeral: !isPublic });
  },
};
