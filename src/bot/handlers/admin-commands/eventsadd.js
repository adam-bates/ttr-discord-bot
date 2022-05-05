const { requireMasterUser } = require("./helpers/roles");

module.exports = {
  builder: (command) =>
    command
      .setName("eventsadd")
      .setDescription(
        "Add back a player that was removed from event highlights"
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

    await redis.addToEvents(player.rsn);

    await interaction.reply({
      content: `Successfully added RSN: ${player.rsn} to event highlights.`,
      ephemeral: !isPublic,
    });
  }),
};
