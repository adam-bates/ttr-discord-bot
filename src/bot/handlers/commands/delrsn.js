const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tlc-delrsn")
    .setDescription("Removes assigned RSN for a Discord user")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("Target user to update")
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("force")
        .setDescription(
          "Force the change, even if the RSN is already assigned to another target"
        )
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("public")
        .setDescription("Make the output of this command public to the server")
        .setRequired(false)
    ),

  execute: async ({ redis }, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    let target = interaction.options.getUser("target");

    if (target) {
      // TODO: Check role / permissions, and message target about who made the change
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

    const force = interaction.options.getBoolean("force");

    if (!force) {
      await interaction.reply({
        content: `Error: User ${target} is assigned to RSN: ${rsn}. Use the force option to override this.`,
        ephemeral: true,
      });
      return;
    }

    await redis.setRsnByUserId(target.id, null);

    await interaction.reply({
      content: `Removed RSN assignment from: ${target}`,
      ephemeral: !isPublic,
    });
  },
};
