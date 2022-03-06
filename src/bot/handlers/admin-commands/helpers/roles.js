const isUserRole = async (roleId, client, interaction, shouldReply = true) => {
  if (!interaction.guildId) {
    await interaction.reply({
      content: `Error: Protected commands must be run within a server`,
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

  const isRole = interaction.member.roles.cache.some((r) => roleId === r.id);

  if (!isRole && shouldReply) {
    await interaction.reply({
      content: "Error! Invalid permissions.",
      ephemeral: true,
    });
  }

  return isRole;
};

const isMasterUser = async (client, interaction, shouldReply = true) =>
  isUserRole(process.env.MASTER_ROLE_ID, client, interaction, shouldReply);

const requireMasterUser =
  (execute) =>
  async ({ client, ...rest }, interaction) => {
    if (await isMasterUser(client, interaction)) {
      await execute({ client, ...rest }, interaction);
    }
  };

const isModUser = async (client, interaction, shouldReply = true) =>
  isUserRole(process.env.MOD_ROLE_ID, client, interaction, shouldReply) ||
  isMasterUser(client, interaction, shouldReply);

const requireModUser =
  (execute) =>
  async ({ client, ...rest }, interaction) => {
    if (await isModUser(client, interaction)) {
      await execute({ client, ...rest }, interaction);
    }
  };

module.exports = {
  isMasterUser,
  requireMasterUser,
  isModUser,
  requireModUser,
};
