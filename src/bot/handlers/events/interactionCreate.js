module.exports = {
  name: "interactionCreate",
  execute: async ({ client, ...rest }, interaction) => {
    if (interaction.isCommand()) {
      let execute = null;
      if (interaction.commandName === process.env.COMMAND_NAME) {
        execute = client.commandExecutors.get(
          interaction.options.getSubcommand()
        );
      } else if (interaction.commandName === process.env.ADMIN_COMMAND_NAME) {
        execute = client.adminCommandExecutors.get(
          interaction.options.getSubcommand()
        );
      }

      if (!execute) {
        return;
      }

      try {
        await execute({ client, ...rest }, interaction);
      } catch (error) {
        console.error(error);
      }
    } else if (interaction.isSelectMenu()) {
      let handle = client.selectMenuHandlers.get(interaction.customId);

      if (!handle) {
        handle = client.adminSelectMenuHandlers.get(interaction.customId);
      }

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
