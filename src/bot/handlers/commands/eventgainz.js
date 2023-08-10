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
  "necromancy",
];

const calculateGainz = ({ from, to }) =>
  statKeys.reduce(
    (gainz, key) => {
      let total = "-";
      let weighted = "-";

      if (from && from[key] && from[key].xp && to && to[key] && to[key].xp) {
        const fromXp = parseInt(from[key].xp.replace(/,/g, ""), 10);
        const toXp = parseInt(to[key].xp.replace(/,/g, ""), 10);

        total = Math.max(toXp - fromXp, 0);
        weighted = total / fromXp;
      }

      return {
        event: { ...gainz.event, [key]: total },
        weighted: { ...gainz.weighted, [key]: weighted },
      };
    },
    { event: {}, weighted: {} }
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
          .setRequired(false)
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

    const gainz = { rsn, event: null, weighted: null };

    const { event, weighted } = calculateGainz({
      from: startStats,
      to: endStats,
    });
    gainz.event = event;
    gainz.weighted = weighted;

    const formatted_utc________start = fromUnixTimestamp(
      startStats.timestamp
    ).toUTCString();

    const formatted_utc__________end = fromUnixTimestamp(
      endStats.timestamp
    ).toUTCString();

    const f_evt_name = padStringToLength(name, 13);
    const f_rs_name = padStringToLength(rsn, 12);

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
    const ev_______nec = formatNumberToLength(gainz.event.necromancy || 0, 15);

    const wt_____ovr = formatNumberToLength(gainz.weighted.overall, 13);
    const wt_____att = formatNumberToLength(gainz.weighted.attack, 13);
    const wt_____def = formatNumberToLength(gainz.weighted.defence, 13);
    const wt_____str = formatNumberToLength(gainz.weighted.strength, 13);
    const wt_____cst = formatNumberToLength(gainz.weighted.constitution, 13);
    const wt_____rng = formatNumberToLength(gainz.weighted.ranged, 13);
    const wt_____pry = formatNumberToLength(gainz.weighted.prayer, 13);
    const wt_____mag = formatNumberToLength(gainz.weighted.magic, 13);
    const wt_____cok = formatNumberToLength(gainz.weighted.cooking, 13);
    const wt_____wod = formatNumberToLength(gainz.weighted.woodcutting, 13);
    const wt_____fch = formatNumberToLength(gainz.weighted.fletching, 13);
    const wt_____fsh = formatNumberToLength(gainz.weighted.fishing, 13);
    const wt_____fir = formatNumberToLength(gainz.weighted.firemaking, 13);
    const wt_____crf = formatNumberToLength(gainz.weighted.crafting, 13);
    const wt_____smt = formatNumberToLength(gainz.weighted.smithing, 13);
    const wt_____min = formatNumberToLength(gainz.weighted.mining, 13);
    const wt_____hrb = formatNumberToLength(gainz.weighted.herblore, 13);
    const wt_____agl = formatNumberToLength(gainz.weighted.agility, 13);
    const wt_____thv = formatNumberToLength(gainz.weighted.thieving, 13);
    const wt_____sly = formatNumberToLength(gainz.weighted.slayer, 13);
    const wt_____frm = formatNumberToLength(gainz.weighted.farming, 13);
    const wt_____rnc = formatNumberToLength(gainz.weighted.runecrafting, 13);
    const wt_____hnt = formatNumberToLength(gainz.weighted.hunter, 13);
    const wt_____con = formatNumberToLength(gainz.weighted.construction, 13);
    const wt_____sum = formatNumberToLength(gainz.weighted.summoning, 13);
    const wt_____dng = formatNumberToLength(gainz.weighted.dungeoneering, 13);
    const wt_____div = formatNumberToLength(gainz.weighted.divination, 13);
    const wt_____inv = formatNumberToLength(gainz.weighted.invention, 13);
    const wt_____arc = formatNumberToLength(gainz.weighted.archaeology, 13);
    const wt_____nec = formatNumberToLength(gainz.weighted.necromancy || 0, 13);

    const content = `
.---------------------------------------------------.
| ${f_evt_name} From: ${formatted_utc________start} |
| ${f_rs_name}    To: ${formatted_utc__________end} |
|---------------------------------------------------|
|     SKILL     |      TOTAL      |    WEIGHTED     |
|---------------|-----------------------------------|
| Overall       | ${ev_______ovr} | ${wt_____ovr} % |
| Attack        | ${ev_______att} | ${wt_____att} % |
| Defence       | ${ev_______def} | ${wt_____def} % |
| Strength      | ${ev_______str} | ${wt_____str} % |
| Constitution  | ${ev_______cst} | ${wt_____cst} % |
| Ranged        | ${ev_______rng} | ${wt_____rng} % |
| Prayer        | ${ev_______pry} | ${wt_____pry} % |
| Magic         | ${ev_______mag} | ${wt_____mag} % |
| Cooking       | ${ev_______cok} | ${wt_____cok} % |
| Woodcutting   | ${ev_______wod} | ${wt_____wod} % |
| Fletching     | ${ev_______fch} | ${wt_____fch} % |
| Fishing       | ${ev_______fsh} | ${wt_____fsh} % |
| Firemaking    | ${ev_______fir} | ${wt_____fir} % |
| Crafting      | ${ev_______crf} | ${wt_____crf} % |
| Smithing      | ${ev_______smt} | ${wt_____smt} % |
| Mining        | ${ev_______min} | ${wt_____min} % |
| Herblore      | ${ev_______hrb} | ${wt_____hrb} % |
| Agility       | ${ev_______agl} | ${wt_____agl} % |
| Thieving      | ${ev_______thv} | ${wt_____thv} % |
| Slayer        | ${ev_______sly} | ${wt_____sly} % |
| Farming       | ${ev_______frm} | ${wt_____frm} % |
| Runecrafting  | ${ev_______rnc} | ${wt_____rnc} % |
| Hunter        | ${ev_______hnt} | ${wt_____hnt} % |
| Construction  | ${ev_______con} | ${wt_____con} % |
| Summoning     | ${ev_______sum} | ${wt_____sum} % |
| Dungeoneering | ${ev_______dng} | ${wt_____dng} % |
| Divination    | ${ev_______div} | ${wt_____div} % |
| Invention     | ${ev_______inv} | ${wt_____inv} % |
| Archaeology   | ${ev_______arc} | ${wt_____arc} % |
| Necromancy    | ${ev_______nec} | ${wt_____nec} % |
'---------------------------------------------------'`;

    await interaction.editReply({
      content: `\`\`\`${content}\`\`\``,
      ephemeral: !isPublic,
    });
  },
};
