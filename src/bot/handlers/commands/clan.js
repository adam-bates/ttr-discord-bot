module.exports = {
  disabled: true,

  builder: (command) =>
    command
      .setName("clan")
      .setDescription("Get information about the clan")
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

    const content = `**The Last Citadel** (a.k.a TLC)

TODO
`;

    await interaction.reply({ content, ephemeral: !isPublic });
  },
};
