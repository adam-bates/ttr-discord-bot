const { unixTimestamp, fromUnixTimestamp } = require("../../../utils/time");
const { requireMasterUser } = require("./helpers/roles");

module.exports = {
  builder: (command) =>
    command
      .setName("endevent")
      .setDescription("End tracking all clan memebers stats for an event")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("Name of the event")
          .setRequired(true)
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

    const name = interaction.options.getString("name");
    const end = unixTimestamp();

    const error = await redis.endEvent(name, end);

    if (error) {
      await interaction.reply({ content: `Error: ${error}`, ephemeral: true });
      return;
    }

    const details = await redis.getEventDetails(name);

    const formattedStart = fromUnixTimestamp(details.start).toUTCString();
    const formattedEnd = fromUnixTimestamp(details.end).toUTCString();

    await interaction.reply({
      content: `\`\`\`SUCCESSFULLY ENDED EVENT\n\n${name}\n- Started: ${formattedStart}\n- Ended: ${formattedEnd}\`\`\``,
      ephemeral: !isPublic,
    });
  }),
};
