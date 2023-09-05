module.exports = {
  builder: (command) =>
    command
      .setName("help")
      .setDescription("Replies with info about bot commands")
      .addBooleanOption((option) =>
        option
          .setName("public")
          .setDescription(
            "Make the output of this command public to the server"
          )
          .setRequired(false)
      ),

  execute: async (_, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    let content = `\`\`\`
General bot commands

- All commands are accessed using /` + process.env.COMMAND_NAME + `
- As you type out a command, Discord shows the documentation for that command and its options

Ping the bot to ensure it's ready:
- /` + process.env.COMMAND_NAME + ` ping

Display this help message:
- /` + process.env.COMMAND_NAME + ` help

Assigning RSN to Discord user:
- /` + process.env.COMMAND_NAME + ` setrsn
- /` + process.env.COMMAND_NAME + ` delrsn
- /` + process.env.COMMAND_NAME + ` getrsn
- /` + process.env.COMMAND_NAME + ` getuser
- /` + process.env.COMMAND_NAME + ` listrsns

Get player information:
- /` + process.env.COMMAND_NAME + ` gainz
- /` + process.env.COMMAND_NAME + ` stats`;
    /*
- /` + process.env.COMMAND_NAME + ` log
- /` + process.env.COMMAND_NAME + ` quests

Creating & comparing snapshots of levels & xp
- /` + process.env.COMMAND_NAME + ` snapshots

Creating & interacting with raffles:
- /` + process.env.COMMAND_NAME + ` raffles

Creating & interacting with voting polls:
- /` + process.env.COMMAND_NAME + ` polls */

    content += `

Get clan information:
- /` + process.env.COMMAND_NAME + ` clan
- /` + process.env.COMMAND_NAME + ` members
- /` + process.env.COMMAND_NAME + ` rank`;

    content += `

Get event information:
- /` + process.env.COMMAND_NAME + ` listevents
- /` + process.env.COMMAND_NAME + ` event
- /` + process.env.COMMAND_NAME + ` eventgainz`;

    content += `

Get custom roles for MEE6 levels:
- /` + process.env.COMMAND_NAME + ` getrole
- /` + process.env.COMMAND_NAME + ` getlevel
- /` + process.env.COMMAND_NAME + ` listroles`;

    content += `

Having issues? Contact a staff member, or reach out directly to SnowyAPI aka Convergent
\`\`\``;

    await interaction.reply({ content, ephemeral: !isPublic });
  },
};
