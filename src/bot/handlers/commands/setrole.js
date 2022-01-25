const { requireMasterUser } = require("./helpers/roles");

module.exports = {
  builder: (command) =>
    command
      .setName("setrole")
      .setDescription("Set the role assigned to a MEE6 level")
      .addIntegerOption((option) =>
        option
          .setName("level")
          .setDescription("The MEE6 level to assign the role at")
          .setRequired(true)
      )
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("Role to set at the level")
          .setRequired(true)
      )
      .addBooleanOption((option) =>
        option
          .setName("public")
          .setDescription(
            "Make the output of this command public to the server"
          )
          .setRequired(false)
      ),

  execute: requireMasterUser(async ({ client, redis }, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    const level = interaction.options.getInteger("level");

    if (parseInt(level, 10) < 1) {
      await interaction.reply({
        content: "Error! Level cannot be less than 1.",
        ephemeral: true,
      });
      return;
    }

    const role = interaction.options.getRole("role");

    const oldLevel = await redis.searchForLevelWithRoleId(role.id);

    if (!oldLevel) {
      const oldRoleId = await redis.getRoleIdByLevel(level);

      if (!oldRoleId) {
        await redis.setRoleIdByLevel(level, role.id);

        await interaction.reply({
          content: `Successfully assigned ${role} to level ${level}.`,
          ephemeral: !isPublic,
        });
        return;
      }

      await redis.setRoleIdByLevel(level, role.id);

      if (!interaction.guildId) {
        console.error("Error! No guild found.");

        await interaction.reply({
          content: `Replaced previous role with ${role} at level ${level}.`,
          ephemeral: !isPublic,
        });
        return;
      }

      const guild = await client.guilds.cache.get(interaction.guildId);
      if (!guild) {
        console.error(`Error! Couldn't find guild with ID ${guild.guildId}.`);

        await interaction.reply({
          content: `Replaced previous role with ${role} at level ${level}.`,
          ephemeral: !isPublic,
        });
        return;
      }

      const oldRole = await guild.roles.cache.get(oldRoleId);
      if (!oldRole) {
        console.error(`Error! Couldn't find role with ID ${oldRoleId}.`);

        await interaction.reply({
          content: `Replaced previous role with ${role} at level ${level}.`,
          ephemeral: !isPublic,
        });
        return;
      }

      await interaction.reply({
        content: `Successfully replaced ${oldRole} with ${role} at level ${level}.`,
        ephemeral: !isPublic,
      });
    } else {
      if (level === oldLevel) {
        await interaction.reply({
          content: `${role} is already assigned at level ${level}. Nothing interested happened.`,
          ephemeral: !isPublic,
        });
        return;
      }

      const oldRoleId = await redis.getRoleIdByLevel(level);

      await redis.deleteRoleIdByLevel(oldLevel);
      await redis.setRoleIdByLevel(level, role.id);

      if (!oldRoleId || oldRoleId === role.id) {
        await interaction.reply({
          content: `Successfully moved ${role} from level ${oldLevel} to level ${level}.`,
          ephemeral: !isPublic,
        });
        return;
      }

      if (!interaction.guildId) {
        console.error("Error! No guild found.");

        await interaction.reply({
          content: `Moved ${role} from level ${oldLevel} to level ${level}, replacing previous role.`,
          ephemeral: !isPublic,
        });
        return;
      }

      const guild = await client.guilds.cache.get(interaction.guildId);
      if (!guild) {
        console.error(`Error! Couldn't find guild with ID ${guild.guildId}.`);

        await interaction.reply({
          content: `Moved ${role} from level ${oldLevel} to level ${level}, replacing previous role.`,
          ephemeral: !isPublic,
        });
        return;
      }

      const oldRole = await guild.roles.cache.get(oldRoleId);
      if (!oldRole) {
        console.error(`Error! Couldn't find role with ID ${oldRoleId}.`);

        await interaction.reply({
          content: `Moved ${role} from level ${oldLevel} to level ${level}, replacing previous role.`,
          ephemeral: !isPublic,
        });
        return;
      }

      await interaction.reply({
        content: `Successfully moved ${role} from level ${oldLevel} to level ${level}, replacing ${oldRole}.`,
        ephemeral: !isPublic,
      });
    }
  }),
};
