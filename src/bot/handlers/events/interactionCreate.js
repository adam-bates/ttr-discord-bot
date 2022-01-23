module.exports = {
  name: "interactionCreate",
  execute: async ({ client, ...rest }, interaction) => {
    if (
      interaction.isCommand() &&
      interaction.commandName === process.env.COMMAND_NAME
    ) {
      const execute = client.commandExecutors.get(
        interaction.options.getSubcommand()
      );

      if (!execute) {
        return;
      }

      try {
        await execute({ client, ...rest }, interaction);
      } catch (error) {
        console.error(error);
      }
    } else if (interaction.isSelectMenu()) {
      const handle = client.selectMenuHandlers.get(interaction.customId);

      if (!handle) {
        return;
      }

      try {
        await handle({ client, ...rest }, interaction);
      } catch (error) {
        console.error(error);
      }
    }
  },
};
