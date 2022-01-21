const fs = require("fs").promises;
const path = require("path");

const alignToLength = (value, length, side = "left") => {
  let output = `${value}`;

  while (output.length < length) {
    output = side === "right" ? ` ${output}` : `${output} `;
  }

  return output;
};

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
          ? "-"
          : parseInt(to[key].replace(/,/g, ""), 10) -
            parseInt(from[key].replace(/,/g, ""), 10),
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

    const currentStats = await redis.getStatsByRsn(rsn);
    const todayStats = await redis.getTodayStatsByRsn(rsn);
    const yesterdayStats = await redis.getYesterdayStatsByRsn(rsn);
    const weekStats = await redis.getWeekStatsByRsn(rsn);

    const datetime = new Date(currentStats.timestamp * 1000);

    const gainz = {
      rsn,
      timestamp: datetime.toUTCString(),
    };
    gainz.today = calculateGainz({
      from: todayStats || {},
      to: currentStats || {},
    });
    gainz.yesterday = calculateGainz({
      from: yesterdayStats || {},
      to: todayStats || {},
    });
    gainz.week = calculateGainz({
      from: weekStats || {},
      to: currentStats || {},
    });

    const output = await interaction.options.getString("output");
    switch (output && output.toLowerCase()) {
      case null:
      case "text": {
        const f_rs_name = alignToLength(rsn, 12);
        const formatted__utc___timestamp = new Date().toUTCString();

        const to_ovr = alignToLength(gainz.today.overall, 9, "right");
        const to_att = alignToLength(gainz.today.attack, 9, "right");
        const to_def = alignToLength(gainz.today.defence, 9, "right");
        const to_str = alignToLength(gainz.today.strength, 9, "right");
        const to_cst = alignToLength(gainz.today.constitution, 9, "right");
        const to_rng = alignToLength(gainz.today.ranged, 9, "right");
        const to_pry = alignToLength(gainz.today.prayer, 9, "right");
        const to_mag = alignToLength(gainz.today.magic, 9, "right");
        const to_cok = alignToLength(gainz.today.cooking, 9, "right");
        const to_wod = alignToLength(gainz.today.woodcutting, 9, "right");
        const to_fch = alignToLength(gainz.today.fletching, 9, "right");
        const to_fsh = alignToLength(gainz.today.fishing, 9, "right");
        const to_fir = alignToLength(gainz.today.firemaking, 9, "right");
        const to_crf = alignToLength(gainz.today.crafting, 9, "right");
        const to_smt = alignToLength(gainz.today.smithing, 9, "right");
        const to_min = alignToLength(gainz.today.mining, 9, "right");
        const to_hrb = alignToLength(gainz.today.herblore, 9, "right");
        const to_agl = alignToLength(gainz.today.agility, 9, "right");
        const to_thv = alignToLength(gainz.today.thieving, 9, "right");
        const to_sly = alignToLength(gainz.today.slayer, 9, "right");
        const to_frm = alignToLength(gainz.today.farming, 9, "right");
        const to_rnc = alignToLength(gainz.today.runecrafting, 9, "right");
        const to_hnt = alignToLength(gainz.today.hunter, 9, "right");
        const to_con = alignToLength(gainz.today.construction, 9, "right");
        const to_sum = alignToLength(gainz.today.summoning, 9, "right");
        const to_dng = alignToLength(gainz.today.dungeoneering, 9, "right");
        const to_div = alignToLength(gainz.today.divination, 9, "right");
        const to_inv = alignToLength(gainz.today.invention, 9, "right");
        const to_arc = alignToLength(gainz.today.archaeology, 9, "right");

        const ye_ovr = alignToLength(gainz.yesterday.overall, 9, "right");
        const ye_att = alignToLength(gainz.yesterday.attack, 9, "right");
        const ye_def = alignToLength(gainz.yesterday.defence, 9, "right");
        const ye_str = alignToLength(gainz.yesterday.strength, 9, "right");
        const ye_cst = alignToLength(gainz.yesterday.constitution, 9, "right");
        const ye_rng = alignToLength(gainz.yesterday.ranged, 9, "right");
        const ye_pry = alignToLength(gainz.yesterday.prayer, 9, "right");
        const ye_mag = alignToLength(gainz.yesterday.magic, 9, "right");
        const ye_cok = alignToLength(gainz.yesterday.cooking, 9, "right");
        const ye_wod = alignToLength(gainz.yesterday.woodcutting, 9, "right");
        const ye_fch = alignToLength(gainz.yesterday.fletching, 9, "right");
        const ye_fsh = alignToLength(gainz.yesterday.fishing, 9, "right");
        const ye_fir = alignToLength(gainz.yesterday.firemaking, 9, "right");
        const ye_crf = alignToLength(gainz.yesterday.crafting, 9, "right");
        const ye_smt = alignToLength(gainz.yesterday.smithing, 9, "right");
        const ye_min = alignToLength(gainz.yesterday.mining, 9, "right");
        const ye_hrb = alignToLength(gainz.yesterday.herblore, 9, "right");
        const ye_agl = alignToLength(gainz.yesterday.agility, 9, "right");
        const ye_thv = alignToLength(gainz.yesterday.thieving, 9, "right");
        const ye_sly = alignToLength(gainz.yesterday.slayer, 9, "right");
        const ye_frm = alignToLength(gainz.yesterday.farming, 9, "right");
        const ye_rnc = alignToLength(gainz.yesterday.runecrafting, 9, "right");
        const ye_hnt = alignToLength(gainz.yesterday.hunter, 9, "right");
        const ye_con = alignToLength(gainz.yesterday.construction, 9, "right");
        const ye_sum = alignToLength(gainz.yesterday.summoning, 9, "right");
        const ye_dng = alignToLength(gainz.yesterday.dungeoneering, 9, "right");
        const ye_div = alignToLength(gainz.yesterday.divination, 9, "right");
        const ye_inv = alignToLength(gainz.yesterday.invention, 9, "right");
        const ye_arc = alignToLength(gainz.yesterday.archaeology, 9, "right");

        const week_ovr = alignToLength(gainz.week.overall, 11, "right");
        const week_att = alignToLength(gainz.week.attack, 11, "right");
        const week_def = alignToLength(gainz.week.defence, 11, "right");
        const week_str = alignToLength(gainz.week.strength, 11, "right");
        const week_cst = alignToLength(gainz.week.constitution, 11, "right");
        const week_rng = alignToLength(gainz.week.ranged, 11, "right");
        const week_pry = alignToLength(gainz.week.prayer, 11, "right");
        const week_mag = alignToLength(gainz.week.magic, 11, "right");
        const week_cok = alignToLength(gainz.week.cooking, 11, "right");
        const week_wod = alignToLength(gainz.week.woodcutting, 11, "right");
        const week_fch = alignToLength(gainz.week.fletching, 11, "right");
        const week_fsh = alignToLength(gainz.week.fishing, 11, "right");
        const week_fir = alignToLength(gainz.week.firemaking, 11, "right");
        const week_crf = alignToLength(gainz.week.crafting, 11, "right");
        const week_smt = alignToLength(gainz.week.smithing, 11, "right");
        const week_min = alignToLength(gainz.week.mining, 11, "right");
        const week_hrb = alignToLength(gainz.week.herblore, 11, "right");
        const week_agl = alignToLength(gainz.week.agility, 11, "right");
        const week_thv = alignToLength(gainz.week.thieving, 11, "right");
        const week_sly = alignToLength(gainz.week.slayer, 11, "right");
        const week_frm = alignToLength(gainz.week.farming, 11, "right");
        const week_rnc = alignToLength(gainz.week.runecrafting, 11, "right");
        const week_hnt = alignToLength(gainz.week.hunter, 11, "right");
        const week_con = alignToLength(gainz.week.construction, 11, "right");
        const week_sum = alignToLength(gainz.week.summoning, 11, "right");
        const week_dng = alignToLength(gainz.week.dungeoneering, 11, "right");
        const week_div = alignToLength(gainz.week.divination, 11, "right");
        const week_inv = alignToLength(gainz.week.invention, 11, "right");
        const week_arc = alignToLength(gainz.week.archaeology, 11, "right");

        // TODO: Shrink today and yesterday numbers >= 10m to use notation, like "11.43 M"
        // TODO: Shrink this week numbers >= 100m to use notation, like "100.24 M"
        const content = `\`\`\`
.-----------------------------------------------------.
| ${f_rs_name}          ${formatted__utc___timestamp} |
|-----------------------------------------------------|
|     SKILL     |   TODAY   | YESTERDAY |  THIS WEEK  |
|---------------|-------------------------------------|
| Overall       | ${to_ovr} | ${ye_ovr} | ${week_ovr} |
| Attack        | ${to_att} | ${ye_att} | ${week_att} |
| Defence       | ${to_def} | ${ye_def} | ${week_def} |
| Strength      | ${to_str} | ${ye_str} | ${week_str} |
| Constitution  | ${to_cst} | ${ye_cst} | ${week_cst} |
| Ranged        | ${to_rng} | ${ye_rng} | ${week_rng} |
| Prayer        | ${to_pry} | ${ye_pry} | ${week_pry} |
| Magic         | ${to_mag} | ${ye_mag} | ${week_mag} |
| Cooking       | ${to_cok} | ${ye_cok} | ${week_cok} |
| Woodcutting   | ${to_wod} | ${ye_wod} | ${week_wod} |
| Fletching     | ${to_fch} | ${ye_fch} | ${week_fch} |
| Fishing       | ${to_fsh} | ${ye_fsh} | ${week_fsh} |
| Firemaking    | ${to_fir} | ${ye_fir} | ${week_fir} |
| Crafting      | ${to_crf} | ${ye_crf} | ${week_crf} |
| Smithing      | ${to_smt} | ${ye_smt} | ${week_smt} |
| Mining        | ${to_min} | ${ye_min} | ${week_min} |
| Herblore      | ${to_hrb} | ${ye_hrb} | ${week_hrb} |
| Agility       | ${to_agl} | ${ye_agl} | ${week_agl} |
| Thieving      | ${to_thv} | ${ye_thv} | ${week_thv} |
| Slayer        | ${to_sly} | ${ye_sly} | ${week_sly} |
| Farming       | ${to_frm} | ${ye_frm} | ${week_frm} |
| Runecrafting  | ${to_rnc} | ${ye_rnc} | ${week_rnc} |
| Hunter        | ${to_hnt} | ${ye_hnt} | ${week_hnt} |
| Construction  | ${to_con} | ${ye_con} | ${week_con} |
| Summoning     | ${to_sum} | ${ye_sum} | ${week_sum} |
| Dungeoneering | ${to_dng} | ${ye_dng} | ${week_dng} |
| Divination    | ${to_div} | ${ye_div} | ${week_div} |
| Invention     | ${to_inv} | ${ye_inv} | ${week_inv} |
| Archaeology   | ${to_arc} | ${ye_arc} | ${week_arc} |
'-----------------------------------------------------'
\`\`\``;
        await interaction.reply({
          content,
          ephemeral: !isPublic,
        });
        break;
      }
      case "png": {
        const htmlContent = templates.gainz(gainz);

        const date = datetime.toISOString().split("T")[0];

        const filepath = path.join(
          process.env.PWD,
          "resources",
          `${date}_${interaction.id}.png`
        );

        await page.setViewport({
          width: 650,
          height: 1358,
          deviceScaleFactor: 2,
        });
        await page.setContent(htmlContent);
        await page.screenshot({ path: filepath });

        await interaction.reply({
          ephemeral: !isPublic,
          files: [filepath],
        });

        await fs.rm(filepath);
        break;
      }
      case "csv": {
        const date = datetime.toISOString().split("T")[0];

        const filepath = path.join(
          process.env.PWD,
          "resources",
          `${date}_${interaction.id}.csv`
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

        await fs.writeFile(filepath, csv);

        await interaction.reply({
          ephemeral: !isPublic,
          files: [filepath],
        });

        await fs.rm(filepath);
        break;
      }
      default: {
        await interaction.reply({
          content: `Error: Invalid output: ${output}. Expected "Text", "Image", or "CSV".`,
          ephemeral: true,
        });
        break;
      }
    }
  },
};
