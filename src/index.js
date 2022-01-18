require("dotenv").config();

const { parseArgsToCommands, Command } = require("./args");
const { deploy } = require("./deploy");
const { serve } = require("./serve");

const commands = parseArgsToCommands();

commands.forEach((command) => {
  switch (command) {
    case Command.DEPLOY:
      deploy();
      break;
    case Command.SERVE:
      serve();
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
});
