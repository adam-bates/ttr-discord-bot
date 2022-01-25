/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

const fs = require("fs").promises;
const path = require("path");
const { Client, Intents } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const puppeteer = require("puppeteer");
const handlebars = require("handlebars");
const { connectRedisClient } = require("../services/redis");

const COMMANDS_DIR = path.join(__dirname, "handlers", "commands");
const EVENTS_DIR = path.join(__dirname, "handlers", "events");
const TEMPLATES_DIR = path.join(
  __dirname,
  "..",
  "..",
  "resources",
  "templates"
);

const compileTemplates = async () => {
  const templateFiles = await fs.readdir(TEMPLATES_DIR);

  return templateFiles.reduce(async (promise, filename) => {
    const templates = await promise;
    const templateName = filename.split(".")[0];

    const filepath = path.join(TEMPLATES_DIR, filename);
    const content = await fs.readFile(filepath, { encoding: "utf8" });

    const template = handlebars.compile(content, { knownHelpersOnly: true });

    return {
      ...templates,
      [templateName]: template,
    };
  }, {});
};

const buildHandlers = async () => {
  const command = new SlashCommandBuilder()
    .setName(process.env.COMMAND_NAME)
    .setDescription("Custom commands for the TLC Discord");

  const commandExecutors = new Map();
  const selectMenuHandlers = new Map();

  const commandFiles = await fs.readdir(COMMANDS_DIR);

  commandFiles
    .filter((file) => file.endsWith(".js"))
    .forEach((file) => {
      const subcommand = require(path.join(COMMANDS_DIR, file));

      if (subcommand.disabled) {
        return;
      }

      if (subcommand.builder) {
        command.addSubcommand(subcommand.builder);

        commandExecutors.set(
          command.options[command.options.length - 1].name,
          subcommand.execute
        );
      }

      if (subcommand.selectMenuHandlers) {
        subcommand.selectMenuHandlers.forEach(([name, handler]) =>
          selectMenuHandlers.set(name, handler)
        );
      }
    });

  return { commandExecutors, selectMenuHandlers };
};

const setupEvents = async (client, redis, browser, templates) => {
  const eventFiles = await fs.readdir(EVENTS_DIR);

  const page = await browser.newPage();

  eventFiles
    .filter((file) => file.endsWith(".js"))
    .forEach((file) => {
      const event = require(path.join(EVENTS_DIR, file));

      if (event.once) {
        client.once(event.name, (...args) =>
          event.execute({ client, redis, browser, page, templates }, ...args)
        );
      } else {
        client.on(event.name, (...args) =>
          event.execute({ client, redis, browser, page, templates }, ...args)
        );
      }
    });
};

const setupClient = async () => {
  const client = new Client({
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MEMBERS,
      Intents.FLAGS.GUILD_PRESENCES,
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

  const { commandExecutors, selectMenuHandlers } = await buildHandlers();

  client.commandExecutors = commandExecutors;
  client.selectMenuHandlers = selectMenuHandlers;

  const redis = await connectRedisClient();

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });

  const templates = await compileTemplates();

  await setupEvents(client, redis, browser, templates);

  return client;
};

const startClient = async (client) =>
  client.login(process.env.DISCORD_BOT_TOKEN);

const serve = async () => {
  const client = await setupClient();

  await startClient(client);
};

module.exports = {
  serve,
};
