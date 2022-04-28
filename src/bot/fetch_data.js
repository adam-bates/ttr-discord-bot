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
      return 150000;
    }
    if (value > 1000000) {
      return 125000;
    }
    if (value > 6000000) {
      return 100000;
    }
    if (value > 3000000) {
      return 75000;
    }
    if (value > 1500000) {
      return 50000;
    }

    return 25000;
  }

  if (key === OVERALL_KEY) {
    if (value > 50000000) {
      return 225000;
    }
    if (value > 20000000) {
      return 200000;
    }
    if (value > 13000000) {
      return 175000;
    }
    if (value > 1000000) {
      return 150000;
    }
    if (value > 6000000) {
      return 125000;
    }
    if (value > 3000000) {
      return 100000;
    }
    if (value > 1500000) {
      return 75000;
    }

    return 50000;
  }

  if (CLUE_SCROLL_KEYS.includes(key)) {
    return 3;
  }

  return 0;
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

        const match =
          removedPlayer.rank === addedRsnStats.rank &&
          Object.entries(removedPlayerStats)
            .filter(
              ([key]) => !["rsn", "rank", "clanXp", "timestamp"].includes(key)
            )
            .every(([key, value]) => {
              const buffer = getRenameStatBuffer(key, value);

              return (
                value <= addedRsnStats[key] &&
                addedRsnStats[key] <= value + buffer
              );
            });

        return match;
      }
    );

    if (res) {
      const [addedRsn] = res;

      addedRsnStatsMap.delete(addedRsn);
      renames.push([removedPlayer.rsn, addedRsn]);
    }
  });

  await Promise.all(promises);

  return renames;
};

const fetchData = async ({ isWeekStart, isDayStart } = {}) => {
  const redis = await connectRedisClient();

  const currentEventDetails = await redis.getCurrentEventDetails();
  const eventNamesToEndSet = new Set();

  let players = await fetchClanInfo(process.env.CLAN_NAME);

  players = await Promise.all(
    players.map(async (p) => {
      const player = { ...p };

      const baseClanXp = await redis.getBaseClanXpByRsn(player.rsn);

      if (baseClanXp) {
        player.clanXp += baseClanXp;
      }

      return player;
    })
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
      "[%d] (%d/%d) Fetching player: %o",
      unixTimestamp(),
      idx + 1,
      players.length,
      player.rsn
    );

    const stats = await fetchPlayerStats(player.rsn);

    if (!stats) {
      console.log("[%d] Not found.", unixTimestamp());
      return;
    }

    const playerStats = {
      ...player,
      ...stats,
      timestamp,
    };

    await redis.setStatsByRsn(player.rsn, playerStats);

    const isNew = !oldRsnsSet.has(player.rsn);

    if (isNew) {
      const promises = currentEventDetails.map(async (event) => {
        const error = await redis.addStatsToEvent(
          event.name,
          player.rsn,
          playerStats
        );

        if (error) {
          console.error(`Error: ${error}`);
        }
      });
      await Promise.all(promises);
    }

    const promises = currentEventDetails.map(async (event) => {
      const goal = event.goal && parseInt(event.goal, 10);

      if (!goal || Number.isNaN(goal)) {
        return;
      }

      const startStats = await redis.getStartEventStatsByRsn(
        event.name,
        player.rsn
      );

      if (
        startStats &&
        startStats[OVERALL_KEY] &&
        startStats[OVERALL_KEY].xp &&
        playerStats &&
        playerStats[OVERALL_KEY] &&
        playerStats[OVERALL_KEY].xp
      ) {
        const fromXp = parseInt(
          startStats[OVERALL_KEY].xp.replace(/,/g, ""),
          10
        );
        const toXp = parseInt(
          playerStats[OVERALL_KEY].xp.replace(/,/g, ""),
          10
        );

        const diff = Math.max(toXp - fromXp, 0);

        if (diff >= goal * 1000000) {
          eventNamesToEndSet.add(event.name);
        }
      }
    });
    await Promise.all(promises);

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

    console.log("[%d] %o", unixTimestamp(), {
      isLateToday,
      isLateYesterday,
      isLateWeek,
      isDayStart,
      isWeekStart,
    });
    console.log("[%d] Success.", unixTimestamp());
  });

  const promises = Array.from(eventNamesToEndSet).map(async (eventName) => {
    await redis.endEvent(eventName, timestamp);

    console.log("[%d] Ended event: %s", unixTimestamp(), eventName);
  });
  await Promise.all(promises);

  console.log(
    "[%d] Done! %d/%d, took ~ %d mins",
    unixTimestamp(),
    success,
    players.length,
    Math.round((unixTimestamp() - timestamp) / 60)
  );

  await redis.disconnect();
};

module.exports = {
  fetchData,
};
