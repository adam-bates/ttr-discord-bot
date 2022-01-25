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

  execute: async ({ redis }, interaction) => {
    const isPublic = interaction.options.getBoolean("public");

    const rsns = await redis.getAllRsns();

    const content = `**The Last Citadel** (a.k.a TLC)

A welcoming, diverse, all-purpose clan with a long-standing history.

We currently have ${rsns.length} members, which has helped build us up to the max-tier citadel (tier 7)!

Please, say hi, contribute to conversations, and ask questions. And reach out to any of our friendly staff members if you need help.
`;

    await interaction.reply({ content, ephemeral: !isPublic });
  },
};
