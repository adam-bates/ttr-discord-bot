const { SlashCommandBuilder } = require("@discordjs/builders");
const { read } = require("../../../services/influxdb");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),

  execute: async (influx, interaction) => {
    const arr = [];

    read(influx, {
      next: (row, tableMeta) => {
        arr.push(JSON.stringify(tableMeta.toObject(row), null, 2));
      },
      error: (e) => {
        console.error(e);
        console.log("Finished ERROR");
      },
      complete: () => {
        interaction.reply(arr.join("\n"));
      },
    });
  },
};
