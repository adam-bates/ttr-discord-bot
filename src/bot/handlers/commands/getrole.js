module.exports = {
  builder: (command) =>
    command
      .setName("getrole")
      .setDescription("Get the role assigned at an MEE6 level")
      .addIntegerOption((option) =>
        option.setName("level").setDescription("MEE6 level").setRequired(true)
      )
      .addBooleanOption((option) =>
        option
          .setName("public")
          .setDescription(
            "Make the output of this command public to the server"
          )
          .setRequired(false)
      ),

  execute: async ({ client, redis }, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    const level = interaction.options.getInteger("level");

    if (level && parseInt(level, 10) < 1) {
      await interaction.reply({
        content: `Error! Level cannot be less than 1.`,
        ephemeral: true,
      });
      return;
    }

    const levelRoleId = await redis.getRoleIdByLevel(level);

    if (!levelRoleId) {
      await interaction.reply({
        content: `No role is assigned at level ${level}.`,
        ephemeral: true,
      });
      return;
    }

    if (!interaction.guildId) {
      await interaction.reply({
        content: `Error! No guild found!`,
        ephemeral: true,
      });
      return;
    }

    const guild = await client.guilds.cache.get(interaction.guildId);
    if (!guild) {
      await interaction.reply({
        content: `Error! Couldn't find guild with ID ${guild.guildId}.`,
        ephemeral: true,
      });
      return;
    }

    const levelRole = await guild.roles.cache.get(levelRoleId);
    if (!levelRole) {
      await interaction.reply({
        content: `Error! Couldn't find role with ID ${levelRoleId}.`,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: `${levelRole} is assigned at level ${level}.`,
      ephemeral: !isPublic,
    });
  },
};
