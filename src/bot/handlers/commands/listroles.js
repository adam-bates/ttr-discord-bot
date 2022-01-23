module.exports = {
  builder: (command) =>
    command
      .setName("listroles")
      .setDescription("List all MEE6 level's role assignments")
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
