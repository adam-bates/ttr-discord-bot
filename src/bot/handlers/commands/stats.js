const fs = require("fs").promises;
const path = require("path");
const {
  fetchPlayerProfile,
  fetchPlayerMonthlyXp,
  fetchPlayerQuests,
} = require("../../../services/runescape-api");

module.exports = {
  builder: (command) =>
    command
      .setName("stats")
      .setDescription("Get detailed stats for a player")
      .addStringOption((option) =>
        option
          .setName("rsn")
          .setDescription("In-game Runescape name")
          .setRequired(false)
      )
      .addUserOption((option) =>
        option.setName("user").setDescription("Discord user").setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName("output")
          .setDescription("Format and presentation of data")
          .addChoice("Image", "png")
          .addChoice("CSV", "csv")
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

    let user = interaction.options.getUser("user");

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
      user = interaction.user;
      rsn = await redis.getRsnByUserId(user.id);
    }

    if (!rsn) {
      await interaction.reply({
        content: `Error: ${user} has no assigned RSN`,
        ephemeral: true,
      });
      return;
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

    const htmlContent = templates.stats();

    const filepath = path.join(
      process.env.PWD,
      "resources",
      `${interaction.id}.png`
    );

    await page.setViewport({
      width: 2500,
      height: 1369,
      deviceScaleFactor: 1,
    });
    await page.setContent(htmlContent);
    await page.screenshot({ path: filepath });

    await interaction.reply({
      content: JSON.stringify(stats),
      ephemeral: !isPublic,
      files: [filepath],
    });

    await fs.rm(filepath);
  },
};
