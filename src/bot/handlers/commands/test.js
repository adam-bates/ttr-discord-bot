const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("test")
    .setDescription("TLC!")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("user")
        .setDescription("Info about a user")
        .addUserOption((option) =>
          option.setName("target").setDescription("The user")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("server")
        .setDescription("Info about the server")
        .addStringOption((option) =>
          option
            .setName("category")
            .setDescription("The gif category")
            .setRequired(true)
            .addChoice("Funny", "gif_funny")
            .addChoice("Meme", "gif_meme")
            .addChoice("Movie", "gif_movie")
        )
    ),

  execute: async (_, interaction) => {
    const message = await interaction.reply({
      content: "Hello world!",
      fetchReply: true,
    });

    message.react("😄");
  },
};
