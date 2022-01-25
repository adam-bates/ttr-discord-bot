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
Custom Discord Bot for the Runescape clan: The Last Citadel

- All commands are accessed using /tlc
- As you type out a command, Discord shows the documentation for that command and its options

Ping the bot to ensure it's ready:
- /tlc ping

Display this help message:
- /tlc help

Assigning RSN to Discord user:
- /tlc setrsn
- /tlc delrsn
- /tlc getrsn
- /tlc getuser
- /tlc listrsns

Get player information:
- /tlc gainz
- /tlc stats`;
    /*
- /tlc log
- /tlc quests

Creating & comparing snapshots of levels & xp
- /tlc snapshots

Creating & interacting with raffles:
- /tlc raffles

Creating & interacting with events:
- /tlc events

Creating & interacting with voting polls:
- /tlc polls */

    if (!isPublic && isMasterUser(client, interaction)) {
      content += `

Get clan information:
- /tlc clan`; /*
- /tlc members */

      content += `

Assigning custom roles at an MEE6 level:
- /tlc setrole
- /tlc delrole
- /tlc getrole
- /tlc getlevel
- /tlc listroles`;
    } else {
      content += `

Clan information:
- /tlc clan
- /tlc setjoindate`; /*
- /tlc members */

      content += `

Get custom roles for MEE6 levels:
- /tlc getrole
- /tlc getlevel
- /tlc listroles`;
    }

    content += `

Having issues? Contact a staff member, or reach out directly to Convergent#2207
\`\`\``;

    await interaction.reply({ content, ephemeral: !isPublic });
  },
};
