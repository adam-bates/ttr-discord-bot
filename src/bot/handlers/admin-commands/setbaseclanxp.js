const { requireMasterUser } = require("./helpers/roles");

module.exports = {
  builder: (command) =>
    command
      .setName("setbaseclanxp")
      .setDescription(
        "Set a base amount of clan xp to do promotion calculations with for a player"
      )
      .addIntegerOption((option) =>
        option
          .setName("amount")
          .setDescription("Amount of base clan xp")
          .setRequired(true)
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

  execute: requireMasterUser(async ({ redis }, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    const baseClanXp = parseInt(interaction.options.getInteger("amount"), 10);

    if (!Number.isSafeInteger(baseClanXp)) {
      await interaction.reply({
        content: "Error! Invalid amount.",
        ephemeral: true,
      });
      return;
    }

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

    await redis.setBaseClanXpByRsn(player.rsn, baseClanXp);

    await interaction.reply({
      content: `Successfully set base clanXp for RSN: ${player.rsn} to ${baseClanXp}`,
      ephemeral: !isPublic,
    });
  }),
};
