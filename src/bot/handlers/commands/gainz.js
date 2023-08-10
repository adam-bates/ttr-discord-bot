const fs = require("fs").promises;
const path = require("path");
const {
  padStringToLength,
  formatNumberToLength,
  capitalizeFirst,
} = require("../../../utils/format");

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
  "necromancy",
];

const calculateGainz = ({ from, to }) =>
  statKeys.reduce(
    (gainz, key) => ({
      ...gainz,
      [key]:
        !from[key] || !from[key].xp || !to[key] || !to[key].xp
          ? "-"
          : Math.max(
              parseInt(to[key].xp.replace(/,/g, ""), 10) -
                parseInt(from[key].xp.replace(/,/g, ""), 10),
              0
            ),
    }),
    {}
  );

module.exports = {
  builder: (command) =>
    command
      .setName("gainz")
      .setDescription("Get XP gainz for a player")
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
          .addChoice("Text", "text")
          .addChoice("Image", "png")
          .addChoice("CSV", "csv")
      )
      .addBooleanOption((option) =>
        option
          .setName("public")
          .setDescription(
            "(defaults to True for this command) Make the output of this command public to the server"
          )
          .setRequired(false)
      ),

  execute: async ({ redis, page, templates }, interaction) => {
    const isPublic = interaction.options.getBoolean("public") !== false;

    const requestedRsn = interaction.options.getString("rsn");
    let rsn = requestedRsn;

    if (requestedRsn) {
      const rsns = await redis.getAllRsns();
      rsn = rsns.find((r) => r.toLowerCase() === rsn.toLowerCase());

      if (!rsn) {
        await interaction.reply({
          content: `Error! RSN ${requestedRsn} is not in the clan: ${process.env.CLAN_NAME}`,
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
          content: `Error! RSN ${rsn} is not assigned to: ${user}`,
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
        content: `${user} has no assigned RSN.\n\nYou can pass in an RSN instead, or use the command \`/ttr setrsn\` to assign a Discord user to a Runescape name.`,
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({
      ephemeral: !isPublic,
    });

    const currentStats = (await redis.getStatsByRsn(rsn)) || {};
    const todayStats = (await redis.getTodayStatsByRsn(rsn)) || {};
    const yesterdayStats = (await redis.getYesterdayStatsByRsn(rsn)) || {};
    const weekStats = (await redis.getWeekStatsByRsn(rsn)) || {};

    const datetime = new Date(currentStats.timestamp * 1000);

    const gainz = {
      rsn,
      timestamp: datetime.toUTCString(),
    };

    gainz.today = calculateGainz({
      from: todayStats || {},
      to: currentStats || {},
    });
    gainz.today.late = todayStats.late !== false;

    gainz.yesterday = calculateGainz({
      from: yesterdayStats || {},
      to: todayStats || {},
    });
    gainz.yesterday.late = yesterdayStats.late !== false;

    gainz.week = calculateGainz({
      from: weekStats || {},
      to: currentStats || {},
    });
    gainz.week.late = weekStats.late !== false;

    gainz.lateMessage =
      gainz.today.late || gainz.yesterday.late || gainz.week.late
        ? "* Data was not pulled on time and may be incorrect"
        : "";

    const output = await interaction.options.getString("output");
    switch (output && output.toLowerCase()) {
      case "png": {
        const handlebars = {
          ...gainz,
          rows: statKeys.map((statKey) => ({
            name: capitalizeFirst(statKey),
            snapshots: [
              {
                xp: gainz.today[statKey].toLocaleString(),
                xpClass:
                  gainz.today[statKey] === 0 ? "text-muted" : "text-success",
              },
              {
                xp: gainz.yesterday[statKey].toLocaleString(),
                xpClass:
                  gainz.yesterday[statKey] === 0
                    ? "text-muted"
                    : "text-success",
              },
              {
                xp: gainz.week[statKey].toLocaleString(),
                xpClass:
                  gainz.week[statKey] === 0 ? "text-muted" : "text-success",
              },
            ],
          })),
        };
        const htmlContent = templates.gainz(handlebars);

        const date = datetime.toISOString().split("T")[0];

        const filepath = path.join(
          __dirname,
          "..",
          "..",
          "..",
          "..",
          "resources",
          "temp",
          `gainz_${date}_${interaction.id}.png`
        );

        await page.setViewport({
          width: 1200,
          height: 1545,
          deviceScaleFactor: 2,
        });
        await page.setContent(htmlContent);

        try {
          await page.screenshot({ path: filepath });

          await interaction.editReply({
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
          `gainz_${date}_${interaction.id}.csv`
        );

        let csv = `${rsn},${datetime.toISOString()}\n`;
        csv += `SKILL,TODAY,YESTERDAY,THIS_WEEK\n`;
        csv += `Overall,${gainz.today.overall},${gainz.yesterday.overall},${gainz.week.overall}\n`;
        csv += `Attack,${gainz.today.attack},${gainz.yesterday.attack},${gainz.week.attack}\n`;
        csv += `Defence,${gainz.today.defence},${gainz.yesterday.defence},${gainz.week.defence}\n`;
        csv += `Strength,${gainz.today.strength},${gainz.yesterday.strength},${gainz.week.strength}\n`;
        csv += `Constitution,${gainz.today.constitution},${gainz.yesterday.constitution},${gainz.week.constitution}\n`;
        csv += `Ranged,${gainz.today.ranged},${gainz.yesterday.ranged},${gainz.week.ranged}\n`;
        csv += `Prayer,${gainz.today.prayer},${gainz.yesterday.prayer},${gainz.week.prayer}\n`;
        csv += `Magic,${gainz.today.magic},${gainz.yesterday.magic},${gainz.week.magic}\n`;
        csv += `Cooking,${gainz.today.cooking},${gainz.yesterday.cooking},${gainz.week.cooking}\n`;
        csv += `Woodcutting,${gainz.today.woodcutting},${gainz.yesterday.woodcutting},${gainz.week.woodcutting}\n`;
        csv += `Fletching,${gainz.today.fletching},${gainz.yesterday.fletching},${gainz.week.fletching}\n`;
        csv += `Fishing,${gainz.today.fishing},${gainz.yesterday.fishing},${gainz.week.fishing}\n`;
        csv += `Firemaking,${gainz.today.firemaking},${gainz.yesterday.firemaking},${gainz.week.firemaking}\n`;
        csv += `Crafting,${gainz.today.crafting},${gainz.yesterday.crafting},${gainz.week.crafting}\n`;
        csv += `Smithing,${gainz.today.smithing},${gainz.yesterday.smithing},${gainz.week.smithing}\n`;
        csv += `Mining,${gainz.today.mining},${gainz.yesterday.mining},${gainz.week.mining}\n`;
        csv += `Herblore,${gainz.today.herblore},${gainz.yesterday.herblore},${gainz.week.herblore}\n`;
        csv += `Agility,${gainz.today.agility},${gainz.yesterday.agility},${gainz.week.agility}\n`;
        csv += `Thieving,${gainz.today.thieving},${gainz.yesterday.thieving},${gainz.week.thieving}\n`;
        csv += `Slayer,${gainz.today.slayer},${gainz.yesterday.slayer},${gainz.week.slayer}\n`;
        csv += `Farming,${gainz.today.farming},${gainz.yesterday.farming},${gainz.week.farming}\n`;
        csv += `Runecrafting,${gainz.today.runecrafting},${gainz.yesterday.runecrafting},${gainz.week.runecrafting}\n`;
        csv += `Hunter,${gainz.today.hunter},${gainz.yesterday.hunter},${gainz.week.hunter}\n`;
        csv += `Construction,${gainz.today.construction},${gainz.yesterday.construction},${gainz.week.construction}\n`;
        csv += `Summoning,${gainz.today.summoning},${gainz.yesterday.summoning},${gainz.week.summoning}\n`;
        csv += `Dungeoneering,${gainz.today.dungeoneering},${gainz.yesterday.dungeoneering},${gainz.week.dungeoneering}\n`;
        csv += `Divination,${gainz.today.divination},${gainz.yesterday.divination},${gainz.week.divination}\n`;
        csv += `Invention,${gainz.today.invention},${gainz.yesterday.invention},${gainz.week.invention}\n`;
        csv += `Archaeology,${gainz.today.archaeology},${gainz.yesterday.archaeology},${gainz.week.archaeology}\n`;
        csv += `Necromancy,${gainz.today.necromancy},${gainz.yesterday.necromancy},${gainz.week.necromancy}\n`;

        try {
          await fs.writeFile(filepath, csv);

          await interaction.editReply({
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
      case "text":
      default: {
        const f_rs_name = padStringToLength(rsn, 12);
        const formatted__utc___timestamp = gainz.timestamp;

        const to_ovr = formatNumberToLength(gainz.today.overall, 9);
        const to_att = formatNumberToLength(gainz.today.attack, 9);
        const to_def = formatNumberToLength(gainz.today.defence, 9);
        const to_str = formatNumberToLength(gainz.today.strength, 9);
        const to_cst = formatNumberToLength(gainz.today.constitution, 9);
        const to_rng = formatNumberToLength(gainz.today.ranged, 9);
        const to_pry = formatNumberToLength(gainz.today.prayer, 9);
        const to_mag = formatNumberToLength(gainz.today.magic, 9);
        const to_cok = formatNumberToLength(gainz.today.cooking, 9);
        const to_wod = formatNumberToLength(gainz.today.woodcutting, 9);
        const to_fch = formatNumberToLength(gainz.today.fletching, 9);
        const to_fsh = formatNumberToLength(gainz.today.fishing, 9);
        const to_fir = formatNumberToLength(gainz.today.firemaking, 9);
        const to_crf = formatNumberToLength(gainz.today.crafting, 9);
        const to_smt = formatNumberToLength(gainz.today.smithing, 9);
        const to_min = formatNumberToLength(gainz.today.mining, 9);
        const to_hrb = formatNumberToLength(gainz.today.herblore, 9);
        const to_agl = formatNumberToLength(gainz.today.agility, 9);
        const to_thv = formatNumberToLength(gainz.today.thieving, 9);
        const to_sly = formatNumberToLength(gainz.today.slayer, 9);
        const to_frm = formatNumberToLength(gainz.today.farming, 9);
        const to_rnc = formatNumberToLength(gainz.today.runecrafting, 9);
        const to_hnt = formatNumberToLength(gainz.today.hunter, 9);
        const to_con = formatNumberToLength(gainz.today.construction, 9);
        const to_sum = formatNumberToLength(gainz.today.summoning, 9);
        const to_dng = formatNumberToLength(gainz.today.dungeoneering, 9);
        const to_div = formatNumberToLength(gainz.today.divination, 9);
        const to_inv = formatNumberToLength(gainz.today.invention, 9);
        const to_arc = formatNumberToLength(gainz.today.archaeology, 9);
        const to_nec = formatNumberToLength(gainz.today.necromancy || 0, 9);

        const ye_ovr = formatNumberToLength(gainz.yesterday.overall, 9);
        const ye_att = formatNumberToLength(gainz.yesterday.attack, 9);
        const ye_def = formatNumberToLength(gainz.yesterday.defence, 9);
        const ye_str = formatNumberToLength(gainz.yesterday.strength, 9);
        const ye_cst = formatNumberToLength(gainz.yesterday.constitution, 9);
        const ye_rng = formatNumberToLength(gainz.yesterday.ranged, 9);
        const ye_pry = formatNumberToLength(gainz.yesterday.prayer, 9);
        const ye_mag = formatNumberToLength(gainz.yesterday.magic, 9);
        const ye_cok = formatNumberToLength(gainz.yesterday.cooking, 9);
        const ye_wod = formatNumberToLength(gainz.yesterday.woodcutting, 9);
        const ye_fch = formatNumberToLength(gainz.yesterday.fletching, 9);
        const ye_fsh = formatNumberToLength(gainz.yesterday.fishing, 9);
        const ye_fir = formatNumberToLength(gainz.yesterday.firemaking, 9);
        const ye_crf = formatNumberToLength(gainz.yesterday.crafting, 9);
        const ye_smt = formatNumberToLength(gainz.yesterday.smithing, 9);
        const ye_min = formatNumberToLength(gainz.yesterday.mining, 9);
        const ye_hrb = formatNumberToLength(gainz.yesterday.herblore, 9);
        const ye_agl = formatNumberToLength(gainz.yesterday.agility, 9);
        const ye_thv = formatNumberToLength(gainz.yesterday.thieving, 9);
        const ye_sly = formatNumberToLength(gainz.yesterday.slayer, 9);
        const ye_frm = formatNumberToLength(gainz.yesterday.farming, 9);
        const ye_rnc = formatNumberToLength(gainz.yesterday.runecrafting, 9);
        const ye_hnt = formatNumberToLength(gainz.yesterday.hunter, 9);
        const ye_con = formatNumberToLength(gainz.yesterday.construction, 9);
        const ye_sum = formatNumberToLength(gainz.yesterday.summoning, 9);
        const ye_dng = formatNumberToLength(gainz.yesterday.dungeoneering, 9);
        const ye_div = formatNumberToLength(gainz.yesterday.divination, 9);
        const ye_inv = formatNumberToLength(gainz.yesterday.invention, 9);
        const ye_arc = formatNumberToLength(gainz.yesterday.archaeology, 9);
        const ye_nec = formatNumberToLength(gainz.yesterday.necromancy || 0, 9);

        const wk_ovr = formatNumberToLength(gainz.week.overall, 9);
        const wk_att = formatNumberToLength(gainz.week.attack, 9);
        const wk_def = formatNumberToLength(gainz.week.defence, 9);
        const wk_str = formatNumberToLength(gainz.week.strength, 9);
        const wk_cst = formatNumberToLength(gainz.week.constitution, 9);
        const wk_rng = formatNumberToLength(gainz.week.ranged, 9);
        const wk_pry = formatNumberToLength(gainz.week.prayer, 9);
        const wk_mag = formatNumberToLength(gainz.week.magic, 9);
        const wk_cok = formatNumberToLength(gainz.week.cooking, 9);
        const wk_wod = formatNumberToLength(gainz.week.woodcutting, 9);
        const wk_fch = formatNumberToLength(gainz.week.fletching, 9);
        const wk_fsh = formatNumberToLength(gainz.week.fishing, 9);
        const wk_fir = formatNumberToLength(gainz.week.firemaking, 9);
        const wk_crf = formatNumberToLength(gainz.week.crafting, 9);
        const wk_smt = formatNumberToLength(gainz.week.smithing, 9);
        const wk_min = formatNumberToLength(gainz.week.mining, 9);
        const wk_hrb = formatNumberToLength(gainz.week.herblore, 9);
        const wk_agl = formatNumberToLength(gainz.week.agility, 9);
        const wk_thv = formatNumberToLength(gainz.week.thieving, 9);
        const wk_sly = formatNumberToLength(gainz.week.slayer, 9);
        const wk_frm = formatNumberToLength(gainz.week.farming, 9);
        const wk_rnc = formatNumberToLength(gainz.week.runecrafting, 9);
        const wk_hnt = formatNumberToLength(gainz.week.hunter, 9);
        const wk_con = formatNumberToLength(gainz.week.construction, 9);
        const wk_sum = formatNumberToLength(gainz.week.summoning, 9);
        const wk_dng = formatNumberToLength(gainz.week.dungeoneering, 9);
        const wk_div = formatNumberToLength(gainz.week.divination, 9);
        const wk_inv = formatNumberToLength(gainz.week.invention, 9);
        const wk_arc = formatNumberToLength(gainz.week.archaeology, 9);
        const wk_nec = formatNumberToLength(gainz.week.necromancy || 0, 9);

        const tod = gainz.today.late ? "TODAY*" : "TODAY ";
        const yesterd = gainz.yesterday.late ? "YESTERDAY*" : "YESTERDAY ";
        const thisWee = gainz.week.late ? "THIS WEEK*" : "THIS WEEK ";

        let content = `
.---------------------------------------------------.
| ${f_rs_name}        ${formatted__utc___timestamp} |
|---------------------------------------------------|
|     SKILL     |   ${tod}  | ${yesterd}| ${thisWee}|
|---------------|-----------------------------------|
| Overall       | ${to_ovr} | ${ye_ovr} | ${wk_ovr} |
| Attack        | ${to_att} | ${ye_att} | ${wk_att} |
| Defence       | ${to_def} | ${ye_def} | ${wk_def} |
| Strength      | ${to_str} | ${ye_str} | ${wk_str} |
| Constitution  | ${to_cst} | ${ye_cst} | ${wk_cst} |
| Ranged        | ${to_rng} | ${ye_rng} | ${wk_rng} |
| Prayer        | ${to_pry} | ${ye_pry} | ${wk_pry} |
| Magic         | ${to_mag} | ${ye_mag} | ${wk_mag} |
| Cooking       | ${to_cok} | ${ye_cok} | ${wk_cok} |
| Woodcutting   | ${to_wod} | ${ye_wod} | ${wk_wod} |
| Fletching     | ${to_fch} | ${ye_fch} | ${wk_fch} |
| Fishing       | ${to_fsh} | ${ye_fsh} | ${wk_fsh} |
| Firemaking    | ${to_fir} | ${ye_fir} | ${wk_fir} |
| Crafting      | ${to_crf} | ${ye_crf} | ${wk_crf} |
| Smithing      | ${to_smt} | ${ye_smt} | ${wk_smt} |
| Mining        | ${to_min} | ${ye_min} | ${wk_min} |
| Herblore      | ${to_hrb} | ${ye_hrb} | ${wk_hrb} |
| Agility       | ${to_agl} | ${ye_agl} | ${wk_agl} |
| Thieving      | ${to_thv} | ${ye_thv} | ${wk_thv} |
| Slayer        | ${to_sly} | ${ye_sly} | ${wk_sly} |
| Farming       | ${to_frm} | ${ye_frm} | ${wk_frm} |
| Runecrafting  | ${to_rnc} | ${ye_rnc} | ${wk_rnc} |
| Hunter        | ${to_hnt} | ${ye_hnt} | ${wk_hnt} |
| Construction  | ${to_con} | ${ye_con} | ${wk_con} |
| Summoning     | ${to_sum} | ${ye_sum} | ${wk_sum} |
| Dungeoneering | ${to_dng} | ${ye_dng} | ${wk_dng} |
| Divination    | ${to_div} | ${ye_div} | ${wk_div} |
| Invention     | ${to_inv} | ${ye_inv} | ${wk_inv} |
| Archaeology   | ${to_arc} | ${ye_arc} | ${wk_arc} |
| Necromancy    | ${to_nec} | ${ye_nec} | ${wk_nec} |
'---------------------------------------------------'`;

        if (gainz.lateMessage.length > 0) {
          content = `${content}\n${gainz.lateMessage}`;
        }

        await interaction.editReply({
          content: `\`\`\`${content}\`\`\``,
          ephemeral: !isPublic,
        });

        break;
      }
    }
  },
};
