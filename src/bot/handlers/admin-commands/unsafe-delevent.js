const { requireMasterUser } = require("./helpers/roles");

module.exports = {
  disabled: true,

  builder: (command) =>
    command
      .setName("unsafe-delevent")
      .setDescription("Delete an event. WARNING: All event data will be lost!")
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

    const error = await redis.delEvent(name);

    if (error) {
      await interaction.reply({ content: `Error: ${error}`, ephemeral: true });
      return;
    }

    await interaction.reply({
      content: `\`\`\`SUCCESSFULLY DELETED EVENT\n\n${name}\`\`\``,
      ephemeral: !isPublic,
    });
  }),
};
