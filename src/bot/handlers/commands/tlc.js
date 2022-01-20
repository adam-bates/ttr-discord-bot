const help = require("./help");

// Re-export help command under the command "/tlc"
module.exports = {
  ...help,
  data: help.data.setName("tlc"),
};
