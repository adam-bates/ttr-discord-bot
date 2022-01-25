const fs = require("fs").promises;
const path = require("path");
const { unixTimestamp, fromUnixTimestamp } = require("../../../utils/time");
const { chunkArray } = require("../../../utils/arrays");

module.exports = {
  builder: (command) =>
    command
      .setName("members")
      .setDescription("Gets clan information for all members")
      .addStringOption((option) =>
        option
          .setName("output")
          .setDescription("Format and presentation of data")
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

  execute: async ({ redis, templates, page }, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    await interaction.deferReply({
      ephemeral: !isPublic,
    });

    const players = await redis.getAllPlayers();

    const now = new Date();

    switch (interaction.options.getString("output")) {
      case "csv": {
        const date = now.toISOString().split("T")[0];

        const filepath = path.join(
          __dirname,
          "..",
          "..",
          "..",
          "..",
          "resources",
          "temp",
          `members_${date}_${interaction.id}.csv`
        );

        let csv = `RSN,RANK,JOINED\n`;
        players.forEach(({ rsn, rank, dateJoined }) => {
          csv += `${rsn},${rank},${fromUnixTimestamp(
            dateJoined
          ).toISOString()}\n`;
        });

        try {
          await fs.writeFile(filepath, csv);

          await interaction.editReply({
            ephemeral: !isPublic,
            files: [filepath],
          });
        } finally {
          try {
            await fs.rm(filepath);
          } catch (e) {
            console.error(e);
          }
        }

        break;
      }
      case "png":
      default: {
        const perChunk = 5;

        const headers = " ".repeat(perChunk).split("");
        const blankHeaders = " ".repeat(perChunk - 1).split("");

        const playerChunks = chunkArray(
          players.map((player) => ({
            ...player,
            dateJoined: fromUnixTimestamp(player.dateJoined)
              .toUTCString()
              .substring(0, 16),
          })),
          { perChunk }
        );

        const handleBars = {
          name: process.env.CLAN_NAME,
          timestamp: fromUnixTimestamp(unixTimestamp(now)).toUTCString(),
          total: players.length,
          headers,
          blankHeaders,
          playerChunks,
        };

        const htmlContent = templates.members(handleBars);

        const date = now.toISOString().split("T")[0];

        const filepath = path.join(
          __dirname,
          "..",
          "..",
          "..",
          "..",
          "resources",
          "temp",
          `members_${date}_${interaction.id}.png`
        );

        await page.setViewport({
          width: 4000,
          height: 4800,
          deviceScaleFactor: 2,
        });
        await page.setContent(htmlContent);

        try {
          await page.screenshot({ path: filepath });

          await interaction.editReply({
            ephemeral: !isPublic,
            files: [filepath],
          });
        } finally {
          try {
            await fs.rm(filepath);
          } catch (e) {
            console.error(e);
          }
        }

        break;
      }
    }
  },
};
