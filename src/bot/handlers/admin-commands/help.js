const { isMasterUser, requireModUser } = require("./helpers/roles");

module.exports = {
  builder: (command) =>
    command
      .setName("help")
      .setDescription("Replies with info about bot commands"),

  execute: requireModUser(async ({ client }, interaction) => {
    let content = `\`\`\`
Admin bot commands for the Runescape clan: The Twisted Republic

- All admin commands are accessed using /` + process.env.ADMIN_COMMAND_NAME + `
- As you type out a command, Discord shows the documentation for that command and its options`;

    if (isMasterUser(client, interaction)) {
      content += `

Manage players:
- /` + process.env.ADMIN_COMMAND_NAME + ` setjoindate
- /` + process.env.ADMIN_COMMAND_NAME + ` promotions
- /` + process.env.ADMIN_COMMAND_NAME + ` getbaseclanxp
- /` + process.env.ADMIN_COMMAND_NAME + ` setbaseclanxp`;

      content += `

Manage events:
- /` + process.env.ADMIN_COMMAND_NAME + ` startevent
- /` + process.env.ADMIN_COMMAND_NAME + ` endevent
- /` + process.env.ADMIN_COMMAND_NAME + ` renameevent
- /` + process.env.ADMIN_COMMAND_NAME + ` unsafe-delevent`;

      content += `

Assigning custom roles at an MEE6 level:
- /` + process.env.ADMIN_COMMAND_NAME + ` setrole
- /` + process.env.ADMIN_COMMAND_NAME + ` delrole`;
    } else {
      content += `

Manage players:
- /` + process.env.ADMIN_COMMAND_NAME + ` promotions
- /` + process.env.ADMIN_COMMAND_NAME + ` getbaseclanxp`;
    }

    content += `
For the general commands, use /` + process.env.COMMAND_NAME + ` help

Having issues? Contact a staff member, or reach out directly to SnowyAPI aka Convergent
\`\`\``;

    await interaction.reply({ content, ephemeral: true });
  }),
};
