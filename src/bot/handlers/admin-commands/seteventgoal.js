const { requireMasterUser } = require("./helpers/roles");

module.exports = {
  builder: (command) =>
    command
      .setName("seteventgoal")
      .setDescription(
        "Create an total xp goal to automatically end a clan event when a player reaches it"
      )
      .addIntegerOption((option) =>
        option
          .setName("goal")
          .setDescription(
            "Amount of overall XP in Millions (ie. 100 means 100M overall xp)"
          )
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("Name of the event")
          .setRequired(false)
      )
      .addBooleanOption((option) =>
        option
          .setName("public")
          .setDescription(
            "Make the output of this command public to the server"
          )
          .setRequired(false)
      ),

  execute: requireMasterUser(async ({ redis }, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    let name = interaction.options.getString("name");

    if (!name) {
      const currentEventNames = await redis.getCurrentEventNames();

      if (currentEventNames.length === 1) {
        [name] = currentEventNames;
      } else if (currentEventNames.length === 0) {
        await interaction.reply({
          content: `Error: There are no events currently running. Please specify a \`name\`.`,
          ephemeral: true,
        });
        return;
      } else {
        await interaction.reply({
          content: `Error: There are multiple events currently running, please specify a \`name\`.`,
          ephemeral: true,
        });
        return;
      }
    }

    const details = await redis.getEventDetails(name);

    if (!details) {
      await interaction.reply({
        content: `Error: Event \`${name}\` doesn't exist!`,
        ephemeral: true,
      });
      return;
    }

    const goal = parseInt(interaction.options.getInteger("goal"), 10);

    if (!goal || goal <= 0) {
      await interaction.reply({
        content: `Error: Goal must be a positive integer!`,
        ephemeral: true,
      });
    }

    const error = await redis.setEventGoal(name, goal);

    if (error) {
      await interaction.reply({
        content: `Error: ${error}`,
        ephemeral: true,
      });
    }

    await interaction.reply({
      content: `Successfully set goal of ${goal}M Overall EXP for the event: ${details.name}`,
      ephemeral: !isPublic,
    });
  }),
};
