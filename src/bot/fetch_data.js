const { promisify } = require("util");
const {
  fetchClanInfo,
  fetchPlayerStats,
} = require("../services/runescape-api");
const { connectRedisClient } = require("../services/redis");
const { forEachAsyncOrdered } = require("../utils/promises");
const { chunkArray } = require("../utils/arrays");

const wait = promisify(setTimeout);

const fetchData = async () => {
  const redis = await connectRedisClient();

  const players = await fetchClanInfo(process.env.CLAN_NAME);

  const rsns = players.map(({ rsn }) => rsn);
  await redis.set("GetAllRsns", JSON.stringify(rsns));

  // const playerChunks = chunkArray(players, Math.ceil(players.length / 100));

  // await forEachAsyncOrdered(playerChunks, async (playerChunk) => {
  //   const playersStats = await forEachAsyncOrdered(
  //     playerChunk,
  //     async (player, idx) => {
  //       if (idx > 0) {
  //         await wait(10);
  //       }
  //       console.log("Fetching player: %o", player.rsn);

  //       const stats = await fetchPlayerStats(player.rsn);

  //       if (stats) {
  //         console.log("Size: %d", JSON.stringify(stats, null, 0).length);
  //       } else {
  //         console.log("Not found.");
  //       }

  //       return {
  //         ...player,
  //         stats,
  //       };
  //     }
  //   );

  //   console.log("Got stats for %d players.", playersStats.length);
  // });

  await redis.disconnect();
};

module.exports = {
  fetchData,
};
