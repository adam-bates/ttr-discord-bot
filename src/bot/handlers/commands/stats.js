const fs = require("fs").promises;
const {
  fetchPlayerProfile,
  fetchPlayerMonthlyXp,
  fetchPlayerQuests,
} = require("../../../services/runescape-api");

module.exports = {
  builder: (command) =>
    command
      .setName("stats")
      .setDescription("Replies with stats for a player")
      .addStringOption((option) =>
        option
          .setName("rsn")
          .setDescription("In-game Runescape name to get Runescape stats")
          .setRequired(false)
      )
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("Discord user to get Runescape stats")
          .setRequired(false)
      )
      .addIntegerOption((option) =>
        option
          .setName("activities")
          .setDescription(
            "How many recent activities to include (0 by default)"
          )
          .setMinValue(0)
          .setMaxValue(20)
          .setRequired(false)
      )
      .addBooleanOption((option) =>
        option
          .setName("monthly-xp")
          .setDescription("Include past year of Monthly XP gainz")
          .setRequired(false)
      )
      .addBooleanOption((option) =>
        option
          .setName("quests")
          .setDescription("Include Quest data")
          .setRequired(false)
      )
      .addBooleanOption((option) =>
        option
          .setName("public")
          .setDescription(
            "Make the output of this command public to the server"
          )
          .setRequired(false)
      ),

  execute: async ({ redis, page, templates }, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    const requestedRsn = interaction.options.getString("rsn");
    let rsn = requestedRsn;

    if (requestedRsn) {
      const rsns = await redis.getAllRsns();
      rsn = rsns.find((r) => r.toLowerCase() === rsn.toLowerCase());

      if (!rsn) {
        await interaction.reply({
          content: `Error: RSN ${requestedRsn} is not in the clan: ${process.env.CLAN_NAME}`,
          ephemeral: true,
        });
        return;
      }
    }

    const user = interaction.options.getUser("user");

    if (user) {
      const userRsn = await redis.getRsnByUserId(user.id);

      if (rsn && rsn.toLowerCase() !== userRsn.toLowerCase()) {
        await interaction.reply({
          content: `Error: RSN ${rsn} is not assigned to: ${user}`,
          ephemeral: true,
        });
        return;
      }

      rsn = userRsn;
    } else if (!rsn) {
      rsn = await redis.getRsnByUserId(interaction.user.id);
    }

    const stats = await redis.getStatsByRsn(rsn);

    const activities = interaction.options.getInteger("activities");
    if (activities) {
      const profile = await fetchPlayerProfile(rsn);

      stats.activities = profile.activities;
    }

    if (interaction.options.getBoolean("monthly-xp")) {
      stats.monthlyXp = await fetchPlayerMonthlyXp(rsn);
    }

    if (interaction.options.getBoolean("quests")) {
      stats.quests = await fetchPlayerQuests(rsn);
    }

    const htmlContent = templates.playerStats();

    const filename = `${interaction.id}.png`;

    await page.setViewport({
      width: 1200,
      height: 1369,
      deviceScaleFactor: 1,
    });
    await page.setContent(htmlContent);
    await page.screenshot({ path: filename });

    await interaction.reply({
      content: JSON.stringify(stats),
      ephemeral: !isPublic,
      files: [filename],
    });

    await fs.rm(filename);
  },
};
