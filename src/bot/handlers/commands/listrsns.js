module.exports = {
  builder: (command) =>
    command
      .setName("listrsns")
      .setDescription("List all Discord user's RSN assignments")
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

    const rsns = await redis.getAllRsns();
    const map = new Map();

    const promises = rsns.map(async (rsn) => {
      const userId = await redis.searchForUserIdWithRsn(rsn);

      if (userId) {
        const guild = await client.guilds.fetch(interaction.guildId);
        if (!guild) {
          await interaction.reply({
            content: `Error! Guild not found!`,
            ephemeral: true,
          });
          return;
        }

        const user = await guild.members.fetch(userId);
        if (user) {
          map.set(rsn, user);
        } else {
          map.set(rsn, { userId, isId: true });
        }
      } else {
        map.set(rsn, { userId, isId: true });
      }
    });
    await Promise.all(promises);

    let isEmpty = true;
    let content = "Assigned RSNs:";

    map.forEach((user, rsn) => {
      isEmpty = false;
      if (user.isId) {
        content = `${content}\n- User with ID ${user.userId} is assigned to RSN: ${rsn}`;
      } else {
        content = `${content}\n- ${user} is assigned to RSN: ${rsn}`;
      }
    });

    if (isEmpty) {
      await interaction.reply({
        content: "No users have been assigned to any RSNs.",
        ephemeral: !isPublic,
      });
    } else {
      await interaction.reply({
        content,
        ephemeral: !isPublic,
      });
    }
  },
};
