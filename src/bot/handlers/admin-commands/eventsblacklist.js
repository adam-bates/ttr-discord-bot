const { requireModUser } = require("./helpers/roles");
const { padStringToLength } = require("../../../utils/format");

module.exports = {
  builder: (command) =>
    command
      .setName("eventsblacklist")
      .setDescription("Show the blacklist for event highlights")
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

    const blacklist = Array.from(await redis.getEventsBlacklist());

    const length = Math.ceil(blacklist.length / 2);

    const rows = [];

    for (let i = 0; i < length; i++) {
      const f_rsn___1 = padStringToLength(blacklist[i], 12);
      const f_rsn___2 = padStringToLength(blacklist[i + 1] || "", 12);

      rows.push(`| ${f_rsn___1} | ${f_rsn___2} |`);
    }

    const rowsContent = rows.join("\n|--------------|--------------|\n");

    let content = `
.-----------------------------.
| EVENT HIGHLIGHTS BLACKLIST  |
|-----------------------------|
`;

    content += rowsContent;

    content += `
'-----------------------------'`;

    await interaction.reply({ content, ephemeral: !isPublic });
  }),
};
