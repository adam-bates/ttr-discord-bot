require("dotenv").config();

const { parseCommands, Command } = require("./commands");
const { deploy } = require("./deploy");
const { serve } = require("./serve");

const commands = parseCommands();

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
