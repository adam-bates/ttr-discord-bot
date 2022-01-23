const { MessageActionRow, MessageSelectMenu } = require("discord.js");

module.exports = {
  builder: (command) =>
    command
      .setName("setroles")
      .setDescription("Set the roles assigned at each level")
      .addBooleanOption((option) =>
        option
          .setName("public")
          .setDescription(
            "Make the output of this command public to the server"
          )
          .setRequired(false)
      ),

  execute: async (_, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    const row = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId("setroles")
        .setPlaceholder("Nothing selected")
        .setMinValues(0)
        .setMaxValues(2)
        .addOptions([
          {
            label: "Select me",
            description: "This is a description",
            value: "first_option",
          },
          {
            label: "You can select me too",
            description: "This is also a description",
            value: "second_option",
          },
        ])
    );

    await interaction.reply({
      content: "Pong!",
      components: [row],
      ephemeral: !isPublic,
    });
  },

  selectMenuHandlers: [
    [
      "setroles",
      async (_, interaction) => {
        console.log("Set Roles:", interaction.values);
      },
    ],
  ],
};
