const { unixTimestamp, fromUnixTimestamp } = require("../../../utils/time");
const { requireMasterUser } = require("./helpers/roles");

module.exports = {
  builder: (command) =>
    command
      .setName("startevent")
      .setDescription("Start tracking all clan memebers stats for an event")
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
    const start = unixTimestamp();

    const error = await redis.startEvent(name, start);

    if (error) {
      await interaction.reply({ content: `Error: ${error}`, ephemeral: true });
      return;
    }

    const formatted = fromUnixTimestamp(start).toUTCString();

    await interaction.reply({
      content: `\`\`\`SUCCESSFULLY STARTED EVENT\n\n${name}\n- Started: ${formatted}\`\`\``,
      ephemeral: !isPublic,
    });
  }),
};
