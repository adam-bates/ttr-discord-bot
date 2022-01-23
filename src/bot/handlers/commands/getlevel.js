module.exports = {
  builder: (command) =>
    command
      .setName("getlevel")
      .setDescription("Get the MEE6 level that a role is assigned at")
      .addRoleOption((option) =>
        option.setName("role").setDescription("Role").setRequired(false)
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

    const role = interaction.options.getRole("role");

    const roleLevel = await redis.searchForLevelWithRoleId(role.id);

    if (!roleLevel) {
      await interaction.reply({
        content: `${role} is not assigned at any level`,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: `${role} is assigned at level ${roleLevel}`,
      ephemeral: !isPublic,
    });
  },
};
