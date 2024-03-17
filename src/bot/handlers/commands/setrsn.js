const { isMasterUser } = require("../admin-commands/helpers/roles");

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
    const forceTarget = interaction.options.getBoolean("force-target");
    const forceRsn = interaction.options.getBoolean("force-rsn");
    const isMaster = await isMasterUser(client, interaction, false);

    if (!isMaster && (forceTarget || forceRsn)) {
      await interaction.reply({
        content: `Error! Invalid permissions. You cannot use the force options.`,
        ephemeral: true,
      });
      return;
    }

    const isPublic = interaction.options.getBoolean("public");

    const requestedRsn = interaction.options.getString("rsn");
    const clanRsns = await redis.getAllRsns();

    const rsn = clanRsns.find(
      (clannie) => clannie.toLowerCase() === requestedRsn.toLowerCase()
    );

    if (!rsn) {
      await interaction.reply({
        content: `Error! Couldn't find RSN: ${requestedRsn} in ${process.env.CLAN_NAME}.`,
        ephemeral: true,
      });
      return;
    }

    let target = interaction.options.getUser("target");

    if (target && target !== interaction.user) {
      if (!isMaster) {
        await interaction.reply({
          content: `Error! Invalid permissions. You can only set a RSN for yourself.`,
          ephemeral: true,
        });
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

      if (!forceTarget) {
        await interaction.reply({
          content: `Error! ${target} is already assigned to RSN: ${targetCurrentRsn}. Use the option \`force-target\` to override this.`,
          ephemeral: true,
        });
        return;
      }
    }

    const guild = await client.guilds.fetch(interaction.guildId);
    if (!guild) {
      await interaction.reply({
        content: `Error! Guild not found!`,
        ephemeral: true,
      });
      return;
    }

    const rsnCurrentTargetId = await redis.searchForUserIdWithRsn(rsn);

    if (rsnCurrentTargetId) {
      if (!forceRsn) {
        try {
          const rsnCurrentTarget = await guild.members.fetch(rsnCurrentTargetId);
          if (rsnCurrentTarget) {
            await interaction.reply({
              content: `Error! ${rsnCurrentTarget} is already assigned to RSN: ${rsn}. Use the option \`force-rsn\` to override this.`,
              ephemeral: true,
            });
            return;
          }
        } catch (e) {
          // prev target not in clan anymore ...
        }

        await interaction.reply({
          content: `Error! User with ID ${rsnCurrentTargetId} is already assigned to RSN: ${rsn}. Use the option \`force-rsn\` to override this.`,
          ephemeral: true,
        });
        return;
      }
    }

    await redis.setRsnByUserId(target.id, rsn);

    await interaction.reply({
      content: `Successfully assigned ${target} to RSN: ${rsn}.`,
      ephemeral: !isPublic,
    });
  },
};
