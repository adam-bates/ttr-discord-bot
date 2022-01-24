const { promisify } = require("util");
const {
  fetchClanInfo,
  fetchPlayerStats,
} = require("../services/runescape-api");
const { connectRedisClient } = require("../services/redis");
const { forEachAsyncOrdered } = require("../utils/promises");
const { unixTimestamp, fromUnixTimestamp, dropTime } = require("../utils/time");

const OVERALL_KEY = "Overall";
const SKILL_KEYS = [
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
const CLUE_SCROLL_KEYS = [
  "Clue Scrolls Easy",
  "Clue Scrolls Medium",
  "Clue Scrolls Hard",
  "Clue Scrolls Elite",
  "Clue Scrolls Master",
];

const getRenameStatBuffer = (key, value) => {
  if (SKILL_KEYS.includes(key)) {
    if (value > 13000000) {
      return 12000000;
    }
    if (value > 1000000) {
      return 6000000;
    }
    if (value > 6000000) {
      return 3000000;
    }
    if (value > 3000000) {
      return 1500000;
    }
    if (value > 1500000) {
      return 750000;
    }

    return 400000;
  }

  if (key === OVERALL_KEY) {
    if (value > 50000000) {
      return 500000000;
    }
    if (value > 20000000) {
      return 200000000;
    }
    if (value > 13000000) {
      return 12000000;
    }
    if (value > 1000000) {
      return 6000000;
    }
    if (value > 6000000) {
      return 3000000;
    }
    if (value > 3000000) {
      return 1500000;
    }
    if (value > 1500000) {
      return 750000;
    }

    return 400000;
  }

  if (CLUE_SCROLL_KEYS.includes(key)) {
    if (value > 500) {
      return 250;
    }

    return 150;
  }

  return null;
};

const wait = promisify(setTimeout);

const expectedWeek = (timestamp) => {
  const date = fromUnixTimestamp(timestamp);

  const MONDAY = 1;
  let dayOfWeek = date.getDay();

  while (dayOfWeek !== MONDAY) {
    date.setDate(date.getDate() - 1);
    dayOfWeek = date.getDay();
  }

  return unixTimestamp(dropTime(date));
};

const expectedYesterday = (timestamp) => {
  const date = fromUnixTimestamp(timestamp);

  date.setDate(date.getDate() - 1);

  return unixTimestamp(dropTime(date));
};

const expectedToday = (timestamp) => {
  const date = fromUnixTimestamp(timestamp);
  return unixTimestamp(dropTime(date));
};

const determineRenames = async ({ redis, removedPlayers, addedPlayers }) => {
  const addedRsnStatsMap = new Map();

  await Promise.all(
    addedPlayers.map(async ({ rsn, rank }) => {
      const stats = await fetchPlayerStats(rsn);
      if (stats) {
        addedRsnStatsMap.set(rsn, {
          ...stats,
          rank,
        });
      }
    })
  );

  const renames = [];

  const promises = removedPlayers.map(async (removedPlayer) => {
    const removedPlayerStats = await redis.getStatsByRsn(removedPlayer.rsn);

    if (!removedPlayerStats) {
      return;
    }

    const res = Array.from(addedRsnStatsMap.entries()).find(
      ([, addedRsnStats]) => {
        if (
          !Object.keys(removedPlayerStats).some((key) =>
            Object.keys(addedRsnStats).includes(key)
          )
        ) {
          return false;
        }

        const match = Object.entries(removedPlayerStats)
          .filter(([key]) => !["rsn", "timestamp"].includes(key))
          .every(([key, value]) => {
            const buffer = getRenameStatBuffer(key, value);

            console.log({
              key,
              value,
              cmp: addedRsnStats[key],
              buffer,
              result:
                value <= addedRsnStats[key] &&
                (!buffer || value >= addedRsnStats[key] + buffer),
            });

            return (
              value <= addedRsnStats[key] &&
              (!buffer || value >= addedRsnStats[key] + buffer)
            );
          });

        console.log(match);

        return match;
      }
    );

    if (res) {
      const [addedRsn] = res;

      addedRsnStatsMap.delete(addedRsn);
      renames.push(removedPlayer.rsn, addedRsn);
    }
  });

  await Promise.all(promises);

  return renames;
};

const fetchData = async ({ isWeekStart, isDayStart } = {}) => {
  const redis = await connectRedisClient();

  const players = (await fetchClanInfo(process.env.CLAN_NAME)).map(
    ({ rsn, ...rest }) => ({ rsn, ...rest })
  );
  const rsnsSet = new Set(players.map(({ rsn }) => rsn));

  const oldPlayers = await redis.getAllPlayers();
  const oldRsnsSet = new Set(oldPlayers.map(({ rsn }) => rsn));

  const removedPlayers = oldPlayers.filter(({ rsn }) => !rsnsSet.has(rsn));
  const addedPlayers = players.filter(({ rsn }) => !oldRsnsSet.has(rsn));

  const renames = await determineRenames({
    redis,
    removedPlayers,
    addedPlayers,
  });

  await redis.updatePlayers(players, { renames });

  const timestamp = unixTimestamp();
  const expected = {
    today: expectedToday(timestamp),
    yesterday: expectedYesterday(timestamp),
    week: expectedWeek(timestamp),
  };

  let success = 0;

  await forEachAsyncOrdered(players, async (player, idx) => {
    if (idx > 0) {
      await wait(2);
    }

    console.log(
      "(%d/%d) Fetching player: %o",
      idx + 1,
      players.length,
      player.rsn
    );

    const stats = await fetchPlayerStats(player.rsn);

    if (stats) {
      const playerStats = {
        ...player,
        ...stats,
        timestamp,
      };

      await redis.setStatsByRsn(player.rsn, playerStats);

      let isLateWeek = false;
      let isLateYesterday = false;
      let isLateToday = false;

      // 10 minutes
      const TIME_BUFFER = 10 * 60;

      if (!isWeekStart) {
        const week = await redis.getWeekStatsByRsn(player.rsn);

        if (!week || expected.week - week.timestamp > TIME_BUFFER) {
          isLateWeek = true;
        }
      }

      const today = await redis.getTodayStatsByRsn(player.rsn);

      if (!isDayStart) {
        if (!today || expected.today - today.timestamp > TIME_BUFFER) {
          isLateToday = true;
        }

        const yesterday = await redis.getYesterdayStatsByRsn(player.rsn);

        if (
          !yesterday ||
          expected.yesterday - yesterday.timestamp > TIME_BUFFER
        ) {
          isLateYesterday = true;
        }
      } else if (!today || expected.yesterday - today.timestamp > TIME_BUFFER) {
        // if `isDayStart`, then `today` actually represents yesterday
        isLateYesterday = true;
      }

      if (isWeekStart || isLateWeek) {
        await redis.setWeekStatsByRsn(player.rsn, {
          ...playerStats,
          late: isLateWeek,
        });
      }

      if (isLateYesterday) {
        await redis.setYesterdayStatsByRsn(player.rsn, {
          ...playerStats,
          late: true,
        });
      }

      if (isDayStart || isLateToday) {
        if (isDayStart) {
          const yesterday = await redis.getTodayStatsByRsn(player.rsn);
          await redis.setYesterdayStatsByRsn(player.rsn, yesterday);
        }

        await redis.setTodayStatsByRsn(player.rsn, {
          ...playerStats,
          late: isLateToday,
        });
      }

      success += 1;

      console.log("Success.");
    } else {
      console.log("Not found.");
    }
  });

  console.log(
    "Done! %d/%d, took ~ %d mins",
    success,
    players.length,
    Math.round((unixTimestamp() - timestamp) / 60)
  );

  await redis.disconnect();
};

module.exports = {
  fetchData,
};

(async () => {
  const redis = await connectRedisClient();

  const rsns = await redis.getAllRsns();

  const timestamp = unixTimestamp();
  const expected = {
    today: expectedToday(timestamp),
    yesterday: expectedYesterday(timestamp),
    week: expectedWeek(timestamp),
  };

  await Promise.all(
    rsns.map(async (rsn) => {
      console.log("Fixing %s", rsn);

      const today = await redis.getTodayStatsByRsn(rsn);
      const yesterday = await redis.getYesterdayStatsByRsn(rsn);
      const week = await redis.getWeekStatsByRsn(rsn);

      let fixed = false;

      if (today && today.late && today.timestamp - expected.today <= 10 * 60) {
        await redis.setTodayStatsByRsn(rsn, { ...today, late: false });
        fixed = true;
      }

      if (
        yesterday &&
        yesterday.late &&
        yesterday.timestamp - expected.yesterday <= 10 * 60
      ) {
        await redis.setYesterdayStatsByRsn(rsn, { ...yesterday, late: false });
        fixed = true;
      }

      if (week && week.late && week.timestamp - expected.week <= 10 * 60) {
        await redis.setWeekStatsByRsn(rsn, { ...week, late: false });
        fixed = true;
      }

      console.log(fixed ? "Fixed!" : "Nothing to fix.");
    })
  );

  await redis.disconnect();
})();
