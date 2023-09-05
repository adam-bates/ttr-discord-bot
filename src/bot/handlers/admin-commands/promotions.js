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
const ADMIN = "Admin";
const ORGANIZER = "Organizer";
const COORDINATOR = "Coordinator";

const ttr = process.env.COMMAND_NAME == "ttr";

const MIN_CLAN_DAYS = ttr ? 2 * 7 : 0; // 2 weeks
const MIN_CLAN_XP = ttr ? 1 * 1000000 : 50 * 1000000; // 1 mill

const CORPORAL_MIN_DAYS = MIN_CLAN_DAYS;
const CORPORAL_MIN_XP = MIN_CLAN_XP;

// const SERGEANT_MIN_DAYS = 6 * 7; // 6 weeks
const SERGEANT_MIN_XP = ttr ? 15 * 1000000 : 200 * 1000000; // 15 mill

// const LIEUTENANT_MIN_DAYS = 12 * 7; // 12 weeks
const LIEUTENANT_MIN_XP = ttr ? 75 * 1000000 : 300 * 1000000; // 75 mill

// const CAPTAIN_MIN_DAYS = 24 * 7; // 24 weeks
const CAPTAIN_MIN_XP = ttr ? 200 * 1000000 : 500 * 1000000; // 200 mill

// const GENERAL_MIN_DAYS = 52 * 7; // 52 weeks
const GENERAL_MIN_XP = ttr ? 500 * 1000000 : 750 * 1000000; // 500 mill

const ADMIN_MIN_XP = 1000 * 1000000;
const ORGANIZER_MIN_XP = 1500 * 1000000;
const COORDINATOR_MIN_XP = 2000 * 1000000;

const RECRUIT_FMT = `${RECRUIT}`;
const CORPORAL_FMT = ttr ? `${CORPORAL} (Min 2 weeks and 1 mill clan xp)` : `${CORPORAL} (Min 50 mill clan xp)`;
const SERGEANT_FMT = ttr ? `${SERGEANT} (Min 15 mill clan xp)` : `${SERGEANT} (Min 200 mill clan xp)`;
const LIEUTENANT_FMT = ttr ? `${LIEUTENANT} (Min 75 mill clan xp)` : `${LIEUTENANT} (Min 300 mill clan xp)`;
const CAPTAIN_FMT = ttr ? `${CAPTAIN} (Min 200 mill clan xp)` : `${CAPTAIN} (Min 500 mill clan xp)`;
const GENERAL_FMT = ttr ? `${GENERAL} (Min 500 mill clan xp)` : `${GENERAL} (Min 750 mill clan xp)`;
const ADMIN_FMT = `${ADMIN} (Min 1 bill clan xp)`;
const ORGANIZER_FMT = `${ORGANIZER} (Min 1.5 bill clan xp)`;
const COORDINATOR_FMT = `${COORDINATOR} (Min 2 bill clan xp)`;

const MAX_CONTENT_LENGTH = 2000;
const TRUNCATE_POSTFIX = "\n\nCont'd (message is too long)...";

const truncateContent = (content) => {
  if (content.length <= MAX_CONTENT_LENGTH) {
    return content;
  }

  const lines = content.split("\n");

  let truncated = lines.shift();

  // eslint-disable-next-line no-restricted-syntax
  for (const line of lines) {
    if (
      "\n".length + truncated.length + line.length + TRUNCATE_POSTFIX.length >
      MAX_CONTENT_LENGTH
    ) {
      truncated += TRUNCATE_POSTFIX;
      break;
    }

    truncated += `\n${line}`;
  }

  return truncated.substring(0, MAX_CONTENT_LENGTH);
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
    let count = 0;

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

          isXp = player.clanXp >= SERGEANT_MIN_XP;
          isOverPromoted =
            days < CORPORAL_MIN_DAYS || player.clanXp < CORPORAL_MIN_XP;
          break;
        case SERGEANT:
          fromRank = SERGEANT_FMT;

          isXp = player.clanXp >= LIEUTENANT_MIN_XP;
          isOverPromoted =
            player.clanXp < SERGEANT_MIN_XP;
          break;
        case LIEUTENANT:
          fromRank = LIEUTENANT_FMT;

          isXp = player.clanXp >= CAPTAIN_MIN_XP;
          isOverPromoted =
            player.clanXp < LIEUTENANT_MIN_XP;
          break;
        case CAPTAIN:
          fromRank = CAPTAIN_FMT;

          isXp = player.clanXp >= GENERAL_MIN_XP;
          isOverPromoted =
            player.clanXp < CAPTAIN_MIN_XP;
          break;
        case GENERAL:
          fromRank = GENERAL_FMT;

          isXp = player.clanXp >= ADMIN_MIN_XP;
          isOverPromoted =
            player.clanXp < GENERAL_MIN_XP;
          break;

        case ADMIN:
          fromRank = ADMIN_FMT;

          isXp = player.clanXp >= ORGANIZER_MIN_XP;
          isOverPromoted =
            player.clanXp < ADMIN_MIN_XP;
          break;
        case ORGANIZER:
          fromRank = ORGANIZER_FMT;

          isXp = player.clanXp >= COORDINATOR_MIN_XP;
          isOverPromoted =
            player.clanXp < ORGANIZER_MIN_XP;
          break;
        case COORDINATOR:
          fromRank = COORDINATOR_FMT;

          isOverPromoted =
            player.clanXp < COORDINATOR_MIN_XP;
          break;

        default:
          break;
      }

      if (isOverPromoted && false) {
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
            // } else if (days < SERGEANT_MIN_DAYS) {
            //   toRankTime = CORPORAL_FMT;
            //   toRankTimeLevel = 1;
            // } else if (days < LIEUTENANT_MIN_DAYS) {
            //   toRankTime = SERGEANT_FMT;
            //   toRankTimeLevel = 2;
            // } else if (days < CAPTAIN_MIN_DAYS) {
            //   toRankTime = LIEUTENANT_FMT;
            //   toRankTimeLevel = 3;
            // } else if (days < GENERAL_MIN_DAYS) {
            //   toRankTime = CAPTAIN_FMT;
            //   toRankTimeLevel = 4;
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
        // if (days >= GENERAL_MIN_DAYS) {
        //   toRankTime = GENERAL_FMT;
        //   toRankTimeLevel = 5;
        // } else if (days >= CAPTAIN_MIN_DAYS) {
        //   toRankTime = CAPTAIN_FMT;
        //   toRankTimeLevel = 4;
        // } else if (days >= LIEUTENANT_MIN_DAYS) {
        //   toRankTime = LIEUTENANT_FMT;
        //   toRankTimeLevel = 3;
        // } else if (days >= SERGEANT_MIN_DAYS) {
        //   toRankTime = SERGEANT_FMT;
        //   toRankTimeLevel = 2;
        /*} else */ if (ttr && days >= CORPORAL_MIN_DAYS) {
          toRankTime = CORPORAL_FMT;
          toRankTimeLevel = 1;
        }
      }

      let toRankXp = null;
      let toRankXpLevel = 0;
      if (isXp) {
        if (!ttr && player.clanXp >= COORDINATOR_MIN_XP) {
          toRankXp = COORDINATOR_FMT;
          toRankXpLevel = 8;
        } else if (!ttr && player.clanXp >= ORGANIZER_MIN_XP) {
          toRankXp = ORGANIZER_FMT;
          toRankXpLevel = 7;
        } else if (!ttr && player.clanXp >= ADMIN_MIN_XP) {
          toRankXp = ADMIN_FMT;
          toRankXpLevel = 6;
        } else if (player.clanXp >= GENERAL_MIN_XP) {
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
        content += `\n**RSN:** _${player.rsn}_\n- **To:** _${toRankTime}_\n`;
      } else {
        content += `\n**RSN:** _${player.rsn}_\n- **To:** _${toRankXp}_\n`;
      }

      count += 1;
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
          `${count} Players for Promotion!\n${content}`
        ),
        ephemeral: !isPublic,
      });
    }
  }),
};
