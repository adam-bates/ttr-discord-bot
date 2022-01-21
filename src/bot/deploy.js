/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

const fs = require("fs").promises;
const path = require("path");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { SlashCommandBuilder } = require("@discordjs/builders");

const COMMANDS_DIR = path.join(__dirname, "handlers", "commands");

const deploy = async () => {
  const command = new SlashCommandBuilder()
    .setName("tlc")
    .setDescription("Custom commands for the TLC Discord");
  const commandFiles = await fs.readdir(COMMANDS_DIR);

  commandFiles
    .filter((file) => file.endsWith(".js"))
    .forEach((file) => {
      const commandInfo = require(path.join(COMMANDS_DIR, file));

      if (!commandInfo.disabled) {
        command.addSubcommand(commandInfo.builder);
      }
    });

  const serializedCommand = command.toJSON();

  const rest = new REST({ version: "9" }).setToken(
    process.env.DISCORD_BOT_TOKEN
  );

  try {
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_APP_CLIENT_ID),
      {
        body: [serializedCommand],
      }
    );

    console.log(
      "Successfully registered application command: %o",
      serializedCommand
    );
  } catch (e) {
    console.error(e);
  }
};

module.exports = {
  deploy,
};
