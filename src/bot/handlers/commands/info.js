module.exports = {
  disabled: true,

  builder: (command) =>
    command
      .setName("info")
      .setDescription("TODO")
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
