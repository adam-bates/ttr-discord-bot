module.exports = {
  name: "interactionCreate",
  execute: async (client, db, interaction) => {
    if (!interaction.isCommand()) {
      return;
    }

    const command = client.commands.get(interaction.commandName);

    if (!command) {
      return;
    }

    try {
      await command.execute(db, interaction);
    } catch (error) {
      console.error(error);

      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  },
};
