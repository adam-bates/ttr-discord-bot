const wait = require("util").promisify(setTimeout);
const {
  fetchClanInfo,
  fetchPlayerStats,
} = require("../services/runescape-api");
const { forEachAsyncOrdered } = require("../utils/promises");
const { chunkArray } = require("../utils/arrays");

const fetchData = async () => {
  const players = await fetchClanInfo(process.env.CLAN_NAME);

  const playerChunks = chunkArray(players, Math.ceil(players.length / 100));

  await forEachAsyncOrdered(playerChunks, async (playerChunk) => {
    const playersStats = await forEachAsyncOrdered(
      playerChunk,
      async (player, idx) => {
        if (idx > 0) {
          await wait(10);
        }
        console.log("Fetching player: %o", player.rsn);

        const stats = await fetchPlayerStats(player.rsn);

        if (stats) {
          console.log("Size: %d", JSON.stringify(stats, null, 0).length);
        } else {
          console.log("Not found.");
        }

        return {
          ...player,
          stats,
        };
      }
    );

    console.log("Got stats for %d players.", playersStats.length);
  });
};

module.exports = {
  fetchData,
};
