const { requireModUser } = require("./helpers/roles");

module.exports = {
  builder: (command) =>
    command
      .setName("getbaseclanxp")
      .setDescription(
        "Get the added base amount of clan xp, if exists, for a player"
      )
      .addStringOption((option) =>
        option
          .setName("rsn")
          .setDescription("In-game Runescape name")
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

  execute: requireModUser(async ({ redis }, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    const requestedRsn = interaction.options.getString("rsn");

    const players = await redis.getAllPlayers();

    const player = players.find(
      (p) => p.rsn.toLowerCase() === requestedRsn.toLowerCase()
    );

    if (!player) {
      await interaction.reply({
        content: `Error! Couldn't find RSN: ${requestedRsn} in ${process.env.CLAN_NAME}.`,
      });
      return;
    }

    const baseClanXp = await redis.getBaseClanXpByRsn(player.rsn);

    if (baseClanXp) {
      await interaction.reply({
        content: `The base clanXp for RSN: ${player.rsn} is ${baseClanXp}`,
        ephemeral: !isPublic,
      });
    } else {
      await interaction.reply({
        content: `There is no base clanXp for RSN: ${player.rsn}`,
        ephemeral: !isPublic,
      });
    }
  }),
};
