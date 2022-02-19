const { fromUnixTimestamp } = require("../../../utils/time");

const roundTo2Decimals = (n) => Math.round(n * 100) / 100;

module.exports = {
  builder: (command) =>
    command
      .setName("event")
      .setDescription("Get information about an event")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("Name of the event")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("info")
          .setDescription("Highlights or Report")
          .addChoice("Highlights", "highlights")
          .addChoice("Report", "report")
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

  execute: async ({ redis }, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    const name = interaction.options.getString("name");

    const details = await redis.getEventDetails(name);

    if (!details) {
      await interaction.reply({
        content: `Error: Event \`${name}\` doesn't exist!`,
        ephemeral: true,
      });
      return;
    }

    const lookupType = interaction.options.getString("info");
    const isReport = lookupType === "report";

    if (isReport) {
      await interaction.reply({
        content:
          "Sorry, but full reports aren't supported yet! This feature is still being worked on. In the meantime, checkout the highlights!",
        ephemeral: !isPublic,
      });
      return;
    }

    await interaction.deferReply({
      ephemeral: !isPublic,
    });

    const start = fromUnixTimestamp(details.start).toUTCString();

    const rsns = await redis.getAllRsns();

    const allStartStatsMap = new Map();
    const allEndStatsMap = new Map();

    await Promise.all(
      rsns.map(async (rsn) => {
        const stats = await redis.getStartEventStatsByRsn(name, rsn);

        allStartStatsMap.set(rsn, stats);
      })
    );

    let content = `\`\`\`EVENT HIGHLIGHTS\n\n${details.name}\n- Started: ${start}`;

    if (details.end) {
      const end = fromUnixTimestamp(details.end).toUTCString();

      content += `\n- Ended: ${end}`;

      const promises = rsns.map(async (rsn) => {
        const stats = await redis.getEndEventStatsByRsn(name, rsn);

        allEndStatsMap.set(rsn, stats);
      });

      await Promise.all(promises);
    } else {
      const promises = rsns.map(async (rsn) => {
        const stats = await redis.getStatsByRsn(rsn);

        allEndStatsMap.set(rsn, stats);
      });

      await Promise.all(promises);
    }

    const allTotalXpGainz = [];
    const allWeightedXpGainz = [];

    rsns.forEach((rsn) => {
      const startStats = allStartStatsMap.get(rsn);
      const endStats = allEndStatsMap.get(rsn);

      const totalStartXp = parseInt(
        startStats.overall.xp.replace(/,/g, ""),
        10
      );

      const totalEndXp = parseInt(endStats.overall.xp.replace(/,/g, ""), 10);

      const total = totalEndXp - totalStartXp;
      const weighted = (100 * total) / totalStartXp;

      allTotalXpGainz.push({ rsn, xp: total });
      allWeightedXpGainz.push({ rsn, percent: weighted });
    });

    allTotalXpGainz.sort((a, b) => b.xp - a.xp);
    allWeightedXpGainz.sort((a, b) => b.percent - a.percent);

    const topTotalXpGainz = allTotalXpGainz.slice(0, 3);
    const topWeightedXpGainz = allWeightedXpGainz.slice(0, 3);

    let i = 3;
    while (
      i < allTotalXpGainz.length &&
      allTotalXpGainz[i].xp === allTotalXpGainz[i - 1].xp
    ) {
      topTotalXpGainz.push(allTotalXpGainz[i]);
      i += 1;
    }

    i = 3;
    while (
      i < allWeightedXpGainz.length &&
      allWeightedXpGainz[i].percent === allWeightedXpGainz[i - 1].percent
    ) {
      topWeightedXpGainz.push(allWeightedXpGainz[i]);
      i += 1;
    }

    if (
      allTotalXpGainz.length > 0 &&
      allTotalXpGainz[0].xp > allTotalXpGainz[allTotalXpGainz.length - 1].xp
    ) {
      content += `\n\nTOP TOTAL XP GAINZ:`;

      topTotalXpGainz.forEach(({ rsn, xp }, idx) => {
        content += `${idx + 1}. ${rsn} gained ${xp} xp`;
      });
    }

    if (
      allWeightedXpGainz.length > 0 &&
      allWeightedXpGainz[0].percent >
        allWeightedXpGainz[allWeightedXpGainz.length - 1].percent
    ) {
      content += `\n\nTOP WEIGHTED XP GAINZ:`;

      topWeightedXpGainz.forEach(({ rsn, percent }, idx) => {
        content += `${idx + 1}. ${rsn} gained ${roundTo2Decimals(
          percent
        )}% total xp`;
      });
    }

    content += "```";

    await interaction.editReply({
      content,
      ephemeral: !isPublic,
    });
  },
};
