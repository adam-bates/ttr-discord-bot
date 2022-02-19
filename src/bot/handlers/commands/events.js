const { fromUnixTimestamp } = require("../../../utils/time");

module.exports = {
  builder: (command) =>
    command
      .setName("events")
      .setDescription("Get a list of events")
      .addStringOption((option) =>
        option
          .setName("filter")
          .setDescription("Current or All events")
          .addChoice("Current", "current")
          .addChoice("All", "all")
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

  execute: async ({ redis }, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    const lookupType = interaction.options.getString("filter");
    const isAll = lookupType === "all";

    if (isAll) {
      const allDetails = await redis.getAllEventDetails();

      if (allDetails.length === 0) {
        await interaction.reply({
          content: "There are no events in the system.",
          ephemeral: !isPublic,
        });
        return;
      }

      let content = `\`\`\`ALL EVENTS`;

      allDetails
        .sort((a, b) => {
          if (a.end && !b.end) {
            return 1;
          }

          if (!a.end && b.end) {
            return -1;
          }

          return b.start - a.start;
        })
        .forEach((details) => {
          const start = fromUnixTimestamp(details.start).toUTCString();
          const end =
            details.end && fromUnixTimestamp(details.end).toUTCString();

          if (end) {
            content += `\n\n${details.name}\n- Started: ${start}\n- Ended: ${end}`;
          } else {
            content += `\n\n${details.name}\n- Started: ${start}`;
          }
        });

      content += "```";

      await interaction.reply({
        content,
        ephemeral: !isPublic,
      });
      return;
    }

    const currentDetails = await redis.getCurrentEventDetails();

    if (currentDetails.length === 0) {
      await interaction.reply({
        content: "There are no events currently running.",
        ephemeral: !isPublic,
      });
      return;
    }

    let content = `\`\`\`CURRENTLY ACTIVE EVENTS`;

    currentDetails.forEach((details) => {
      const start = fromUnixTimestamp(details.start).toUTCString();

      content += `\n\n${details.name}\n- Started: ${start}`;
    });

    content += "```";

    await interaction.reply({
      content,
      ephemeral: !isPublic,
    });
  },
};
