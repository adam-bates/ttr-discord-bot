const { requireMasterUser } = require("./helpers/roles");

module.exports = {
  builder: (command) =>
    command
      .setName("delrole")
      .setDescription("Delete the role assigned to a MEE6 level")
      .addIntegerOption((option) =>
        option
          .setName("level")
          .setDescription("The MEE6 level to assign the role at")
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
        content: "Error: Level cannot be less than 1",
        ephemeral: true,
      });
      return;
    }

    const oldRoleId = await redis.getRoleIdByLevel(level);

    if (!oldRoleId) {
      await interaction.reply({
        content: `There is no role assigned at level ${level}. Nothing interested happened.`,
        ephemeral: !isPublic,
      });
      return;
    }

    await redis.deleteRoleIdByLevel(level);

    if (!interaction.guildId) {
      await interaction.reply({
        content: `Error: No guild found`,
        ephemeral: true,
      });
      return;
    }

    const guild = await client.guilds.cache.get(interaction.guildId);
    if (!guild) {
      console.error(`Error: Couldn't find guild with ID: ${guild.guildId}`);

      await interaction.reply({
        content: `Removed previous role from level ${level}.`,
        ephemeral: !isPublic,
      });
      return;
    }

    const oldRole = await guild.roles.cache.get(oldRoleId);
    if (!oldRole) {
      console.error(`Error: Couldn't find role with ID: ${oldRoleId}`);

      await interaction.reply({
        content: `Removed previous role from level ${level}.`,
        ephemeral: !isPublic,
      });
      return;
    }

    await interaction.reply({
      content: `Successfully removed ${oldRole} from level ${level}.`,
      ephemeral: !isPublic,
    });
  }),
};
