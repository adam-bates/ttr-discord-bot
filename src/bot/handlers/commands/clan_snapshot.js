const { requireMasterUser } = require("./helpers/roles");

module.exports = {
  builder: (command) =>
    command
      .setName("clan-snapshot")
      .setDescription("Create a snapshot of all clan members stats")
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

    const rsns = await redis.getAllRsns();

    const promises = rsns.map(async (rsn) => {
      const stats = await redis.getStatsByRsn(rsn);

      await redis.setStatsSnapshotByRsnAndTimestamp(
        rsn,
        stats.timestamp,
        stats
      );
    });

    await Promise.all(promises);

    await interaction.reply({
      content: `Successfully created ${rsns.length} snapshots!`,
      ephemeral: !isPublic,
    });
  }),
};
