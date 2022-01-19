const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tlc-ping")
    .setDescription("Replies with Pong!")
    .addBooleanOption((option) =>
      option
        .setName("public")
        .setDescription("Makes the output of this command public to the server")
        .setRequired(false)
    ),

  execute: async (_, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    await interaction.reply({ content: "Pong!", ephemeral: !isPublic });
  },
};
