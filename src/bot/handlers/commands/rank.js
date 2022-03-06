const { formatNumberToLength } = require("../../../utils/format");
const {
  unixTimestamp,
  fromUnixTimestamp,
  dropTime,
} = require("../../../utils/time");

module.exports = {
  builder: (command) =>
    command
      .setName("rank")
      .setDescription("Get clan ranking information for a player")
      .addStringOption((option) =>
        option
          .setName("rsn")
          .setDescription("In-game Runescape name")
          .setRequired(false)
      )
      .addUserOption((option) =>
        option.setName("user").setDescription("Discord user").setRequired(false)
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

    const requestedRsn = interaction.options.getString("rsn");
    let rsn = requestedRsn;
    let player = null;

    if (requestedRsn) {
      const players = await redis.getAllPlayers();
      player = players.find((p) => p.rsn.toLowerCase() === rsn.toLowerCase());

      if (!player) {
        await interaction.reply({
          content: `Error! RSN ${requestedRsn} is not in the clan: ${process.env.CLAN_NAME}`,
          ephemeral: true,
        });
        return;
      }

      rsn = player.rsn;
    }

    let user = interaction.options.getUser("user");

    if (user) {
      const userRsn = await redis.getRsnByUserId(user.id);

      if (rsn && rsn.toLowerCase() !== userRsn.toLowerCase()) {
        await interaction.reply({
          content: `Error! RSN ${rsn} is not assigned to: ${user}`,
          ephemeral: true,
        });
        return;
      }

      rsn = userRsn;
    } else if (!rsn) {
      user = interaction.user;
      rsn = await redis.getRsnByUserId(user.id);
    }

    player = player || (await redis.getAllPlayers()).find((p) => p.rsn === rsn);

    if (!rsn || !player) {
      await interaction.reply({
        content: `${user} has no assigned RSN.\n\nYou can pass in an RSN instead, or use the command \`/ttr setrsn\` to assign a Discord user to a Runescape name.`,
        ephemeral: true,
      });
      return;
    }

    if (!user) {
      const userId = await redis.searchForUserIdWithRsn(rsn);

      const guild = await client.guilds.fetch(interaction.guildId);
      if (guild) {
        user = await guild.members.fetch(userId);
      }
    }

    let content = `**RSN:** _${rsn}_\n`;

    if (user) {
      content += `**Discord:** ${user}\n`;
    }

    const days = Math.round(
      (unixTimestamp(dropTime(fromUnixTimestamp())) - player.dateJoined) /
        (24 * 60 * 60)
    );

    const dateJoined = fromUnixTimestamp(player.dateJoined)
      .toUTCString()
      .slice(0, 16);

    const clanXp = formatNumberToLength(player.clanXp, 15).trim();

    content += `**Rank:** _${player.rank}_\n**Member Since:** _${dateJoined}_ _(${days} days)_\n**Clan XP:** _${clanXp} xp_`;

    await interaction.reply({ content, ephemeral: !isPublic });
  },
};
