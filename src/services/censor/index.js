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
    let censorsSet = new Set();

    for (wordIdx = 0; wordIdx < words.length; wordIdx += 1) {
      for (const match of matches) {
        const matchWords = match.split(/\W+/);
        let offset = 0;
        let isMatch = true;

        for (i = 0; i < matchWords.length; i++) {
          if (matchWords[i] !== words[wordIdx + offset]) {
            isMatch = false;
            break;
          }

          offset += 1;
        }

        if (isMatch) {
          censorsSet.add(match);
        } else {
          console.error(`No match for "${match}" starting at "${words[wordIdx]}"`);
        }
      }
    }

    return Array.from(censorsSet);
  };

  return {
    findCensors,
  };
};

const createCensorService = async () => {
  const text = await fs.readFile(PROFANITY_FILE, { encoding: "utf8" });
  const matches = text.toLowerCase().split("\n");

  return CensorService({ matches });
};

module.exports = {
  CensorService,
  createCensorService,
};
