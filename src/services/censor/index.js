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
  const findCensors = (input) => {
    const words = input.toLowerCase().split(/\W+/);

    let wordIdx = 0;

    return matches.filter((match) => {
      matchWords = match.split(/\W+/);
      let offset = 0;

      for (i = 0; i < matchWords.length; i++) {
        if (matchWords[i] !== words[wordIdx + offset]) {
          return false;
        }

        offset += 1;
      }

      wordIdx += 1;
    });
  };

  return {
    findCensors,
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
