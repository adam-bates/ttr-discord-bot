const { promisify } = require("util");
const {
  fetchClanInfo,
  fetchPlayerStats,
} = require("../services/runescape-api");
const { connectRedisClient } = require("../services/redis");
const { forEachAsyncOrdered } = require("../utils/promises");
const { unixTimestamp } = require("../utils/time");

const wait = promisify(setTimeout);

const fetchData = async () => {
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
      await redis.setStatsByRsn(player.rsn, {
        ...stats,
        timestamp,
      });

      success += 1;

      console.log("Success.");
    } else {
      console.log("Not found.");
    }
  });

  console.log(
    "Done! %d/%d, took %d seconds",
    success,
    players.length,
    unixTimestamp() - timestamp
  );

  await redis.disconnect();
};

module.exports = {
  fetchData,
};
