const { isMasterUser } = require("./helpers/roles");

module.exports = {
  builder: (command) =>
    command
      .setName("delrsn")
      .setDescription("Remove the assigned RSN for a Discord user")
      .addUserOption((option) =>
        option
          .setName("target")
          .setDescription("Discord user")
          .setRequired(false)
      )
      .addBooleanOption((option) =>
        option
          .setName("public")
          .setDescription(
            "Make the output of this command public to the server"
          )
          .setRequired(false)
      ),

  execute: async ({ client, redis }, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    let target = interaction.options.getUser("target");

    if (target) {
      const isMaster = await isMasterUser(client, interaction);

      if (!isMaster) {
        return;
      }
    } else {
      target = interaction.user;
    }

    const rsn = await redis.getRsnByUserId(target.id);

    if (!rsn) {
      await interaction.reply({
        content: `${target} has no assigned RSN. Nothing interested happened.`,
        ephemeral: !isPublic,
      });
      return;
    }

    await redis.deleteRsnByUserId(target.id);

    await interaction.reply({
      content: `Successfully unassigned ${target} from RSN: ${rsn}.`,
      ephemeral: !isPublic,
    });
  },
};
