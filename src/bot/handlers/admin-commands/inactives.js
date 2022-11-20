const { requireMasterUser } = require("./helpers/roles");

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

  execute: requireMasterUser(async ({ redis }, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    const months = interaction.options.getInteger("months") ?? 6;

    const now = new Date();

    const players = await redis.getAllPlayers();

    let content = "";
    let count = 0;

    players
      .filter((player) => monthDiff(now, new Date(player.updatedAt ?? 1668920400000)) > months)
      .forEach((player) => {
        const lastActive = player.updatedAt ? new Date(player.updatedAt).toUTCString().slice(0, 16) : "Unknown";
        content += `\n**RSN:** _${player.rsn}_\n- **Last Active:** _${lastActive}_\n`;
        count += 1;
      });

    if (content.trim().length === 0) {
      await interaction.reply({
        content: truncateContent(
          `**There are no known inactive players.**`
        ),
        ephemeral: !isPublic,
      });
    } else {
      await interaction.reply({
        content: truncateContent(
          `**========== ${count} Players Inactive For ${months}+ months! ==========**\n${content}`
        ),
        ephemeral: !isPublic,
      });
    }
  }),
};

