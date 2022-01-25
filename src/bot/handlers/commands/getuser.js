module.exports = {
  builder: (command) =>
    command
      .setName("getuser")
      .setDescription("Get the assigned Discord user for an RSN")
      .addStringOption((option) =>
        option
          .setName("rsn")
          .setDescription("In-game Runescape name")
          .setRequired(true)
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

    const requestedRsn = interaction.options.getString("rsn");
    const clanRsns = JSON.parse(await redis.get("GetAllRsns")) || [];

    const rsn = clanRsns.find(
      (clannie) => clannie.toLowerCase() === requestedRsn.toLowerCase()
    );

    if (!rsn) {
      await interaction.reply({
        content: `Error: Couldn't find RSN ${requestedRsn} in the clan: ${process.env.CLAN_NAME}`,
        ephemeral: true,
      });
      return;
    }

    const userId = await redis.searchForUserIdWithRsn(rsn);

    if (!userId) {
      await interaction.reply({
        content: `RSN ${rsn} has no assigned User.`,
        ephemeral: !isPublic,
      });
      return;
    }

    const user = await client.users.cache.get(userId);

    if (user) {
      await interaction.reply({
        content: `RSN ${rsn} is assigned to: ${user}`,
        ephemeral: !isPublic,
      });
    } else {
      await interaction.reply({
        content: `RSN ${rsn} is assigned to User with ID: ${userId}`,
        ephemeral: !isPublic,
      });
    }
  },
};
