/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

const fs = require("fs");
const path = require("path");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

const COMMANDS_DIR = `${__dirname}/../bot/commands`;

const deploy = () => {
  const commands = [];
  const commandFiles = fs
    .readdirSync(COMMANDS_DIR)
    .filter((file) => file.endsWith(".js"));

  commandFiles.forEach((file) => {
    const command = require(path.join(COMMANDS_DIR, file));
    commands.push(command.data.toJSON());
  });

  const rest = new REST({ version: "9" }).setToken(
    process.env.DISCORD_BOT_TOKEN
  );

  rest
    .put(Routes.applicationCommands(process.env.DISCORD_APP_CLIENT_ID), {
      body: commands,
    })
    .then(() =>
      console.log("Successfully registered application commands: %o", commands)
    )
    .catch(console.error);
};

module.exports = {
  deploy,
};
