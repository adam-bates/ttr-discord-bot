const axios = require("axios");

const XP_STAT_KEYS = [
  "Overall",
  "Attack",
  "Defence",
  "Strength",
  "Constitution",
  "Ranged",
  "Prayer",
  "Magic",
  "Cooking",
  "Woodcutting",
  "Fletching",
  "Fishing",
  "Firemaking",
  "Crafting",
  "Smithing",
  "Mining",
  "Herblore",
  "Agility",
  "Thieving",
  "Slayer",
  "Farming",
  "Runecrafting",
  "Hunter",
  "Construction",
  "Summoning",
  "Dungeoneering",
  "Divination",
  "Invention",
  "Archaeology",
];

const ACTIVITY_STAT_KEYS = [
  "Bounty Hunter",
  "B.H. Rogues",
  "Dominion Tower",
  "The Crucible",
  "Castle Wars games",
  "B.A. Attackers",
  "B.A. Defenders",
  "B.A. Collectors",
  "B.A. Healers",
  "Duel Tournament",
  "Mobilising Armies",
  "Conquest",
  "Fist of Guthix",
  "GG: Athletics",
  "GG: Resource Race",
  "WE2: Armadyl Lifetime Contribution",
  "WE2: Bandos Lifetime Contribution",
  "WE2: Armadyl PvP kills",
  "WE2: Bandos PvP kills",
  "Heist Guard Level",
  "Heist Robber Level",
  "CFP: 5 game average",
  "AF15: Cow Tipping",
  "AF15: Rats killed after the miniquest",
  "RuneScore",
  "Clue Scrolls Easy",
  "Clue Scrolls Medium",
  "Clue Scrolls Hard",
  "Clue Scrolls Elite",
  "Clue Scrolls Master",
];

const getDataOrNull = async (url, errorHandler = console.warn) => {
  try {
    const res = await axios.get(url);
    return res.data;
  } catch (e) {
    if (errorHandler) {
      return errorHandler(e) || null;
    }
  }

  return null;
};

const fetchClanInfo = async (clanName) => {
  const raw = await getDataOrNull(
    `http://services.runescape.com/m=clan-hiscores/members_lite.ws?clanName=${clanName}`
  );

  if (!raw) {
    return null;
  }

  const data = raw.replaceAll("�", " ");

  const lines = data.split("\n").filter((line) => line.trim().length > 0);
  lines.shift();

  const clan = lines.reduce((arr, line) => {
    const [rsn, rank] = line.split(",");
    return [...arr, { rsn, rank }];
  }, []);

  return clan;
};

const fetchPlayerStats = async (rsn) => {
  const raw = await getDataOrNull(
    `https://secure.runescape.com/m=hiscore/index_lite.ws?player=${rsn}`,
    null
  );

  if (!raw) {
    return null;
  }

  const data = raw.replaceAll("�", " ");

  const lines = data.split("\n").filter((line) => line.trim().length > 0);

  const stats = lines.reduce((obj, line, idx) => {
    if (idx < XP_STAT_KEYS.length) {
      const [rank, level, xp] = line.split(",");

      const hasRank = rank && rank !== "-1";
      const hasLevel = level && level !== "-1";
      const hasXp = xp && xp !== "-1";

      const stat = {};
      let hasStat = false;

      if (hasRank) {
        hasStat = true;
        stat.rank = rank;
      }

      if (hasLevel) {
        hasStat = true;
        stat.level = level;
      }

      if (hasXp) {
        hasStat = true;
        stat.xp = xp;
      }

      const res = { ...obj };

      if (hasStat) {
        res[XP_STAT_KEYS[idx]] = stat;
      }

      return res;
    }
    const [rank, value] = line.split(",");

    const hasRank = rank && rank !== "-1";
    const hasValue = value && value !== "-1";

    const stat = {};
    let hasStat = false;

    if (hasRank) {
      hasStat = true;
      stat.rank = rank;
    }

    if (hasValue) {
      hasStat = true;
      stat.value = value;
    }

    const res = { ...obj };

    if (hasStat) {
      res[ACTIVITY_STAT_KEYS[idx - XP_STAT_KEYS.length]] = stat;
    }

    return res;
  }, {});

  return stats;
};

module.exports = {
  fetchClanInfo,
  fetchPlayerStats,
};
