const fs = require("fs").promises;
const path = require("path");

const PROFANITY_FILE = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "resources",
  "censors",
  "wiki-profanity.txt"
);

const CensorService = ({ matches }) => {
  const shouldCensor = (input) =>
    matches.some((match) => input.includes(match));

  return {
    shouldCensor,
  };
};

const createCensorService = async () => {
  const text = await fs.readFile(PROFANITY_FILE, { encoding: "utf8" });
  const matches = text.split("\n").map((match) => match.toLowerCase());

  return CensorService({ matches });
};

module.exports = {
  CensorService,
  createCensorService,
};
