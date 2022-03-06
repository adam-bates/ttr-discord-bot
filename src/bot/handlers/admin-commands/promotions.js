const { requireModUser } = require("./helpers/roles");
const {
  unixTimestamp,
  fromUnixTimestamp,
  dropTime,
} = require("../../../utils/time");
const { formatNumberToLength } = require("../../../utils/format");

const RECRUIT = "Recruit";
const CORPORAL = "Corporal";
const SERGEANT = "Sergeant";
const LIEUTENANT = "Lieutenant";
const CAPTAIN = "Captain";
const GENERAL = "General";

const MIN_CLAN_XP = 10 * 1000000; // 10 mill

const CORPORAL_MIN_DAYS = 4 * 7; // 4 weeks
const CORPORAL_MIN_XP = 15 * 1000000; // 15 mill

const SERGEANT_MIN_DAYS = 6 * 7; // 6 weeks
const SERGEANT_MIN_XP = 25 * 1000000; // 25 mill

const LIEUTENANT_MIN_DAYS = 8 * 7; // 8 weeks
const LIEUTENANT_MIN_XP = 50 * 1000000; // 50 mill

const CAPTAIN_MIN_DAYS = 12 * 7; // 12 weeks
const CAPTAIN_MIN_XP = 100 * 1000000; // 100 mill

const GENERAL_MIN_DAYS = 24 * 7; // 24 weeks
const GENERAL_MIN_XP = 200 * 1000000; // 200 mill

module.exports = {
  builder: (command) =>
    command
      .setName("promotions")
      .setDescription("List players who are ready to be promoted")
      .addBooleanOption((option) =>
        option
          .setName("public")
          .setDescription(
            "Make the output of this command public to the server"
          )
          .setRequired(false)
      ),

  execute: requireModUser(async ({ redis }, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    let content = `**Ready for Promotion!**\n`;

    const players = await redis.getAllPlayers();

    players.forEach((player) => {
      if (player.clanXp < MIN_CLAN_XP) {
        return;
      }

      const days = Math.round(
        (unixTimestamp(dropTime(fromUnixTimestamp())) - player.dateJoined) /
          (24 * 60 * 60)
      );

      let isTime = false;
      let isXp = false;

      switch (player.rank) {
        case RECRUIT:
          isTime = days >= CORPORAL_MIN_DAYS;
          isXp = player.clanXp >= CORPORAL_MIN_XP;
          break;
        case CORPORAL:
          isTime = days >= SERGEANT_MIN_DAYS;
          isXp = player.clanXp >= SERGEANT_MIN_XP;
          break;
        case SERGEANT:
          isTime = days >= LIEUTENANT_MIN_DAYS;
          isXp = player.clanXp >= LIEUTENANT_MIN_XP;
          break;
        case LIEUTENANT:
          isTime = days >= CAPTAIN_MIN_DAYS;
          isXp = player.clanXp >= CAPTAIN_MIN_XP;
          break;
        case CAPTAIN:
          isTime = days >= GENERAL_MIN_DAYS;
          isXp = player.clanXp >= GENERAL_MIN_XP;
          break;

        default:
          break;
      }

      if (!isTime && !isXp) {
        return;
      }

      let toRankTime = null;
      let toRankTimeLevel = 0;
      if (isTime) {
        if (days >= GENERAL_MIN_DAYS) {
          toRankTime = GENERAL;
          toRankTimeLevel = 5;
        } else if (days >= CAPTAIN_MIN_DAYS) {
          toRankTime = CAPTAIN;
          toRankTimeLevel = 4;
        } else if (days >= LIEUTENANT_MIN_DAYS) {
          toRankTime = LIEUTENANT;
          toRankTimeLevel = 3;
        } else if (days >= SERGEANT_MIN_DAYS) {
          toRankTime = SERGEANT;
          toRankTimeLevel = 2;
        } else if (days >= CORPORAL_MIN_DAYS) {
          toRankTime = CORPORAL;
          toRankTimeLevel = 1;
        }
      }

      let toRankXp = null;
      let toRankXpLevel = 0;
      if (isXp) {
        if (player.clanXp >= GENERAL_MIN_XP) {
          toRankXp = GENERAL;
          toRankXpLevel = 5;
        } else if (player.clanXp >= CAPTAIN_MIN_XP) {
          toRankXp = CAPTAIN;
          toRankXpLevel = 4;
        } else if (player.clanXp >= LIEUTENANT_MIN_XP) {
          toRankXp = LIEUTENANT;
          toRankXpLevel = 3;
        } else if (player.clanXp >= SERGEANT_MIN_XP) {
          toRankXp = SERGEANT;
          toRankXpLevel = 2;
        } else if (player.clanXp >= CORPORAL_MIN_XP) {
          toRankXp = CORPORAL;
          toRankXpLevel = 1;
        }
      }

      if (toRankTimeLevel > toRankXpLevel) {
        content += `\n**RSN**: _${player.rsn}_\n- From: _${player.rank}_\n- To: _${toRankTime}_\n- Reason: _Time in clan (${days} days)_\n`;
      } else if (toRankTimeLevel < toRankXpLevel) {
        const clanXp = formatNumberToLength(player.clanXp, 15).trim();
        content += `\n**RSN**: _${player.rsn}_\n- From: _${player.rank}_\n- To: _${toRankXp}_\n- Reason: _Clan xp (${clanXp} xp)_\n`;
      } else {
        const clanXp = formatNumberToLength(player.clanXp, 15).trim();
        content += `\n**RSN**: _${player.rsn}_\n- From: _${player.rank}_\n- To: _${toRankTime}_\n- Reason: _Time in clan (${days} days) & Clan xp (${clanXp} xp)_\n`;
      }
    });

    await interaction.reply({ content, ephemeral: !isPublic });
  }),
};
