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

const parseCommands = () => {
  const version = getAppVersion();

  program.version(version, "-v, -V, --version");
  program
    .option("-d, --deploy", "Deploy changes to Discord")
    .option("-s, --serve", "Login and serve Discord bot requests");

  program.parse(process.argv);

  const options = program.opts();

  const commands = [];

  if (options.deploy) {
    commands.push(Command.DEPLOY);
  }

  if (options.serve) {
    commands.push(Command.SERVE);
  }

  return commands;
};

module.exports = {
  parseCommands,
};
