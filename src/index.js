require("dotenv").config();

const { forEachAsync } = require("./utils/array");
const { parseArgsToCommands, Command } = require("./args");
const { deploy, serve } = require("./bot");

const commands = parseArgsToCommands();

forEachAsync(commands, async (command) => {
  switch (command) {
    case Command.DEPLOY:
      await deploy();
      break;
    case Command.SERVE:
      await serve();
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
});
