const { MessageActionRow, MessageButton } = require("discord.js");

module.exports = {
  builder: (command) =>
    command.setName("button").setDescription("Replies with a button!"),

  execute: async (_, interaction) => {
    const button = new MessageButton()
      .setCustomId("primary")
      .setLabel("Primary")
      .setStyle("PRIMARY");

    const filter = (i) =>
      i.customId === "primary" && i.user.id === interaction.user.id;

    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 3000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "primary") {
        await i.update({
          content: "A button was clicked!",
          components: [
            new MessageActionRow().addComponents(button.setDisabled(true)),
          ],
        });
      } else {
        console.log(i);
      }
    });

    await interaction.reply({
      content: "Pong!",
      components: [new MessageActionRow().addComponents(button)],
      ephemeral: true,
    });

    collector.on("end", async (collected, reason) => {
      console.log(
        `Collected ${collected.size} items. Reason for ending collection: ${reason}`
      );

      await interaction.editReply({
        components: [
          new MessageActionRow().addComponents(button.setDisabled(true)),
        ],
      });
    });
  },
};
