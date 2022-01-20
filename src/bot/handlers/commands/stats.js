const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tlc-stats")
    .setDescription("Replies with stats for a player")
    .addIntegerOption((option) =>
      option
        .setName("Activities")
        .setDescription("How many recent activities to include (0 by default)")
        .setMinValue(0)
        .setMaxValue(20)
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("Monthly XP")
        .setDescription("Include past year of Monthly XP gainz")
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("Quests")
        .setDescription("Include Quest data")
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("Public")
        .setDescription("Make the output of this command public to the server")
        .setRequired(false)
    ),

  execute: async (_, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    await interaction.reply({ content: "Pong!", ephemeral: !isPublic });
  },
};
