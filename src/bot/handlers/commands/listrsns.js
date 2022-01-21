module.exports = {
  builder: (command) =>
    command
      .setName("listrsns")
      .setDescription("Lists all RSNs with their assigned Discord user")
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
      const userId = await redis.getUserIdByRsn(rsn);

      if (userId) {
        const user = await client.users.cache.get(userId);
        map.set(rsn, user);
      } else {
        map.set(rsn, null);
      }
    });
    await Promise.all(promises);

    let content = "**Known RSNs:**";

    map.forEach((user, rsn) => {
      if (user) {
        content = `${content}\n${user}: ${rsn}`;
      }
    });

    await interaction.reply({
      content,
      ephemeral: !isPublic,
    });
  },
};
