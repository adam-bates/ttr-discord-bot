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
        }
      }
    });
    await Promise.all(promises);

    let count = 0;
    let isTooBig = false;

    const tooBigMessageLength = `\nAnd ${map.size} more ...`.length;

    let content = "Assigned RSNs:";

    map.forEach((user, rsn) => {
      const nextLine = `\n- ${user} is assigned to RSN: ${rsn}`;

      isTooBig = content.length + nextLine.length + tooBigMessageLength > 2000;

      if (!isTooBig) {
        count += 1;
        content += nextLine;
      }
    });

    if (isTooBig) {
      content += `\nAnd ${map.size - count} more ...`;
    }

    if (count === 0) {
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
