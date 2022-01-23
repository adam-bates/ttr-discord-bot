module.exports = {
  builder: (command) =>
    command
      .setName("getroles")
      .setDescription("Get the roles assigned at each level")
      .addIntegerOption((option) =>
        option.setName("level").setDescription("Specfic level to look up")
      )
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
