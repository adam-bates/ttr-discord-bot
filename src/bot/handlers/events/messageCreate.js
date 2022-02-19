const LEVEL_UP_PATTERN = /^GG <.*?>, you just advanced to level ([0-9]+)!$/;

const handleLevelUpPromotions = async ({ client, redis }, message) => {
  const res = LEVEL_UP_PATTERN.exec(message.content);
  if (res === null) {
    return;
  }

  const level = parseInt(res[1], 10);
  if (Number.isNaN(level)) {
    return;
  }

  const roleId = await redis.getRoleIdByLevel(level);
  if (!roleId) {
    return;
  }

  if (!message.guildId) {
    await message.reply({
      content: `Error: No guild found`,
      ephemeral: true,
    });
    return;
  }

  const guild = await client.guilds.cache.get(message.guildId);
  if (!guild) {
    await message.reply(
      `Error: Couldn't find guild with ID: ${message.guildId}`
    );
    return;
  }

  const role = await guild.roles.cache.get(roleId);
  if (!role) {
    await message.reply(`Error: Couldn't find role with ID: ${roleId}`);
    return;
  }

  const user = message.mentions.users.first();
  if (!user) {
    await message.reply(`Error: No user found in message`);
    return;
  }

  const member = await guild.members.cache.get(user.id);
  if (!member) {
    await message.reply(`Error: Couldn't find ${user} in guild ${guild}`);
    return;
  }

  await member.roles.add(role);

  let prevRoleLevel = level - 1;

  while (prevRoleLevel > 0) {
    // eslint-disable-next-line no-await-in-loop
    const prevRoleId = await redis.getRoleIdByLevel(prevRoleLevel);

    if (prevRoleId) {
      // eslint-disable-next-line no-await-in-loop
      const prevRole = await guild.roles.cache.get(prevRoleId);

      if (!prevRole) {
        // eslint-disable-next-line no-await-in-loop
        await message.reply(`Error: Couldn't find role with ID: ${prevRoleId}`);
        return;
      }

      if (!member.roles.cache.some((r) => prevRole.id === r.id)) {
        break;
      }

      // eslint-disable-next-line no-await-in-loop
      await member.roles.remove(prevRole);

      // eslint-disable-next-line no-await-in-loop
      await message.reply(`${user} was promoted from ${prevRole} to ${role}!`);
      return;
    }

    prevRoleLevel -= 1;
  }

  await message.reply(`${user} was promoted to ${role}!`);
};

module.exports = {
  name: "messageCreate",
  execute: async ({ client, redis, censor }, message) => {
    if (censor.shouldCensor(message.content)) {
      await message.delete();
      // TODO: Notify someone of issue!
    }

    if (message.author.id === process.env.MEE6_USER_ID) {
      await handleLevelUpPromotions({ client, redis }, message);
      return;
    }

    if (
      message.content.includes("@everyone") ||
      message.content.includes("@here")
    ) {
      // Delete messages mentioning @everyone or @here without permissions
      if (!message.mentions.everyone) {
        await message.delete();
      }
    }
  },
};
