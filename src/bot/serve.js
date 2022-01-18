/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

const fs = require("fs");
const path = require("path");
const { Client, Collection, Intents } = require("discord.js");

const COMMANDS_DIR = path.join(__dirname, "handlers", "commands");
const EVENTS_DIR = path.join(__dirname, "handlers", "events");

const buildCommands = () => {
  const commands = [];

  const commandFiles = fs
    .readdirSync(COMMANDS_DIR)
    .filter((file) => file.endsWith(".js"));

  commandFiles.forEach((file) => {
    const command = require(path.join(COMMANDS_DIR, file));

    commands.push([command.data.name, command]);
  });

  return commands;
};

const setupEvents = (client) => {
  const eventFiles = fs
    .readdirSync(EVENTS_DIR)
    .filter((file) => file.endsWith(".js"));

  eventFiles.forEach((file) => {
    const event = require(path.join(EVENTS_DIR, file));

    if (event.once) {
      client.once(event.name, (...args) => event.execute(client, ...args));
    } else {
      client.on(event.name, (...args) => event.execute(client, ...args));
    }
  });
};

const startClient = (client) => {
  client.login(process.env.DISCORD_BOT_TOKEN);
};

const serve = () => {
  const client = new Client({
    intents: [Intents.FLAGS.GUILDS],
  });

  client.commands = new Collection();

  const commands = buildCommands();
  commands.forEach(([name, command]) => client.commands.set(name, command));

  setupEvents(client);

  startClient(client);
};

module.exports = {
  serve,
};
