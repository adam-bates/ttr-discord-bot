module.exports = {
  disabled: true,

  builder: (command) =>
    command
      .setName("members")
      .setDescription("Gets clan information for all members")
      .addStringOption((option) =>
        option
          .setName("output")
          .setDescription("Format and presentation of data")
          .addChoice("Image", "png")
          .addChoice("CSV", "csv")
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
