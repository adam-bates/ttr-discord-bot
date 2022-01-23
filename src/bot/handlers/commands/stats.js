const fs = require("fs").promises;
const path = require("path");

const statKeys = [
  "overall",
  "attack",
  "defence",
  "strength",
  "constitution",
  "ranged",
  "prayer",
  "magic",
  "cooking",
  "woodcutting",
  "fletching",
  "fishing",
  "firemaking",
  "crafting",
  "smithing",
  "mining",
  "herblore",
  "agility",
  "thieving",
  "slayer",
  "farming",
  "runecrafting",
  "hunter",
  "construction",
  "summoning",
  "dungeoneering",
  "divination",
  "invention",
  "archaeology",
];

const calculateGainz = ({ from, to }) =>
  statKeys.reduce(
    (gainz, key) => ({
      ...gainz,
      [key]:
        !from[key] || !to[key]
          ? { level: "-", xp: "-", rank: "-" }
          : {
              level:
                !from[key].level || !to[key].level
                  ? "-"
                  : parseInt(to[key].level.replace(/,/g, ""), 10) -
                    parseInt(from[key].level.replace(/,/g, ""), 10),
              xp:
                !from[key].xp || !to[key].xp
                  ? "-"
                  : parseInt(to[key].xp.replace(/,/g, ""), 10) -
                    parseInt(from[key].xp.replace(/,/g, ""), 10),
              rank:
                !from[key].rank || !to[key].rank
                  ? "-"
                  : parseInt(to[key].rank.replace(/,/g, ""), 10) -
                    parseInt(from[key].rank.replace(/,/g, ""), 10),
            },
    }),
    {}
  );

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

    const currentStats = (await redis.getStatsByRsn(rsn)) || {};
    const todayStats = (await redis.getTodayStatsByRsn(rsn)) || {};
    const yesterdayStats = (await redis.getYesterdayStatsByRsn(rsn)) || {};
    const weekStats = (await redis.getWeekStatsByRsn(rsn)) || {};

    const datetime = new Date(currentStats.timestamp * 1000);

    const stats = {
      rsn,
      timestamp: datetime.toUTCString(),
    };
    stats.total = currentStats;

    stats.today = calculateGainz({
      from: todayStats,
      to: currentStats,
    });
    stats.today.late = todayStats.late !== false;

    stats.yesterday = calculateGainz({
      from: yesterdayStats,
      to: todayStats,
    });
    stats.yesterday.late = yesterdayStats.late !== false;

    stats.week = calculateGainz({
      from: weekStats,
      to: currentStats,
    });
    stats.week.late = weekStats.late !== false;

    stats.lateMessage =
      stats.today.late || stats.yesterday.late || stats.week.late
        ? "* Data was not pulled on time and may be incorrect"
        : "";

    const output = await interaction.options.getString("output");
    switch (output && output.toLowerCase()) {
      case null:
      case "png": {
        const htmlContent = templates.stats(stats);

        const date = datetime.toISOString().split("T")[0];

        const filepath = path.join(
          __dirname,
          "..",
          "..",
          "..",
          "..",
          "resources",
          "temp",
          `stats_${date}_${interaction.id}.png`
        );

        await page.setViewport({
          width: 1920,
          height: 1369,
          deviceScaleFactor: 2,
        });
        await page.setContent(htmlContent);

        try {
          await page.screenshot({ path: filepath });

          await interaction.reply({
            ephemeral: !isPublic,
            files: [filepath],
          });
        } finally {
          try {
            await fs.rm(filepath);
          } catch (e) {
            console.error(e);
          }
        }
        break;
      }
      case "csv": {
        const date = datetime.toISOString().split("T")[0];

        const filepath = path.join(
          __dirname,
          "..",
          "..",
          "..",
          "..",
          "resources",
          "temp",
          `stats_${date}_${interaction.id}.csv`
        );

        let csv = `${rsn},${datetime.toISOString()}\n`;
        csv += `SKILL,TOTAL_LEVEL,TOTAL_XP,TOTAL_RANK,TODAY_LEVEL,TODAY_XP,TODAY_RANK,TODAY_IS_LATE,YESTERDAY_LEVEL,YESTERDAY_XP,YESTERDAY_RANK,YESTERDAY_IS_LATE,THIS_WEEK_LEVEL,THIS_WEEK_XP,THIS_WEEK_RANK,THIS_WEEK_IS_LATE\n`;
        csv += `Overall,${stats.total.overall.level},${stats.total.overall.xp},${stats.total.overall.rank},${stats.today.overall.level},${stats.today.overall.xp},${stats.today.overall.rank},${stats.today.late},${stats.yesterday.overall.level},${stats.yesterday.overall.xp},${stats.yesterday.overall.rank},${stats.yesterday.late},${stats.week.overall.level},${stats.week.overall.xp},${stats.week.overall.rank},${stats.week.late}\n`;
        csv += `Attack,${stats.total.attack.level},${stats.total.attack.xp},${stats.total.attack.rank},${stats.today.attack.level},${stats.today.attack.xp},${stats.today.attack.rank},${stats.today.late},${stats.yesterday.attack.level},${stats.yesterday.attack.xp},${stats.yesterday.attack.rank},${stats.yesterday.late},${stats.week.attack.level},${stats.week.attack.xp},${stats.week.attack.rank},${stats.week.late}\n`;
        csv += `Defence,${stats.total.defence.level},${stats.total.defence.xp},${stats.total.defence.rank},${stats.today.defence.level},${stats.today.defence.xp},${stats.today.defence.rank},${stats.today.late},${stats.yesterday.defence.level},${stats.yesterday.defence.xp},${stats.yesterday.defence.rank},${stats.yesterday.late},${stats.week.defence.level},${stats.week.defence.xp},${stats.week.defence.rank},${stats.week.late}\n`;
        csv += `Strength,${stats.total.strength.level},${stats.total.strength.xp},${stats.total.strength.rank},${stats.today.strength.level},${stats.today.strength.xp},${stats.today.strength.rank},${stats.today.late},${stats.yesterday.strength.level},${stats.yesterday.strength.xp},${stats.yesterday.strength.rank},${stats.yesterday.late},${stats.week.strength.level},${stats.week.strength.xp},${stats.week.strength.rank},${stats.week.late}\n`;
        csv += `Constitution,${stats.total.constitution.level},${stats.total.constitution.xp},${stats.total.constitution.rank},${stats.today.constitution.level},${stats.today.constitution.xp},${stats.today.constitution.rank},${stats.today.late},${stats.yesterday.constitution.level},${stats.yesterday.constitution.xp},${stats.yesterday.constitution.rank},${stats.yesterday.late},${stats.week.constitution.level},${stats.week.constitution.xp},${stats.week.constitution.rank},${stats.week.late}\n`;
        csv += `Ranged,${stats.total.ranged.level},${stats.total.ranged.xp},${stats.total.ranged.rank},${stats.today.ranged.level},${stats.today.ranged.xp},${stats.today.ranged.rank},${stats.today.late},${stats.yesterday.ranged.level},${stats.yesterday.ranged.xp},${stats.yesterday.ranged.rank},${stats.yesterday.late},${stats.week.ranged.level},${stats.week.ranged.xp},${stats.week.ranged.rank},${stats.week.late}\n`;
        csv += `Prayer,${stats.total.prayer.level},${stats.total.prayer.xp},${stats.total.prayer.rank},${stats.today.prayer.level},${stats.today.prayer.xp},${stats.today.prayer.rank},${stats.today.late},${stats.yesterday.prayer.level},${stats.yesterday.prayer.xp},${stats.yesterday.prayer.rank},${stats.yesterday.late},${stats.week.prayer.level},${stats.week.prayer.xp},${stats.week.prayer.rank},${stats.week.late}\n`;
        csv += `Magic,${stats.total.magic.level},${stats.total.magic.xp},${stats.total.magic.rank},${stats.today.magic.level},${stats.today.magic.xp},${stats.today.magic.rank},${stats.today.late},${stats.yesterday.magic.level},${stats.yesterday.magic.xp},${stats.yesterday.magic.rank},${stats.yesterday.late},${stats.week.magic.level},${stats.week.magic.xp},${stats.week.magic.rank},${stats.week.late}\n`;
        csv += `Cooking,${stats.total.cooking.level},${stats.total.cooking.xp},${stats.total.cooking.rank},${stats.today.cooking.level},${stats.today.cooking.xp},${stats.today.cooking.rank},${stats.today.late},${stats.yesterday.cooking.level},${stats.yesterday.cooking.xp},${stats.yesterday.cooking.rank},${stats.yesterday.late},${stats.week.cooking.level},${stats.week.cooking.xp},${stats.week.cooking.rank},${stats.week.late}\n`;
        csv += `Woodcutting,${stats.total.woodcutting.level},${stats.total.woodcutting.xp},${stats.total.woodcutting.rank},${stats.today.woodcutting.level},${stats.today.woodcutting.xp},${stats.today.woodcutting.rank},${stats.today.late},${stats.yesterday.woodcutting.level},${stats.yesterday.woodcutting.xp},${stats.yesterday.woodcutting.rank},${stats.yesterday.late},${stats.week.woodcutting.level},${stats.week.woodcutting.xp},${stats.week.woodcutting.rank},${stats.week.late}\n`;
        csv += `Fletching,${stats.total.fletching.level},${stats.total.fletching.xp},${stats.total.fletching.rank},${stats.today.fletching.level},${stats.today.fletching.xp},${stats.today.fletching.rank},${stats.today.late},${stats.yesterday.fletching.level},${stats.yesterday.fletching.xp},${stats.yesterday.fletching.rank},${stats.yesterday.late},${stats.week.fletching.level},${stats.week.fletching.xp},${stats.week.fletching.rank},${stats.week.late}\n`;
        csv += `Fishing,${stats.total.fishing.level},${stats.total.fishing.xp},${stats.total.fishing.rank},${stats.today.fishing.level},${stats.today.fishing.xp},${stats.today.fishing.rank},${stats.today.late},${stats.yesterday.fishing.level},${stats.yesterday.fishing.xp},${stats.yesterday.fishing.rank},${stats.yesterday.late},${stats.week.fishing.level},${stats.week.fishing.xp},${stats.week.fishing.rank},${stats.week.late}\n`;
        csv += `Firemaking,${stats.total.firemaking.level},${stats.total.firemaking.xp},${stats.total.firemaking.rank},${stats.today.firemaking.level},${stats.today.firemaking.xp},${stats.today.firemaking.rank},${stats.today.late},${stats.yesterday.firemaking.level},${stats.yesterday.firemaking.xp},${stats.yesterday.firemaking.rank},${stats.yesterday.late},${stats.week.firemaking.level},${stats.week.firemaking.xp},${stats.week.firemaking.rank},${stats.week.late}\n`;
        csv += `Crafting,${stats.total.crafting.level},${stats.total.crafting.xp},${stats.total.crafting.rank},${stats.today.crafting.level},${stats.today.crafting.xp},${stats.today.crafting.rank},${stats.today.late},${stats.yesterday.crafting.level},${stats.yesterday.crafting.xp},${stats.yesterday.crafting.rank},${stats.yesterday.late},${stats.week.crafting.level},${stats.week.crafting.xp},${stats.week.crafting.rank},${stats.week.late}\n`;
        csv += `Smithing,${stats.total.smithing.level},${stats.total.smithing.xp},${stats.total.smithing.rank},${stats.today.smithing.level},${stats.today.smithing.xp},${stats.today.smithing.rank},${stats.today.late},${stats.yesterday.smithing.level},${stats.yesterday.smithing.xp},${stats.yesterday.smithing.rank},${stats.yesterday.late},${stats.week.smithing.level},${stats.week.smithing.xp},${stats.week.smithing.rank},${stats.week.late}\n`;
        csv += `Mining,${stats.total.mining.level},${stats.total.mining.xp},${stats.total.mining.rank},${stats.today.mining.level},${stats.today.mining.xp},${stats.today.mining.rank},${stats.today.late},${stats.yesterday.mining.level},${stats.yesterday.mining.xp},${stats.yesterday.mining.rank},${stats.yesterday.late},${stats.week.mining.level},${stats.week.mining.xp},${stats.week.mining.rank},${stats.week.late}\n`;
        csv += `Herblore,${stats.total.herblore.level},${stats.total.herblore.xp},${stats.total.herblore.rank},${stats.today.herblore.level},${stats.today.herblore.xp},${stats.today.herblore.rank},${stats.today.late},${stats.yesterday.herblore.level},${stats.yesterday.herblore.xp},${stats.yesterday.herblore.rank},${stats.yesterday.late},${stats.week.herblore.level},${stats.week.herblore.xp},${stats.week.herblore.rank},${stats.week.late}\n`;
        csv += `Agility,${stats.total.agility.level},${stats.total.agility.xp},${stats.total.agility.rank},${stats.today.agility.level},${stats.today.agility.xp},${stats.today.agility.rank},${stats.today.late},${stats.yesterday.agility.level},${stats.yesterday.agility.xp},${stats.yesterday.agility.rank},${stats.yesterday.late},${stats.week.agility.level},${stats.week.agility.xp},${stats.week.agility.rank},${stats.week.late}\n`;
        csv += `Thieving,${stats.total.thieving.level},${stats.total.thieving.xp},${stats.total.thieving.rank},${stats.today.thieving.level},${stats.today.thieving.xp},${stats.today.thieving.rank},${stats.today.late},${stats.yesterday.thieving.level},${stats.yesterday.thieving.xp},${stats.yesterday.thieving.rank},${stats.yesterday.late},${stats.week.thieving.level},${stats.week.thieving.xp},${stats.week.thieving.rank},${stats.week.late}\n`;
        csv += `Slayer,${stats.total.slayer.level},${stats.total.slayer.xp},${stats.total.slayer.rank},${stats.today.slayer.level},${stats.today.slayer.xp},${stats.today.slayer.rank},${stats.today.late},${stats.yesterday.slayer.level},${stats.yesterday.slayer.xp},${stats.yesterday.slayer.rank},${stats.yesterday.late},${stats.week.slayer.level},${stats.week.slayer.xp},${stats.week.slayer.rank},${stats.week.late}\n`;
        csv += `Farming,${stats.total.farming.level},${stats.total.farming.xp},${stats.total.farming.rank},${stats.today.farming.level},${stats.today.farming.xp},${stats.today.farming.rank},${stats.today.late},${stats.yesterday.farming.level},${stats.yesterday.farming.xp},${stats.yesterday.farming.rank},${stats.yesterday.late},${stats.week.farming.level},${stats.week.farming.xp},${stats.week.farming.rank},${stats.week.late}\n`;
        csv += `Runecrafting,${stats.total.runecrafting.level},${stats.total.runecrafting.xp},${stats.total.runecrafting.rank},${stats.today.runecrafting.level},${stats.today.runecrafting.xp},${stats.today.runecrafting.rank},${stats.today.late},${stats.yesterday.runecrafting.level},${stats.yesterday.runecrafting.xp},${stats.yesterday.runecrafting.rank},${stats.yesterday.late},${stats.week.runecrafting.level},${stats.week.runecrafting.xp},${stats.week.runecrafting.rank},${stats.week.late}\n`;
        csv += `Hunter,${stats.total.hunter.level},${stats.total.hunter.xp},${stats.total.hunter.rank},${stats.today.hunter.level},${stats.today.hunter.xp},${stats.today.hunter.rank},${stats.today.late},${stats.yesterday.hunter.level},${stats.yesterday.hunter.xp},${stats.yesterday.hunter.rank},${stats.yesterday.late},${stats.week.hunter.level},${stats.week.hunter.xp},${stats.week.hunter.rank},${stats.week.late}\n`;
        csv += `Construction,${stats.total.construction.level},${stats.total.construction.xp},${stats.total.construction.rank},${stats.today.construction.level},${stats.today.construction.xp},${stats.today.construction.rank},${stats.today.late},${stats.yesterday.construction.level},${stats.yesterday.construction.xp},${stats.yesterday.construction.rank},${stats.yesterday.late},${stats.week.construction.level},${stats.week.construction.xp},${stats.week.construction.rank},${stats.week.late}\n`;
        csv += `Summoning,${stats.total.summoning.level},${stats.total.summoning.xp},${stats.total.summoning.rank},${stats.today.summoning.level},${stats.today.summoning.xp},${stats.today.summoning.rank},${stats.today.late},${stats.yesterday.summoning.level},${stats.yesterday.summoning.xp},${stats.yesterday.summoning.rank},${stats.yesterday.late},${stats.week.summoning.level},${stats.week.summoning.xp},${stats.week.summoning.rank},${stats.week.late}\n`;
        csv += `Dungeoneering,${stats.total.dungeoneering.level},${stats.total.dungeoneering.xp},${stats.total.dungeoneering.rank},${stats.today.dungeoneering.level},${stats.today.dungeoneering.xp},${stats.today.dungeoneering.rank},${stats.today.late},${stats.yesterday.dungeoneering.level},${stats.yesterday.dungeoneering.xp},${stats.yesterday.dungeoneering.rank},${stats.yesterday.late},${stats.week.dungeoneering.level},${stats.week.dungeoneering.xp},${stats.week.dungeoneering.rank},${stats.week.late}\n`;
        csv += `Divination,${stats.total.divination.level},${stats.total.divination.xp},${stats.total.divination.rank},${stats.today.divination.level},${stats.today.divination.xp},${stats.today.divination.rank},${stats.today.late},${stats.yesterday.divination.level},${stats.yesterday.divination.xp},${stats.yesterday.divination.rank},${stats.yesterday.late},${stats.week.divination.level},${stats.week.divination.xp},${stats.week.divination.rank},${stats.week.late}\n`;
        csv += `Invention,${stats.total.invention.level},${stats.total.invention.xp},${stats.total.invention.rank},${stats.today.invention.level},${stats.today.invention.xp},${stats.today.invention.rank},${stats.today.late},${stats.yesterday.invention.level},${stats.yesterday.invention.xp},${stats.yesterday.invention.rank},${stats.yesterday.late},${stats.week.invention.level},${stats.week.invention.xp},${stats.week.invention.rank},${stats.week.late}\n`;
        csv += `Archaeology,${stats.total.archaeology.level},${stats.total.archaeology.xp},${stats.total.archaeology.rank},${stats.today.archaeology.level},${stats.today.archaeology.xp},${stats.today.archaeology.rank},${stats.today.late},${stats.yesterday.archaeology.level},${stats.yesterday.archaeology.xp},${stats.yesterday.archaeology.rank},${stats.yesterday.late},${stats.week.archaeology.level},${stats.week.archaeology.xp},${stats.week.archaeology.rank},${stats.week.late}\n`;

        try {
          await fs.writeFile(filepath, csv);

          await interaction.reply({
            ephemeral: !isPublic,
            files: [filepath],
          });
        } finally {
          try {
            await fs.rm(filepath);
          } catch (e) {
            console.error(e);
          }
        }

        break;
      }
      default: {
        await interaction.reply({
          content: `Error: Invalid output: ${output}. Expected "Image", or "CSV".`,
          ephemeral: true,
        });
        break;
      }
    }
  },
};
