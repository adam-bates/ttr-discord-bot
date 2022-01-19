const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tlc-ping")
    .setDescription("Replies with Pong!"),

  execute: async (_, interaction) => {
    await interaction.reply("Pong!");
  },
};
