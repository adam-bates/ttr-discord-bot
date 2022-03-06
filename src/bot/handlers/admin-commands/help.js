const { isMasterUser, requireModUser } = require("./helpers/roles");

module.exports = {
  builder: (command) =>
    command
      .setName("help")
      .setDescription("Replies with info about bot commands"),

  execute: requireModUser(async ({ client }, interaction) => {
    let content = `\`\`\`
Admin bot commands for the Runescape clan: The Twisted Republic

- All admin commands are accessed using /ttradmin
- As you type out a command, Discord shows the documentation for that command and its options`;

    if (isMasterUser(client, interaction)) {
      content += `

Clan information:
- /ttradmin setjoindate
- /ttradmin promotions`;

      content += `

Manage events:
- /ttradmin startevent
- /ttradmin endevent
- /ttradmin renameevent
- /ttradmin unsafe-delevent`;

      content += `

Assigning custom roles at an MEE6 level:
- /ttradmin setrole
- /ttradmin delrole`;
    } else {
      content += `

Clan information:
- /ttradmin setjoindate
- /ttradmin promotions`;
    }

    content += `
For the general commands, use /ttr help

Having issues? Contact a staff member, or reach out directly to Convergent#2207
\`\`\``;

    await interaction.reply({ content, ephemeral: true });
  }),
};
