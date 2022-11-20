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

function monthDiff(d1, d2) {
  let months = (d2.getFullYear() - d1.getFullYear()) * 12;
  months -= d1.getMonth();
  months += d2.getMonth();
  return months <= 0 ? 0 : months;
}

module.exports = {
  builder: (command) =>
    command
      .setName("inactives")
      .setDescription("List players who have been inactive some months (default 6)")
      .addIntegerOption((option) =>
        option
          .setName("months")
          .setDescription("Number of months to check for activity (default 6)")
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

  execute: requireModUser(async ({ redis }, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    const months = interaction.options.getInteger("months") ?? 6;

    const now = new Date();

    const players = await redis.getAllPlayers();

    let content = "";

    players
      .filter((player) => monthDiff(now, new Date(player.updatedAt ?? 1668920400000)) > months)
      .forEach((player) => {
        const lastActive = player.updatedAt ? new Date(player.updatedAt).toUTCString().slice(0, 16) : "Unknown";
        content += `\n**RSN:** _${player.rsn}_\n- **Last Active:** _${lastActive}_\n`;
      });

    if (content.trim().length === 0) {
      await interaction.editReply({
        content: truncateContent(
          `**There are no known inactive players.**`
        ),
        ephemeral: !isPublic,
      });
    } else {
      await interaction.editReply({
        content: truncateContent(
          `**========== Players Inactive For ${months}+ months! ==========**\n${content}`
        ),
        ephemeral: !isPublic,
      });
    }
  }),
};

