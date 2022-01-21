require("dotenv").config();

const { forEachAsync } = require("./utils/promises");
const { parseArgsToCommands, Command } = require("./args");
const { deploy, serve, fetchData, sendMessages } = require("./bot");

const commands = parseArgsToCommands();

const actions = {
  [Command.DEPLOY]: deploy,
  [Command.SERVE]: serve,
  [Command.FETCH_DATA]: fetchData,
  [Command.SEND_MESSAGES]: sendMessages,
};

forEachAsync(commands, async ([command, ...args]) => {
  const action = actions[command];

  if (!action) {
    throw new Error(`Unknown command: ${command}`);
  }

  await action(...args);
});
