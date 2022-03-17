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

const MIN_CLAN_DAYS = 2 * 7; // 2 weeks
const MIN_CLAN_XP = 1 * 1000000; // 1 mill

const CORPORAL_MIN_DAYS = MIN_CLAN_DAYS;
const CORPORAL_MIN_XP = MIN_CLAN_XP;

const SERGEANT_MIN_DAYS = 6 * 7; // 6 weeks
const SERGEANT_MIN_XP = 15 * 1000000; // 15 mill

const LIEUTENANT_MIN_DAYS = 12 * 7; // 12 weeks
const LIEUTENANT_MIN_XP = 75 * 1000000; // 75 mill

const CAPTAIN_MIN_DAYS = 24 * 7; // 24 weeks
const CAPTAIN_MIN_XP = 200 * 1000000; // 200 mill

const GENERAL_MIN_DAYS = 52 * 7; // 52 weeks
const GENERAL_MIN_XP = 500 * 1000000; // 500 mill

const RECRUIT_FMT = `${RECRUIT}`;
const CORPORAL_FMT = `${CORPORAL} (Min 2 weeks and 1 mill clan xp)`;
const SERGEANT_FMT = `${SERGEANT} (Min 6 weeks or 15 mill clan xp)`;
const LIEUTENANT_FMT = `${LIEUTENANT} (Min 12 weeks or 75 mill clan xp)`;
const CAPTAIN_FMT = `${CAPTAIN} (Min 24 weeks or 200 mill clan xp)`;
const GENERAL_FMT = `${GENERAL} (Min 52 weeks or 500 mill clan xp)`;

const MAX_CONTENT_LENGTH = 2000;
const TRUNCATE_POSTFIX = "\n\nCont'd (message is too long)...";

const truncateContent = (content) => {
  if (content.length < MAX_CONTENT_LENGTH) {
    return content;
  }

  const lines = content.split("\n");

  let truncated = lines.shift();

  // eslint-disable-next-line no-restricted-syntax
  for (const line of lines) {
    if (
      truncated.length + line.length + TRUNCATE_POSTFIX.length >
      MAX_CONTENT_LENGTH
    ) {
      truncated += TRUNCATE_POSTFIX;
      break;
    }

    truncated += `\n${line}`;
  }

  return truncated;
};

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

    await interaction.deferReply({
      ephemeral: !isPublic,
    });

    let content = "";
    let demotionsContent = "";

    const players = await redis.getAllPlayers();

    players.forEach((player) => {
      if (player.clanXp < MIN_CLAN_XP) {
        return;
      }

      const days = Math.round(
        (unixTimestamp(dropTime(fromUnixTimestamp())) - player.dateJoined) /
          (24 * 60 * 60)
      );

      let fromRank = player.rank;
      let isTime = false;
      let isXp = false;
      let isOverPromoted = false;

      switch (player.rank) {
        case RECRUIT:
          fromRank = RECRUIT_FMT;

          // Note: Both min days & min xp are required to participate in promotions
          isTime =
            days >= CORPORAL_MIN_DAYS && player.clanXp >= CORPORAL_MIN_XP;
          isXp = isTime;
          break;
        case CORPORAL:
          fromRank = CORPORAL_FMT;

          isTime = days >= SERGEANT_MIN_DAYS;
          isXp = player.clanXp >= SERGEANT_MIN_XP;
          isOverPromoted =
            days < CORPORAL_MIN_DAYS || player.clanXp < CORPORAL_MIN_XP;
          break;
        case SERGEANT:
          fromRank = SERGEANT_FMT;

          isTime = days >= LIEUTENANT_MIN_DAYS;
          isXp = player.clanXp >= LIEUTENANT_MIN_XP;
          isOverPromoted =
            days < SERGEANT_MIN_DAYS && player.clanXp < SERGEANT_MIN_XP;
          break;
        case LIEUTENANT:
          fromRank = LIEUTENANT_FMT;

          isTime = days >= CAPTAIN_MIN_DAYS;
          isXp = player.clanXp >= CAPTAIN_MIN_XP;
          isOverPromoted =
            days < LIEUTENANT_MIN_DAYS && player.clanXp < LIEUTENANT_MIN_XP;
          break;
        case CAPTAIN:
          fromRank = CAPTAIN_FMT;

          isTime = days >= GENERAL_MIN_DAYS;
          isXp = player.clanXp >= GENERAL_MIN_XP;
          isOverPromoted =
            days < CAPTAIN_MIN_DAYS && player.clanXp < CAPTAIN_MIN_XP;
          break;
        case GENERAL:
          fromRank = GENERAL_FMT;

          isOverPromoted =
            days < GENERAL_MIN_DAYS && player.clanXp < GENERAL_MIN_XP;
          break;

        default:
          break;
      }

      if (isOverPromoted) {
        if (demotionsContent.length === 0) {
          demotionsContent +=
            "\n\n**========== Players who should be Demoted ==========**\n";
        }

        let toRankTime = RECRUIT_FMT;
        let toRankTimeLevel = 0;
        if (player.clanXp >= MIN_CLAN_XP && days > MIN_CLAN_DAYS) {
          if (days < CORPORAL_MIN_DAYS) {
            toRankTime = RECRUIT_FMT;
            toRankTimeLevel = 0;
          } else if (days < SERGEANT_MIN_DAYS) {
            toRankTime = CORPORAL_FMT;
            toRankTimeLevel = 1;
          } else if (days < LIEUTENANT_MIN_DAYS) {
            toRankTime = SERGEANT_FMT;
            toRankTimeLevel = 2;
          } else if (days < CAPTAIN_MIN_DAYS) {
            toRankTime = LIEUTENANT_FMT;
            toRankTimeLevel = 3;
          } else if (days < GENERAL_MIN_DAYS) {
            toRankTime = CAPTAIN_FMT;
            toRankTimeLevel = 4;
          }
        }

        let toRankXp = RECRUIT_FMT;
        let toRankXpLevel = 0;
        if (player.clanXp >= MIN_CLAN_XP && days > MIN_CLAN_DAYS) {
          if (player.clanXp < CORPORAL_MIN_XP) {
            toRankXp = RECRUIT_FMT;
            toRankXpLevel = 0;
          } else if (player.clanXp < SERGEANT_MIN_XP) {
            toRankXp = CORPORAL_FMT;
            toRankXpLevel = 1;
          } else if (player.clanXp < LIEUTENANT_MIN_XP) {
            toRankXp = SERGEANT_FMT;
            toRankXpLevel = 2;
          } else if (player.clanXp < CAPTAIN_MIN_XP) {
            toRankXp = LIEUTENANT_FMT;
            toRankXpLevel = 3;
          } else if (player.clanXp < GENERAL_MIN_XP) {
            toRankXp = CAPTAIN_FMT;
            toRankXpLevel = 4;
          }
        }

        const clanXp = formatNumberToLength(player.clanXp, 15).trim();

        if (toRankTimeLevel > toRankXpLevel) {
          demotionsContent += `\n**RSN:** _${player.rsn}_\n- **From:** _${fromRank}_\n- **To:** _${toRankTime}_\n- **Reason:** _Time in clan (${days} days) & Clan xp (${clanXp} xp)_\n`;
        } else {
          demotionsContent += `\n**RSN:** _${player.rsn}_\n- **From:** _${fromRank}_\n- **To:** _${toRankXp}_\n- **Reason:** _Time in clan (${days} days) & Clan xp (${clanXp} xp)_\n`;
        }

        return;
      }

      if (!isTime && !isXp) {
        return;
      }

      let toRankTime = null;
      let toRankTimeLevel = 0;
      if (isTime) {
        if (days >= GENERAL_MIN_DAYS) {
          toRankTime = GENERAL_FMT;
          toRankTimeLevel = 5;
        } else if (days >= CAPTAIN_MIN_DAYS) {
          toRankTime = CAPTAIN_FMT;
          toRankTimeLevel = 4;
        } else if (days >= LIEUTENANT_MIN_DAYS) {
          toRankTime = LIEUTENANT_FMT;
          toRankTimeLevel = 3;
        } else if (days >= SERGEANT_MIN_DAYS) {
          toRankTime = SERGEANT_FMT;
          toRankTimeLevel = 2;
        } else if (days >= CORPORAL_MIN_DAYS) {
          toRankTime = CORPORAL_FMT;
          toRankTimeLevel = 1;
        }
      }

      let toRankXp = null;
      let toRankXpLevel = 0;
      if (isXp) {
        if (player.clanXp >= GENERAL_MIN_XP) {
          toRankXp = GENERAL_FMT;
          toRankXpLevel = 5;
        } else if (player.clanXp >= CAPTAIN_MIN_XP) {
          toRankXp = CAPTAIN_FMT;
          toRankXpLevel = 4;
        } else if (player.clanXp >= LIEUTENANT_MIN_XP) {
          toRankXp = LIEUTENANT_FMT;
          toRankXpLevel = 3;
        } else if (player.clanXp >= SERGEANT_MIN_XP) {
          toRankXp = SERGEANT_FMT;
          toRankXpLevel = 2;
        } else if (player.clanXp >= CORPORAL_MIN_XP) {
          toRankXp = CORPORAL_FMT;
          toRankXpLevel = 1;
        }
      }

      if (toRankTimeLevel > toRankXpLevel) {
        content += `\n**RSN:** _${player.rsn}_\n- **From:** _${fromRank}_\n- **To:** _${toRankTime}_\n- **Reason:** _Time in clan (${days} days)_\n`;
      } else if (toRankTimeLevel < toRankXpLevel) {
        const clanXp = formatNumberToLength(player.clanXp, 15).trim();
        content += `\n**RSN:** _${player.rsn}_\n- **From:** _${fromRank}_\n- **To:** _${toRankXp}_\n- **Reason:** _Clan xp (${clanXp} xp)_\n`;
      } else {
        const clanXp = formatNumberToLength(player.clanXp, 15).trim();
        content += `\n**RSN:** _${player.rsn}_\n- **From:** _${fromRank}_\n- **To:** _${toRankTime}_\n- **Reason:** _Time in clan (${days} days) & Clan xp (${clanXp} xp)_\n`;
      }
    });

    if (content.trim().length === 0) {
      await interaction.editReply({
        content: truncateContent(
          `**There are no pending promotions.**${demotionsContent}`
        ),
        ephemeral: !isPublic,
      });
    } else {
      await interaction.editReply({
        content: truncateContent(
          `**========== Players ready for Promotion! ==========**\n${content}${demotionsContent}`
        ),
        ephemeral: !isPublic,
      });
    }
  }),
};
