/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

const fs = require("fs").promises;
const path = require("path");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

const COMMANDS_DIR = path.join(__dirname, "handlers", "commands");

const deploy = async () => {
  const commands = [];
  const commandFiles = await fs.readdir(COMMANDS_DIR);

  commandFiles
    .filter((file) => file.endsWith(".js"))
    .forEach((file) => {
      const command = require(path.join(COMMANDS_DIR, file));
      commands.push(command.data.toJSON());
    });

  const rest = new REST({ version: "9" }).setToken(
    process.env.DISCORD_BOT_TOKEN
  );

  try {
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_APP_CLIENT_ID),
      {
        body: commands,
      }
    );

    console.log("Successfully registered application commands: %o", commands);
  } catch (e) {
    console.error(e);
  }
};

module.exports = {
  deploy,
};
