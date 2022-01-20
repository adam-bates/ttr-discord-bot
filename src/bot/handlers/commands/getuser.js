const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tlc-getuser")
    .setDescription("Gets the Discord user for an RSN")
    .addStringOption((option) =>
      option
        .setName("rsn")
        .setDescription("In-game Runescape name")
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName("public")
        .setDescription("Makes the output of this command public to the server")
        .setRequired(false)
    ),

  execute: async ({ client, redis }, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    const requestedRsn = interaction.options.getString("rsn").toLowerCase();
    const clanRsns = JSON.parse(await redis.get("GetAllRsns")) || [];

    const rsn = clanRsns.find(
      (clannie) => clannie.toLowerCase() === requestedRsn
    );

    if (!rsn) {
      await interaction.reply({
        content: `Error: RSN ${requestedRsn} is not in the clan: ${process.env.CLAN_NAME}`,
        ephemeral: true,
      });
      return;
    }

    const userId = await redis.get(`GetUserIdByRsn/${rsn}`);

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
