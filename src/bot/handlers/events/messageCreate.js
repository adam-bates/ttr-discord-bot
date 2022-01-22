const LEVEL_UP_PATTERN =
  /^GG <@![0-9]+>, you just advanced to level ([0-9]+)!$/;

const levelRoleIds = {
  1: "934460159567233034",
  2: "934460323493195846",
  3: "934460409270898689",
};

module.exports = {
  name: "messageCreate",
  execute: async ({ client }, message) => {
    // Only listen to MEE6 for level ups
    if (message.author.id !== process.env.MEE6_USER_ID) {
      return;
    }

    const res = LEVEL_UP_PATTERN.exec(message.content);
    if (res === null) {
      return;
    }

    const level = parseInt(res[1], 10);
    if (Number.isNaN(level)) {
      return;
    }

    const roleId = levelRoleIds[level];
    if (!roleId) {
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

    const prevRoleId = levelRoleIds[level - 1];
    if (!prevRoleId) {
      return;
    }

    const prevRole = await guild.roles.cache.get(prevRoleId);
    if (!prevRole) {
      await message.reply(`Error: Couldn't find role with ID: ${prevRoleId}`);
      return;
    }

    await member.roles.remove(prevRole);
  },
};
