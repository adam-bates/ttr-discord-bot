const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tlc-getrsn")
    .setDescription("Gets RSN for a Discord user")
    .addUserOption((option) =>
      option
        .setName("Target")
        .setDescription("Discord user to get RSN for")
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("Public")
        .setDescription("Make the output of this command public to the server")
        .setRequired(false)
    ),

  execute: async ({ redis }, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    const user = interaction.options.getUser("target") || interaction.user;

    const rsn = await redis.getRsnByUserId(user.id);

    if (rsn) {
      await interaction.reply({
        content: `${user} is assigned to RSN: ${rsn}`,
        ephemeral: !isPublic,
      });
    } else {
      await interaction.reply({
        content: `${user} has no assigned RSN.`,
        ephemeral: !isPublic,
      });
    }
  },
};
