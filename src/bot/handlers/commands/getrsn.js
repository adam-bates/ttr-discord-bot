module.exports = {
  builder: (command) =>
    command
      .setName("getrsn")
      .setDescription("Get the assigned RSN for a Discord user")
      .addUserOption((option) =>
        option
          .setName("target")
          .setDescription("Discord user")
          .setRequired(false)
      )
      .addBooleanOption((option) =>
        option
          .setName("public")
          .setDescription(
            "Make the output of this command public to the server"
          )
          .setRequired(false)
      ),

  execute: async ({ redis }, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    const user = interaction.options.getUser("target") || interaction.user;

    const rsn = await redis.getRsnByUserId(user.id);

    if (rsn) {
      await interaction.reply({
        content: `${user} is assigned to RSN: ${rsn}.`,
        ephemeral: !isPublic,
      });
    } else {
      await interaction.reply({
        content: `${user} has no assigned RSN.\n\nYou can use the command \`/ttr setrsn\` to assign your Discord user to your Runescape name.`,
        ephemeral: !isPublic,
      });
    }
  },
};
