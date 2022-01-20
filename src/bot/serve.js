/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

const fs = require("fs").promises;
const path = require("path");
const { Client, Collection, Intents } = require("discord.js");
const { connectRedisClient } = require("../services/redis");

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

const setupEvents = async (client, redis) => {
  const eventFiles = await fs.readdir(EVENTS_DIR);

  eventFiles
    .filter((file) => file.endsWith(".js"))
    .forEach((file) => {
      const event = require(path.join(EVENTS_DIR, file));

      if (event.once) {
        client.once(event.name, (...args) =>
          event.execute({ client, redis }, ...args)
        );
      } else {
        client.on(event.name, (...args) =>
          event.execute({ client, redis }, ...args)
        );
      }
    });
};

const setupClient = async () => {
  const client = new Client({
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MEMBERS,
      Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
      Intents.FLAGS.GUILD_INTEGRATIONS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
      Intents.FLAGS.GUILD_MESSAGE_TYPING,
      Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
      Intents.FLAGS.DIRECT_MESSAGES,
      Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
      Intents.FLAGS.DIRECT_MESSAGE_TYPING,
    ],
  });

  client.commands = new Collection();

  const commands = await buildCommands();
  commands.forEach(([name, command]) => client.commands.set(name, command));

  const redis = await connectRedisClient();

  await setupEvents(client, redis);

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
