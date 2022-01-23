const isMasterUser = async (client, interaction) => {
  if (!interaction.guildId) {
    await interaction.reply({
      content: `Error: No guild found`,
      ephemeral: true,
    });
    return false;
  }

  const guild = await client.guilds.cache.get(interaction.guildId);
  if (!guild) {
    await interaction.reply(
      `Error: Couldn't find guild with ID: ${interaction.guildId}`
    );
    return false;
  }

  const isMaster = interaction.member.roles.cache.some(
    (r) => process.env.MASTER_ROLE_ID === r.id
  );

  if (!isMaster) {
    await interaction.reply({
      content: "Error: Invalid permissions!",
      ephemeral: true,
    });
  }

  return isMaster;
};

const requireMasterUser =
  (execute) =>
  async ({ client, ...rest }, interaction) => {
    if (await isMasterUser(client, interaction)) {
      await execute({ client, ...rest }, interaction);
    }
  };

module.exports = {
  isMasterUser,
  requireMasterUser,
};
