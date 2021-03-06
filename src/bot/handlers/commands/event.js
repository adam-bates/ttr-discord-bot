const { fromUnixTimestamp } = require("../../../utils/time");
const { formatNumberToLength } = require("../../../utils/format");

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
          .setRequired(false)
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

    let name = interaction.options.getString("name");

    if (!name) {
      const currentEventNames = await redis.getCurrentEventNames();

      if (currentEventNames.length === 1) {
        [name] = currentEventNames;
      } else if (currentEventNames.length === 0) {
        await interaction.reply({
          content: `Error: There are no events currently running. Please specify a \`name\`.`,
          ephemeral: true,
        });
        return;
      } else {
        await interaction.reply({
          content: `Error: There are multiple events currently running, please specify a \`name\`.`,
          ephemeral: true,
        });
        return;
      }
    }

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

    let goal = details.goal && parseInt(details.goal, 10);
    if (goal && Number.isNaN(goal)) {
      goal = null;
    }
    const goalString = goal ? `\n- Goal: ${goal}M Overall EXP` : "";

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

    let content = `\`\`\`EVENT HIGHLIGHTS\n\n${details.name}${goalString}\n- Started: ${start}`;

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

      if (!startStats || !endStats) {
        return;
      }

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

    const blacklist = await redis.getEventsBlacklist();

    const topTotalXpGainz = [];
    let i = 0;
    let count = 0;

    while (i < allTotalXpGainz.length && count < 3) {
      const player = allTotalXpGainz[i];

      if (!blacklist.has(player.rsn)) {
        count += 1;
        player.place = count;
      }

      topTotalXpGainz.push(player);

      i += 1;
    }

    while (
      i < allTotalXpGainz.length &&
      allTotalXpGainz[i].xp === allTotalXpGainz[i - 1].xp
    ) {
      const player = allTotalXpGainz[i];

      if (!blacklist.has(player.rsn)) {
        player.place = count;
      }

      topTotalXpGainz.push(player);

      i += 1;
    }

    const topWeightedXpGainz = [];
    i = 0;
    count = 0;

    while (i < allWeightedXpGainz.length && count < 3) {
      const player = allWeightedXpGainz[i];

      topWeightedXpGainz.push(player);

      if (!blacklist.has(player.rsn)) {
        count += 1;
        player.place = count;
      }

      i += 1;
    }

    while (
      i < allWeightedXpGainz.length &&
      allWeightedXpGainz[i].percent === allWeightedXpGainz[i - 1].percent
    ) {
      const player = allWeightedXpGainz[i];

      if (!blacklist.has(player.rsn)) {
        player.place = count;
      }

      topWeightedXpGainz.push(player);
      i += 1;
    }

    if (
      allTotalXpGainz.length > 0 &&
      allTotalXpGainz[0].xp > allTotalXpGainz[allTotalXpGainz.length - 1].xp
    ) {
      content += `\n\nTOP TOTAL XP GAINZ:`;

      topTotalXpGainz.forEach(({ rsn, xp, place }) => {
        content += `\n${place || "-"}. ${rsn} gained ${formatNumberToLength(
          xp,
          15
        ).trim()} xp`;
      });
    }

    if (
      allWeightedXpGainz.length > 0 &&
      allWeightedXpGainz[0].percent >
        allWeightedXpGainz[allWeightedXpGainz.length - 1].percent
    ) {
      content += `\n\nTOP WEIGHTED XP GAINZ:`;

      topWeightedXpGainz.forEach(({ rsn, percent, place }) => {
        content += `\n${
          place || "-"
        }. ${rsn} increased their total xp by ${roundTo2Decimals(percent)}%`;
      });
    }

    content += "```";

    await interaction.editReply({
      content,
      ephemeral: !isPublic,
    });
  },
};
