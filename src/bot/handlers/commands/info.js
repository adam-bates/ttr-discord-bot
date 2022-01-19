const { SlashCommandBuilder } = require("@discordjs/builders");
const { getUserInfo } = require("../../../services/runescape-api");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Replies with rsn info!")
    .addStringOption((option) =>
      option.setName("rsn").setDescription("Enter an RSN").setRequired(true)
    ),

  execute: async (_influx, interaction) => {
    console.log(interaction);

    const rsn = interaction.options.getString("rsn");

    const content = await getUserInfo(rsn);

    await interaction.reply({ content, ephemeral: true });
  },
};
