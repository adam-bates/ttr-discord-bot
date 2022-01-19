const { SlashCommandBuilder } = require("@discordjs/builders");
// const { read } = require("../../../services/influxdb");

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
    // const arr = [];

    // read(influx, {
    //   next: (row, tableMeta) => {
    //     arr.push(JSON.stringify(tableMeta.toObject(row), null, 2));
    //   },
    //   error: (e) => {
    //     console.error(e);
    //     console.log("Finished ERROR");
    //   },
    //   complete: () => {
    //     interaction.reply(arr.join("\n"));
    //   },
    // });
    const message = await interaction.reply({
      content: "Hello world!",
      fetchReply: true,
    });

    message.react("😄");
  },
};
