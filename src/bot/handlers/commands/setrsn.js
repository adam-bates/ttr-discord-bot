const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tlc-setrsn")
    .setDescription("Sets RSN for a Discord user")
    .addStringOption((option) =>
      option
        .setName("rsn")
        .setDescription("In-game Runescape name")
        .setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("Target user to update")
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("force-rsn")
        .setDescription(
          "Forces the change, even if the RSN is already assigned to another target"
        )
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("force-target")
        .setDescription(
          "Forces the change, even if the target is already assigned to another RSN"
        )
        .setRequired(false)
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

    let target = interaction.options.getUser("target");

    if (target) {
      // TODO: Check role / permissions, and message target about who made the change
    } else {
      target = interaction.user;
    }

    const targetCurrentRsn = await redis.get(`GetRsnByUserId/${target.id}`);
    if (targetCurrentRsn) {
      if (targetCurrentRsn === rsn) {
        await interaction.reply({
          content: `${target} is already assigned to RSN: ${rsn}. Nothing interesting happened.`,
          ephemeral: true,
        });
        return;
      }

      const forceTarget = interaction.options.getBoolean("force-target");

      if (forceTarget) {
        // TODO: Check role / permissions
      } else {
        await interaction.reply({
          content: `Error: ${target} is already assigned to RSN: ${targetCurrentRsn}`,
          ephemeral: true,
        });
        return;
      }
    }

    const rsnCurrentTargetId = await redis.get(`GetUserIdByRsn/${rsn}`);
    const rsnCurrentTarget = await client.users.cache.get(rsnCurrentTargetId);

    if (rsnCurrentTargetId) {
      const forceRsn = interaction.options.getBoolean("force-rsn");

      if (forceRsn) {
        // TODO: Check role / permissions, and message rsnCurrentTarget about who made the change
      } else if (rsnCurrentTarget) {
        await interaction.reply({
          content: `Error: RSN ${rsn} is already assigned to: ${rsnCurrentTarget}`,
        });
        return;
      } else {
        await interaction.reply({
          content: `Error: RSN ${rsn} is already assigned to User with ID: ${rsnCurrentTargetId}`,
        });
        return;
      }
    }

    await redis.set(`GetUserIdByRsn/${rsn}`, target.id);
    await redis.set(`GetRsnByUserId/${target.id}`, rsn);

    await interaction.reply({
      content: `Assigned RSN ${rsn} to: ${target}`,
      ephemeral: !isPublic,
    });
  },
};
