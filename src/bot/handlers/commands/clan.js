module.exports = {
  builder: (command) =>
    command
      .setName("clan")
      .setDescription("Get information about the clan")
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

    // const rsns = await redis.getAllRsns();

    const content = process.env.COMMAND_NAME == "ttr" ? `The Twisted Republic (a.k.a TTR)

A fresh and welcoming clan; a republic of amazing people who have been twisted about to where they are now.

Feel free to say hi, contribute to conversations, and ask questions. Also, reach out to any of our friendly staff members if you need help!
` : `daaFriends

A fresh and welcoming clan!

Feel free to say hi, contribute to conversations, and ask questions. Also, reach out to any of our friendly staff members if you need help!
`;

    await interaction.reply({ content, ephemeral: !isPublic });
  },
};
