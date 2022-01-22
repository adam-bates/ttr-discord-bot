module.exports = {
  name: "interactionCreate",
  execute: async ({ client, ...rest }, interaction) => {
    if (!interaction.isCommand() || interaction.commandName !== "tlc") {
      return;
    }

    const execute = client.executors.get(interaction.options.getSubcommand());

    if (!execute) {
      return;
    }

    try {
      await execute({ client, ...rest }, interaction);
    } catch (error) {
      console.error(error);
    }
  },
};
