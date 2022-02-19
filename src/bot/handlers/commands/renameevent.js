const { requireMasterUser } = require("./helpers/roles");

module.exports = {
  builder: (command) =>
    command
      .setName("renameevent")
      .setDescription("Rename an event")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("Name of the event")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("to")
          .setDescription("New name for the event")
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
    const to = interaction.options.getString("to");

    const error = await redis.renameEvent(name, to);

    if (error) {
      await interaction.reply({ content: `Error: ${error}`, ephemeral: true });
      return;
    }

    await interaction.reply({
      content: `\`\`\`SUCCESSFULLY RENAMED EVENT\n\nOld: ${name}\nNew: ${to}\`\`\``,
      ephemeral: !isPublic,
    });
  }),
};
