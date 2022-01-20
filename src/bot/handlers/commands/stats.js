const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tlc-stats")
    .setDescription("Replies with stats for a player")
    .addIntegerOption((option) =>
      option
        .setName("activities")
        .setDescription("How many recent activities to include (0 by default)")
        .setMinValue(0)
        .setMaxValue(20)
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("monthly-xp")
        .setDescription("Include past year of Monthly XP gainz")
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("quests")
        .setDescription("Include Quest data")
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("public")
        .setDescription("Make the output of this command public to the server")
        .setRequired(false)
    ),

  execute: async (_, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    await interaction.reply({ content: "Pong!", ephemeral: !isPublic });
  },
};
