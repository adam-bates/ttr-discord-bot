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
        content: `Error! Couldn't find RSN ${requestedRsn} in ${process.env.CLAN_NAME}.`,
        ephemeral: true,
      });
      return;
    }

    const userId = await redis.searchForUserIdWithRsn(rsn);

    if (!userId) {
      await interaction.reply({
        content: `There is no user assigned to RSN: ${rsn}.\n\nYou can use the command \`/tlc setrsn\` to assign your Discord user to your Runescape name.`,
        ephemeral: !isPublic,
      });
      return;
    }

    const user = await client.users.fetch(userId);

    if (user) {
      await interaction.reply({
        content: `${user} is assigned to RSN: ${rsn}.`,
        ephemeral: !isPublic,
      });
    } else {
      await interaction.reply({
        content: `User with ID ${userId} is assign to RSN: ${rsn}.`,
        ephemeral: !isPublic,
      });
    }
  },
};
