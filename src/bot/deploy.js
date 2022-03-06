/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

const fs = require("fs").promises;
const path = require("path");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { SlashCommandBuilder } = require("@discordjs/builders");

const COMMANDS_DIR = path.join(__dirname, "handlers", "commands");
const ADMIN_COMMANDS_DIR = path.join(__dirname, "handlers", "admin-commands");

const deploy = async () => {
  const command = new SlashCommandBuilder()
    .setName(process.env.COMMAND_NAME)
    .setDescription("General commands for the TTR Discord");
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

  const adminCommand = new SlashCommandBuilder()
    .setName(process.env.ADMIN_COMMAND_NAME)
    .setDescription("Admin commands for the TTR Discord");
  const adminCommandFiles = await fs.readdir(ADMIN_COMMANDS_DIR);

  adminCommandFiles
    .filter((file) => file.endsWith(".js"))
    .forEach((file) => {
      const commandInfo = require(path.join(ADMIN_COMMANDS_DIR, file));

      if (!commandInfo.disabled) {
        adminCommand.addSubcommand(commandInfo.builder);
      }
    });

  const serializedAdminCommand = adminCommand.toJSON();

  const rest = new REST({ version: "9" }).setToken(
    process.env.DISCORD_BOT_TOKEN
  );

  try {
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_APP_CLIENT_ID),
      {
        body: [serializedCommand, serializedAdminCommand],
      }
    );

    console.log("Successfully registered commands: %o", [
      serializedCommand,
      serializedAdminCommand,
    ]);
  } catch (e) {
    console.error(e);
  }
};

module.exports = {
  deploy,
};
