const { SlashCommandBuilder } = require("@discordjs/builders");
const { getClanInfo } = require("../../../services/runescape-api");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clan")
    .setDescription("Replies with clan info!"),

  execute: async (_influx, interaction) => {
    const clan = await getClanInfo();

    const fullContent = JSON.stringify(clan, null, 2);

    const content =
      fullContent.length > 4000
        ? `${fullContent.substring(0, 4000 - 3)}...`
        : fullContent;

    await interaction.reply({
      content,
      ephemeral: true,
    });
  },
};
