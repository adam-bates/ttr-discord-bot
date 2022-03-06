const { isMasterUser } = require("./helpers/roles");

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

  execute: async ({ client }, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    let content = `\`\`\`
Custom Discord Bot for the Runescape clan: The Twisted Republic

- All commands are accessed using /ttr
- As you type out a command, Discord shows the documentation for that command and its options

Ping the bot to ensure it's ready:
- /ttr ping

Display this help message:
- /ttr help

Assigning RSN to Discord user:
- /ttr setrsn
- /ttr delrsn
- /ttr getrsn
- /ttr getuser
- /ttr listrsns

Get player information:
- /ttr gainz
- /ttr stats`;
    /*
- /ttr log
- /ttr quests

Creating & comparing snapshots of levels & xp
- /ttr snapshots

Creating & interacting with raffles:
- /ttr raffles

Creating & interacting with voting polls:
- /ttr polls */

    if (!isPublic && isMasterUser(client, interaction)) {
      content += `

Clan information:
- /ttr clan
- /ttr members
- /ttr rank
- /ttr setjoindate (admin-only)`;

      content += `

Get and manage events:
- /ttr listevents
- /ttr event
- /ttr eventgainz
- /ttr startevent (admin-only)
- /ttr endevent (admin-only)
- /ttr renameevent (admin-only)
- /ttr unsafe-delevent (admin-only)`;

      content += `

Assigning custom roles at an MEE6 level:
- /ttr getrole
- /ttr getlevel
- /ttr listroles
- /ttr setrole (admin-only)
- /ttr delrole (admin-only)`;
    } else {
      content += `

Get clan information:
- /ttr clan
- /ttr members
- /ttr rank`;

      content += `

Get event information:
- /ttr listevents
- /ttr event
- /ttr eventgainz`;

      content += `

Get custom roles for MEE6 levels:
- /ttr getrole
- /ttr getlevel
- /ttr listroles`;
    }

    content += `

Having issues? Contact a staff member, or reach out directly to Convergent#2207
\`\`\``;

    await interaction.reply({ content, ephemeral: !isPublic });
  },
};
