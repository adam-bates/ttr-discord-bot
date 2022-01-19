module.exports = {
  name: "interactionCreate",
  execute: async ({ client, ...rest }, interaction) => {
    if (!interaction.isCommand()) {
      return;
    }

    const command = client.commands.get(interaction.commandName);

    if (!command) {
      return;
    }

    try {
      await command.execute({ client, ...rest }, interaction);
    } catch (error) {
      console.error(error);

      if (!interaction.replied) {
        try {
          await interaction.reply({
            content: "There was an error while executing this command!",
            ephemeral: true,
          });
        } catch (e2) {
          console.error(e2);
        }
        return;
      }

      const channel =
        client.channels &&
        typeof client.channels.get === "function" &&
        client.channels.get(interaction.channelId);

      if (channel) {
        await channel.send({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
        return;
      }

      console.error("Unhandled error executing command!");
    }
  },
};
