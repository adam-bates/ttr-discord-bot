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
    const isPublic = interaction.options.getBoolean("public") === false;

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

    const to_______ovr = formatNumberToLength(gainz.today.overall, 9);
    const to_______att = formatNumberToLength(gainz.today.attack, 9);
    const to_______def = formatNumberToLength(gainz.today.defence, 9);
    const to_______str = formatNumberToLength(gainz.today.strength, 9);
    const to_______cst = formatNumberToLength(gainz.today.constitution, 9);
    const to_______rng = formatNumberToLength(gainz.today.ranged, 9);
    const to_______pry = formatNumberToLength(gainz.today.prayer, 9);
    const to_______mag = formatNumberToLength(gainz.today.magic, 9);
    const to_______cok = formatNumberToLength(gainz.today.cooking, 9);
    const to_______wod = formatNumberToLength(gainz.today.woodcutting, 9);
    const to_______fch = formatNumberToLength(gainz.today.fletching, 9);
    const to_______fsh = formatNumberToLength(gainz.today.fishing, 9);
    const to_______fir = formatNumberToLength(gainz.today.firemaking, 9);
    const to_______crf = formatNumberToLength(gainz.today.crafting, 9);
    const to_______smt = formatNumberToLength(gainz.today.smithing, 9);
    const to_______min = formatNumberToLength(gainz.today.mining, 9);
    const to_______hrb = formatNumberToLength(gainz.today.herblore, 9);
    const to_______agl = formatNumberToLength(gainz.today.agility, 9);
    const to_______thv = formatNumberToLength(gainz.today.thieving, 9);
    const to_______sly = formatNumberToLength(gainz.today.slayer, 9);
    const to_______frm = formatNumberToLength(gainz.today.farming, 9);
    const to_______rnc = formatNumberToLength(gainz.today.runecrafting, 9);
    const to_______hnt = formatNumberToLength(gainz.today.hunter, 9);
    const to_______con = formatNumberToLength(gainz.today.construction, 9);
    const to_______sum = formatNumberToLength(gainz.today.summoning, 9);
    const to_______dng = formatNumberToLength(gainz.today.dungeoneering, 9);
    const to_______div = formatNumberToLength(gainz.today.divination, 9);
    const to_______inv = formatNumberToLength(gainz.today.invention, 9);
    const to_______arc = formatNumberToLength(gainz.today.archaeology, 9);

    const ev________ovr = formatNumberToLength(gainz.yesterday.overall, 9);
    const ev________att = formatNumberToLength(gainz.yesterday.attack, 9);
    const ev________def = formatNumberToLength(gainz.yesterday.defence, 9);
    const ev________str = formatNumberToLength(gainz.yesterday.strength, 9);
    const ev________cst = formatNumberToLength(gainz.yesterday.constitution, 9);
    const ev________rng = formatNumberToLength(gainz.yesterday.ranged, 9);
    const ev________pry = formatNumberToLength(gainz.yesterday.prayer, 9);
    const ev________mag = formatNumberToLength(gainz.yesterday.magic, 9);
    const ev________cok = formatNumberToLength(gainz.yesterday.cooking, 9);
    const ev________wod = formatNumberToLength(gainz.yesterday.woodcutting, 9);
    const ev________fch = formatNumberToLength(gainz.yesterday.fletching, 9);
    const ev________fsh = formatNumberToLength(gainz.yesterday.fishing, 9);
    const ev________fir = formatNumberToLength(gainz.yesterday.firemaking, 9);
    const ev________crf = formatNumberToLength(gainz.yesterday.crafting, 9);
    const ev________smt = formatNumberToLength(gainz.yesterday.smithing, 9);
    const ev________min = formatNumberToLength(gainz.yesterday.mining, 9);
    const ev________hrb = formatNumberToLength(gainz.yesterday.herblore, 9);
    const ev________agl = formatNumberToLength(gainz.yesterday.agility, 9);
    const ev________thv = formatNumberToLength(gainz.yesterday.thieving, 9);
    const ev________sly = formatNumberToLength(gainz.yesterday.slayer, 9);
    const ev________frm = formatNumberToLength(gainz.yesterday.farming, 9);
    const ev________rnc = formatNumberToLength(gainz.yesterday.runecrafting, 9);
    const ev________hnt = formatNumberToLength(gainz.yesterday.hunter, 9);
    const ev________con = formatNumberToLength(gainz.yesterday.construction, 9);
    const ev________sum = formatNumberToLength(gainz.yesterday.summoning, 9);
    const ev________dng = formatNumberToLength(
      gainz.yesterday.dungeoneering,
      9
    );
    const ev________div = formatNumberToLength(gainz.yesterday.divination, 9);
    const ev________inv = formatNumberToLength(gainz.yesterday.invention, 9);
    const ev________arc = formatNumberToLength(gainz.yesterday.archaeology, 9);

    const td = "TODAY";
    const ev = "EVENT";

    const content = `
.---------------------------------------------------.
| ${f_evt_name} From: ${formatted_utc________start} |
| ${f_rs_name}    To: ${formatted_utc__________end} |
|---------------------------------------------------|
|     SKILL     |      ${td}      |      ${ev}      |
|---------------|-----------------------------------|
| Overall       | ${to_______ovr} | ${ev________ovr}|
| Attack        | ${to_______att} | ${ev________att}|
| Defence       | ${to_______def} | ${ev________def}|
| Strength      | ${to_______str} | ${ev________str}|
| Constitution  | ${to_______cst} | ${ev________cst}|
| Ranged        | ${to_______rng} | ${ev________rng}|
| Prayer        | ${to_______pry} | ${ev________pry}|
| Magic         | ${to_______mag} | ${ev________mag}|
| Cooking       | ${to_______cok} | ${ev________cok}|
| Woodcutting   | ${to_______wod} | ${ev________wod}|
| Fletching     | ${to_______fch} | ${ev________fch}|
| Fishing       | ${to_______fsh} | ${ev________fsh}|
| Firemaking    | ${to_______fir} | ${ev________fir}|
| Crafting      | ${to_______crf} | ${ev________crf}|
| Smithing      | ${to_______smt} | ${ev________smt}|
| Mining        | ${to_______min} | ${ev________min}|
| Herblore      | ${to_______hrb} | ${ev________hrb}|
| Agility       | ${to_______agl} | ${ev________agl}|
| Thieving      | ${to_______thv} | ${ev________thv}|
| Slayer        | ${to_______sly} | ${ev________sly}|
| Farming       | ${to_______frm} | ${ev________frm}|
| Runecrafting  | ${to_______rnc} | ${ev________rnc}|
| Hunter        | ${to_______hnt} | ${ev________hnt}|
| Construction  | ${to_______con} | ${ev________con}|
| Summoning     | ${to_______sum} | ${ev________sum}|
| Dungeoneering | ${to_______dng} | ${ev________dng}|
| Divination    | ${to_______div} | ${ev________div}|
| Invention     | ${to_______inv} | ${ev________inv}|
| Archaeology   | ${to_______arc} | ${ev________arc}|
'---------------------------------------------------'`;

    await interaction.editReply({
      content: `\`\`\`${content}\`\`\``,
      ephemeral: !isPublic,
    });
  },
};
