/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

const fs = require("fs").promises;
const path = require("path");
const { Client, Intents } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const puppeteer = require("puppeteer");
const handlebars = require("handlebars");
const { connectRedisClient } = require("../services/redis");
const { createCensorService } = require("../services/censor");

const COMMANDS_DIR = path.join(__dirname, "handlers", "commands");
const ADMIN_COMMANDS_DIR = path.join(__dirname, "handlers", "admin-commands");
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
    .setDescription("General commands for the " + process.env.COMMAND_NAME.toUpperCase() + " Discord");

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

  const adminCommand = new SlashCommandBuilder()
    .setName(process.env.ADMIN_COMMAND_NAME)
    .setDescription("Admin commands for the " + process.env.COMMAND_NAME.toUpperCase() + " Discord");

  const adminCommandExecutors = new Map();
  const adminSelectMenuHandlers = new Map();

  const adminCommandFiles = await fs.readdir(ADMIN_COMMANDS_DIR);

  adminCommandFiles
    .filter((file) => file.endsWith(".js"))
    .forEach((file) => {
      const subcommand = require(path.join(ADMIN_COMMANDS_DIR, file));

      if (subcommand.disabled) {
        return;
      }

      if (subcommand.builder) {
        adminCommand.addSubcommand(subcommand.builder);

        adminCommandExecutors.set(
          adminCommand.options[adminCommand.options.length - 1].name,
          subcommand.execute
        );
      }

      if (subcommand.selectMenuHandlers) {
        subcommand.selectMenuHandlers.forEach(([name, handler]) =>
          adminSelectMenuHandlers.set(name, handler)
        );
      }
    });

  return {
    commandExecutors,
    selectMenuHandlers,
    adminCommandExecutors,
    adminSelectMenuHandlers,
  };
};

const setupEvents = async ({ client, redis, censor, browser, templates }) => {
  const eventFiles = await fs.readdir(EVENTS_DIR);

  const page = await browser.newPage();

  eventFiles
    .filter((file) => file.endsWith(".js"))
    .forEach((file) => {
      const event = require(path.join(EVENTS_DIR, file));

      if (event.once) {
        client.once(event.name, (...args) =>
          event.execute(
            { client, redis, censor, browser, page, templates },
            ...args
          )
        );
      } else {
        client.on(event.name, (...args) =>
          event.execute(
            { client, redis, censor, browser, page, templates },
            ...args
          )
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

  const {
    commandExecutors,
    selectMenuHandlers,
    adminCommandExecutors,
    adminSelectMenuHandlers,
  } = await buildHandlers();

  client.commandExecutors = commandExecutors;
  client.selectMenuHandlers = selectMenuHandlers;
  client.adminCommandExecutors = adminCommandExecutors;
  client.adminSelectMenuHandlers = adminSelectMenuHandlers;

  const redis = await connectRedisClient();

  const censor = await createCensorService();

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });

  const templates = await compileTemplates();

  await setupEvents({ client, redis, censor, browser, templates });

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
