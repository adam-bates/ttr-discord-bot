const { program } = require("commander");
const Command = require("./Command");

const getAppVersion = () => {
  const version = process.env.npm_package_version;

  if (version) {
    return version;
  }

  // eslint-disable-next-line global-require
  const packageJson = require("../../package.json");
  return packageJson.version;
};

const parseArgsToCommands = () => {
  const version = getAppVersion();

  program.version(version, "-v, -V, --version");
  program
    .option("-d, --deploy", "Deploy changes to Discord")
    .option("-s, --serve", "Login and serve Discord bot requests")
    .option("-f, --fetch", "Fetch updated data from Runescape APIs")
    .option("-m, --messages", "Send scheduled messages to Discord");

  program.parse(process.argv);

  const options = program.opts();

  const commands = [];

  if (options.deploy) {
    commands.push(Command.DEPLOY);
  }

  if (options.serve) {
    commands.push(Command.SERVE);
  }

  if (options.fetch) {
    commands.push(Command.FETCH_DATA);
  }

  if (options.messages) {
    commands.push(Command.SEND_MESSAGES);
  }

  if (commands.length === 0) {
    program.outputHelp();
  }

  return commands;
};

module.exports = {
  parseArgsToCommands,
};
