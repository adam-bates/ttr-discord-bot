const { requireMasterUser } = require("./helpers/roles");

module.exports = {
  builder: (command) =>
    command
      .setName("eventsremove")
      .setDescription("Remove a player from event highlights")
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

    await redis.removeFromEvents(player.rsn);

    await interaction.reply({
      content: `Successfully removed RSN: ${player.rsn} from event highlights.`,
      ephemeral: !isPublic,
    });
  }),
};
