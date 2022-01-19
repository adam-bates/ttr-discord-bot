/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

const fs = require("fs").promises;
const path = require("path");
const { Client, Collection, Intents } = require("discord.js");
const { createInfluxClient } = require("../services/influxdb");

const COMMANDS_DIR = path.join(__dirname, "handlers", "commands");
const EVENTS_DIR = path.join(__dirname, "handlers", "events");

const buildCommands = async () => {
  const commands = [];

  const commandFiles = await fs.readdir(COMMANDS_DIR);

  commandFiles
    .filter((file) => file.endsWith(".js"))
    .forEach((file) => {
      const command = require(path.join(COMMANDS_DIR, file));

      commands.push([command.data.name, command]);
    });

  return commands;
};

const setupEvents = async (client, influx) => {
  const eventFiles = await fs.readdir(EVENTS_DIR);

  eventFiles
    .filter((file) => file.endsWith(".js"))
    .forEach((file) => {
      const event = require(path.join(EVENTS_DIR, file));

      if (event.once) {
        client.once(event.name, (...args) =>
          event.execute(client, influx, ...args)
        );
      } else {
        client.on(event.name, (...args) =>
          event.execute(client, influx, ...args)
        );
      }
    });
};

const setupClient = async () => {
  const client = new Client({
    intents: [Intents.FLAGS.GUILDS],
  });

  client.commands = new Collection();

  const commands = await buildCommands();
  commands.forEach(([name, command]) => client.commands.set(name, command));

  const influx = createInfluxClient();

  await setupEvents(client, influx);

  return client;
};

const startClient = async (client) =>
  client.login(process.env.DISCORD_BOT_TOKEN);

// const sendMessage = (client) =>
//   setTimeout(() => {
//     console.log(client.channels.cache);
//   }, 500);

const serve = async () => {
  const client = await setupClient();

  await startClient(client);
};

module.exports = {
  serve,
};
