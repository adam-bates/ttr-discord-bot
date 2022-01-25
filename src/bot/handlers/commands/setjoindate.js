const { requireMasterUser } = require("./helpers/roles");
const { unixTimestamp, dropTime } = require("../../../utils/time");

module.exports = {
  builder: (command) =>
    command
      .setName("setjoindate")
      .setDescription("Set the date that a player joined the clan in Runescape")
      .addStringOption((option) =>
        option
          .setName("date")
          .setDescription("Date joined clan")
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

    const requestedDate = new Date(interaction.options.getString("date"));

    if (Number.isNaN(requestedDate.getTime())) {
      await interaction.reply({
        content: "Error: Invalid date",
        ephemeral: true,
      });
      return;
    }

    const date = dropTime(requestedDate);

    const requestedRsn = interaction.options.getString("rsn");

    let rsn = null;

    let players = await redis.getAllPlayers();

    players = players.map((player) => {
      if (player.rsn.toLowerCase() === requestedRsn.toLowerCase()) {
        rsn = player.rsn;
        return {
          ...player,
          dateJoined: unixTimestamp(date),
        };
      }

      return player;
    });

    if (!rsn) {
      await interaction.reply({
        content: `Error: Couldn't find RSN ${requestedRsn} in the clan: ${process.env.CLAN_NAME}`,
      });
      return;
    }

    await redis.unsafeSetAllPlayers(players);

    const utcDate = date.toUTCString().substring(0, 16);

    await interaction.reply({
      content: `Successfully set join date for RSN ${rsn} to: ${utcDate}`,
      ephemeral: !isPublic,
    });
  }),
};
