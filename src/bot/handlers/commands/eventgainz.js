const { fromUnixTimestamp } = require("../../../utils/time");
const {
  padStringToLength,
  formatNumberToLength,
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
      .setName("eventgainz")
      .setDescription("Get XP gainz for a player during an event")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("Name of the event")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("rsn")
          .setDescription("In-game Runescape name")
          .setRequired(false)
      )
      .addUserOption((option) =>
        option.setName("user").setDescription("Discord user").setRequired(false)
      )
      .addBooleanOption((option) =>
        option
          .setName("public")
          .setDescription(
            "(defaults to True for this command) Make the output of this command public to the server"
          )
          .setRequired(false)
      ),

  execute: async ({ redis }, interaction) => {
    const isPublic = interaction.options.getBoolean("public") !== false;

    const name = interaction.options.getString("name");

    const details = await redis.getEventDetails(name);

    if (!details) {
      await interaction.reply({
        content: `Error: Event \`${name}\` doesn't exist!`,
        ephemeral: true,
      });
      return;
    }

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

    const startStats = await redis.getStartEventStatsByRsn(name, rsn);

    let endStats;

    if (details.end) {
      endStats = await redis.getEndEventStatsByRsn(name, rsn);
    } else {
      endStats = await redis.getStatsByRsn(rsn);
    }

    const currentStats = (await redis.getStatsByRsn(rsn)) || {};
    const todayStats = (await redis.getTodayStatsByRsn(rsn)) || {};

    const gainz = { rsn };

    gainz.today = calculateGainz({ from: todayStats, to: currentStats });
    gainz.event = calculateGainz({ from: startStats, to: endStats });

    const formatted_utc________start = fromUnixTimestamp(
      startStats.timestamp
    ).toUTCString();

    const formatted_utc__________end = fromUnixTimestamp(
      endStats.timestamp
    ).toUTCString();

    const f_evt_name = padStringToLength(name, 13);
    const f_rs_name = padStringToLength(rsn, 12);

    const to_______ovr = formatNumberToLength(gainz.today.overall, 15);
    const to_______att = formatNumberToLength(gainz.today.attack, 15);
    const to_______def = formatNumberToLength(gainz.today.defence, 15);
    const to_______str = formatNumberToLength(gainz.today.strength, 15);
    const to_______cst = formatNumberToLength(gainz.today.constitution, 15);
    const to_______rng = formatNumberToLength(gainz.today.ranged, 15);
    const to_______pry = formatNumberToLength(gainz.today.prayer, 15);
    const to_______mag = formatNumberToLength(gainz.today.magic, 15);
    const to_______cok = formatNumberToLength(gainz.today.cooking, 15);
    const to_______wod = formatNumberToLength(gainz.today.woodcutting, 15);
    const to_______fch = formatNumberToLength(gainz.today.fletching, 15);
    const to_______fsh = formatNumberToLength(gainz.today.fishing, 15);
    const to_______fir = formatNumberToLength(gainz.today.firemaking, 15);
    const to_______crf = formatNumberToLength(gainz.today.crafting, 15);
    const to_______smt = formatNumberToLength(gainz.today.smithing, 15);
    const to_______min = formatNumberToLength(gainz.today.mining, 15);
    const to_______hrb = formatNumberToLength(gainz.today.herblore, 15);
    const to_______agl = formatNumberToLength(gainz.today.agility, 15);
    const to_______thv = formatNumberToLength(gainz.today.thieving, 15);
    const to_______sly = formatNumberToLength(gainz.today.slayer, 15);
    const to_______frm = formatNumberToLength(gainz.today.farming, 15);
    const to_______rnc = formatNumberToLength(gainz.today.runecrafting, 15);
    const to_______hnt = formatNumberToLength(gainz.today.hunter, 15);
    const to_______con = formatNumberToLength(gainz.today.construction, 15);
    const to_______sum = formatNumberToLength(gainz.today.summoning, 15);
    const to_______dng = formatNumberToLength(gainz.today.dungeoneering, 15);
    const to_______div = formatNumberToLength(gainz.today.divination, 15);
    const to_______inv = formatNumberToLength(gainz.today.invention, 15);
    const to_______arc = formatNumberToLength(gainz.today.archaeology, 15);

    const ev_______ovr = formatNumberToLength(gainz.event.overall, 15);
    const ev_______att = formatNumberToLength(gainz.event.attack, 15);
    const ev_______def = formatNumberToLength(gainz.event.defence, 15);
    const ev_______str = formatNumberToLength(gainz.event.strength, 15);
    const ev_______cst = formatNumberToLength(gainz.event.constitution, 15);
    const ev_______rng = formatNumberToLength(gainz.event.ranged, 15);
    const ev_______pry = formatNumberToLength(gainz.event.prayer, 15);
    const ev_______mag = formatNumberToLength(gainz.event.magic, 15);
    const ev_______cok = formatNumberToLength(gainz.event.cooking, 15);
    const ev_______wod = formatNumberToLength(gainz.event.woodcutting, 15);
    const ev_______fch = formatNumberToLength(gainz.event.fletching, 15);
    const ev_______fsh = formatNumberToLength(gainz.event.fishing, 15);
    const ev_______fir = formatNumberToLength(gainz.event.firemaking, 15);
    const ev_______crf = formatNumberToLength(gainz.event.crafting, 15);
    const ev_______smt = formatNumberToLength(gainz.event.smithing, 15);
    const ev_______min = formatNumberToLength(gainz.event.mining, 15);
    const ev_______hrb = formatNumberToLength(gainz.event.herblore, 15);
    const ev_______agl = formatNumberToLength(gainz.event.agility, 15);
    const ev_______thv = formatNumberToLength(gainz.event.thieving, 15);
    const ev_______sly = formatNumberToLength(gainz.event.slayer, 15);
    const ev_______frm = formatNumberToLength(gainz.event.farming, 15);
    const ev_______rnc = formatNumberToLength(gainz.event.runecrafting, 15);
    const ev_______hnt = formatNumberToLength(gainz.event.hunter, 15);
    const ev_______con = formatNumberToLength(gainz.event.construction, 15);
    const ev_______sum = formatNumberToLength(gainz.event.summoning, 15);
    const ev_______dng = formatNumberToLength(gainz.event.dungeoneering, 15);
    const ev_______div = formatNumberToLength(gainz.event.divination, 15);
    const ev_______inv = formatNumberToLength(gainz.event.invention, 15);
    const ev_______arc = formatNumberToLength(gainz.event.archaeology, 15);

    const td = "TODAY";
    const ev = "EVENT";

    const content = `
.---------------------------------------------------.
| ${f_evt_name} From: ${formatted_utc________start} |
| ${f_rs_name}    To: ${formatted_utc__________end} |
|---------------------------------------------------|
|     SKILL     |      ${td}      |      ${ev}      |
|---------------|-----------------------------------|
| Overall       | ${to_______ovr} | ${ev_______ovr} |
| Attack        | ${to_______att} | ${ev_______att} |
| Defence       | ${to_______def} | ${ev_______def} |
| Strength      | ${to_______str} | ${ev_______str} |
| Constitution  | ${to_______cst} | ${ev_______cst} |
| Ranged        | ${to_______rng} | ${ev_______rng} |
| Prayer        | ${to_______pry} | ${ev_______pry} |
| Magic         | ${to_______mag} | ${ev_______mag} |
| Cooking       | ${to_______cok} | ${ev_______cok} |
| Woodcutting   | ${to_______wod} | ${ev_______wod} |
| Fletching     | ${to_______fch} | ${ev_______fch} |
| Fishing       | ${to_______fsh} | ${ev_______fsh} |
| Firemaking    | ${to_______fir} | ${ev_______fir} |
| Crafting      | ${to_______crf} | ${ev_______crf} |
| Smithing      | ${to_______smt} | ${ev_______smt} |
| Mining        | ${to_______min} | ${ev_______min} |
| Herblore      | ${to_______hrb} | ${ev_______hrb} |
| Agility       | ${to_______agl} | ${ev_______agl} |
| Thieving      | ${to_______thv} | ${ev_______thv} |
| Slayer        | ${to_______sly} | ${ev_______sly} |
| Farming       | ${to_______frm} | ${ev_______frm} |
| Runecrafting  | ${to_______rnc} | ${ev_______rnc} |
| Hunter        | ${to_______hnt} | ${ev_______hnt} |
| Construction  | ${to_______con} | ${ev_______con} |
| Summoning     | ${to_______sum} | ${ev_______sum} |
| Dungeoneering | ${to_______dng} | ${ev_______dng} |
| Divination    | ${to_______div} | ${ev_______div} |
| Invention     | ${to_______inv} | ${ev_______inv} |
| Archaeology   | ${to_______arc} | ${ev_______arc} |
'---------------------------------------------------'`;

    await interaction.editReply({
      content: `\`\`\`${content}\`\`\``,
      ephemeral: !isPublic,
    });
  },
};
