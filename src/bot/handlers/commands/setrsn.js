const { isMasterUser } = require("./helpers/roles");

module.exports = {
  builder: (command) =>
    command
      .setName("setrsn")
      .setDescription("Assign an RSN to a Discord user")
      .addStringOption((option) =>
        option
          .setName("rsn")
          .setDescription("In-game Runescape name")
          .setRequired(true)
      )
      .addUserOption((option) =>
        option
          .setName("target")
          .setDescription("Discord user")
          .setRequired(false)
      )
      .addBooleanOption((option) =>
        option
          .setName("force-rsn")
          .setDescription(
            "Force the change, even if the RSN is already assigned; the current assignment will be removed"
          )
          .setRequired(false)
      )
      .addBooleanOption((option) =>
        option
          .setName("force-target")
          .setDescription(
            "Force the change, even if the target is already assigned; the current assignment will be removed"
          )
          .setRequired(false)
      )
      .addBooleanOption((option) =>
        option
          .setName("public")
          .setDescription(
            "Makes the output of this command public to the server"
          )
          .setRequired(false)
      ),

  execute: async ({ client, redis }, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    const requestedRsn = interaction.options.getString("rsn").toLowerCase();
    const clanRsns = await redis.getAllRsns();

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
      const isMaster = await isMasterUser(client, interaction);

      if (!isMaster) {
        return;
      }
    } else {
      target = interaction.user;
    }

    const targetCurrentRsn = await redis.getRsnByUserId(target.id);
    if (targetCurrentRsn) {
      if (targetCurrentRsn === rsn) {
        await interaction.reply({
          content: `${target} is already assigned to RSN: ${rsn}. Nothing interesting happened.`,
          ephemeral: true,
        });
        return;
      }

      const forceTarget = interaction.options.getBoolean("force-target");

      if (!forceTarget) {
        await interaction.reply({
          content: `Error: ${target} is already assigned to RSN: ${targetCurrentRsn}`,
          ephemeral: true,
        });
        return;
      }
    }

    const rsnCurrentTargetId = await redis.searchForUserIdWithRsn(rsn);
    const rsnCurrentTarget = await client.users.cache.get(rsnCurrentTargetId);

    if (rsnCurrentTargetId) {
      const forceRsn = interaction.options.getBoolean("force-rsn");

      if (!forceRsn) {
        if (rsnCurrentTarget) {
          await interaction.reply({
            content: `Error: RSN ${rsn} is already assigned to: ${rsnCurrentTarget}`,
          });
          return;
        }

        await interaction.reply({
          content: `Error: RSN ${rsn} is already assigned to User with ID: ${rsnCurrentTargetId}`,
        });
        return;
      }
    }

    await redis.setRsnByUserId(target.id, rsn);

    await interaction.reply({
      content: `Assigned RSN ${rsn} to: ${target}`,
      ephemeral: !isPublic,
    });
  },
};
