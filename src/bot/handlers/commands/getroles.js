module.exports = {
  builder: (command) =>
    command
      .setName("getroles")
      .setDescription("Get the roles assigned at each MEE6 level")
      .addIntegerOption((option) =>
        option
          .setName("level")
          .setDescription("Specfic MEE6 level to look up")
          .setRequired(false)
      )
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("Specific role to look up")
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

  execute: async ({ client, redis }, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    const level = interaction.options.getInteger("level");
    const role = interaction.options.getRole("role");

    if (level && parseInt(level, 10) < 1) {
      await interaction.reply({
        content: `Error: Level cannot be less than 1`,
        ephemeral: true,
      });
      return;
    }

    if (level && role) {
      const levelRoleId = await redis.getRoleIdByLevel(role.id);

      if (levelRoleId !== role.id) {
        await interaction.reply({
          content: `Error: ${role} is not assigned at level ${level}`,
          ephemeral: true,
        });
        return;
      }

      await interaction.reply({
        content: `${role} is assigned at level ${level}`,
        ephemeral: !isPublic,
      });
      return;
    }

    if (level) {
      const levelRoleId = await redis.getRoleIdByLevel(level);

      if (!levelRoleId) {
        await interaction.reply({
          content: `No role is assigned at level ${level}`,
          ephemeral: true,
        });
        return;
      }

      if (!interaction.guildId) {
        await interaction.reply({
          content: `Error: No guild found`,
          ephemeral: true,
        });
        return;
      }

      const guild = await client.guilds.cache.get(interaction.guildId);
      if (!guild) {
        await interaction.reply({
          content: `Error: Couldn't find guild with ID: ${guild.guildId}`,
          ephemeral: true,
        });
        return;
      }

      const levelRole = await guild.roles.cache.get(levelRoleId);
      if (!levelRole) {
        await interaction.reply({
          content: `Error: Couldn't find role with ID: ${levelRoleId}`,
          ephemeral: true,
        });
        return;
      }

      await interaction.reply({
        content: `${levelRole} is assigned at level ${level}`,
        ephemeral: !isPublic,
      });
      return;
    }

    if (role) {
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
      return;
    }

    if (!interaction.guildId) {
      await interaction.reply({
        content: `Error: No guild found`,
        ephemeral: true,
      });
      return;
    }

    const guild = await client.guilds.cache.get(interaction.guildId);
    if (!guild) {
      await interaction.reply({
        content: `Error: Couldn't find guild with ID: ${interaction.guildId}`,
        ephemeral: true,
      });
      return;
    }

    let assignments = await redis.getAllLevelRoleIdAssignments();

    if (assignments.length === 0) {
      await interaction.reply({
        content: `No roles have been assigned to any levels`,
        ephemeral: !isPublic,
      });
      return;
    }

    assignments.sort((a, b) => a.level - b.level);

    const failedRoleIds = [];

    const promises = assignments.map(async (assignment) => {
      const levelRole = await guild.roles.cache.get(assignment.roleId);
      if (!levelRole) {
        failedRoleIds.push(assignment.roleId);
        return null;
      }

      return { level: assignment.level, role: levelRole };
    });

    assignments = await Promise.all(promises);

    if (failedRoleIds.length > 0) {
      await interaction.reply({
        content: `Error: Couldn't find roles with IDs: ${failedRoleIds}`,
        ephemeral: true,
      });
      return;
    }

    const content = assignments.reduce(
      (output, assignment) =>
        `${output}\n- ${assignment.role} is assigned at level ${assignment.level}`,
      "Level-role assignments:"
    );

    await interaction.reply({ content, ephemeral: !isPublic });
  },
};
