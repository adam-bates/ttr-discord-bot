const { promisify } = require("util");
const {
  fetchClanInfo,
  fetchPlayerStats,
} = require("../services/runescape-api");
const { connectRedisClient } = require("../services/redis");
const { forEachAsyncOrdered } = require("../utils/promises");
const { unixTimestamp, fromUnixTimestamp } = require("../utils/time");

const wait = promisify(setTimeout);

const expectedWeek = (timestamp) => {
  const date = fromUnixTimestamp(timestamp);

  const MONDAY = 1;
  let dayOfWeek = date.getDay();

  while (dayOfWeek !== MONDAY) {
    date.setDate(date.getDate() - 1);
    dayOfWeek = date.getDay();
  }

  return unixTimestamp(new Date(date.toDateString()));
};

const expectedYesterday = (timestamp) => {
  const date = fromUnixTimestamp(timestamp);

  date.setDate(date.getDate() - 1);

  return unixTimestamp(new Date(date.toDateString()));
};

const expectedToday = (timestamp) => {
  const date = fromUnixTimestamp(timestamp);
  return unixTimestamp(new Date(date.toDateString()));
};

const fetchData = async ({ isWeekStart, isDayStart } = {}) => {
  const redis = await connectRedisClient();

  const players = await fetchClanInfo(process.env.CLAN_NAME);

  const rsns = players.map(({ rsn }) => rsn);
  await redis.updatePlayersByRsns(rsns);

  const timestamp = unixTimestamp();

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

      if (!isWeekStart) {
        const week = await redis.getWeekStatsByRsn(player.rsn);

        if (!week || week.timestamp < expectedWeek(timestamp)) {
          isLateWeek = true;
        }
      }

      const today = await redis.getTodayStatsByRsn(player.rsn);

      if (!isDayStart) {
        if (!today || today.timestamp < expectedToday(timestamp)) {
          isLateToday = true;
        }

        const yesterday = await redis.getYesterdayStatsByRsn(player.rsn);

        if (!yesterday || yesterday.timestamp < expectedYesterday(timestamp)) {
          isLateYesterday = true;
        }
      } else if (!today || today.timestamp < expectedYesterday(timestamp)) {
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
        const yesterday = await redis.getTodayStatsByRsn(player.rsn);
        await redis.setYesterdayStatsByRsn(player.rsn, yesterday);

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
