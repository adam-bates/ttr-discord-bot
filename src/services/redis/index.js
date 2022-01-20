/* eslint-disable no-param-reassign */

const { createClient } = require("redis");

const GET_ALL_RSNS = "GetAllRsns";
const GET_RSN_BY_USER_ID = "GetRsnByUserId";
const GET_USER_ID_BY_RSN = "GetUserIdByRsn";
const GET_STATS_BY_RSN = "GetStatsByRsn";
const GET_STATS_SNAPSHOT_BY_RSN_AND_TIMESTAMP =
  "GetStatsSnapshotByRsnAndTimestamp";

const key = (...parts) => parts.join("/");
const { parse, stringify } = JSON;

const Redis = (client) => {
  const getAllRsns = async () => parse(await client.get(GET_ALL_RSNS)) || [];

  const getRsnByUserId = async (userId) =>
    client.get(key(GET_RSN_BY_USER_ID, userId));

  const setRsnByUserId = async (userId, rsn) => {
    await client.set(key(GET_RSN_BY_USER_ID, userId), rsn);
    await client.set(key(GET_USER_ID_BY_RSN, rsn), userId);
  };

  const deleteRsnByUserId = async (userId, rsn) => {
    await client.del(key(GET_RSN_BY_USER_ID, userId));
    await client.del(key(GET_USER_ID_BY_RSN, rsn));
  };

  const getUserIdByRsn = async (rsn) =>
    client.get(key(GET_USER_ID_BY_RSN, rsn));

  const getStatsByRsn = async (rsn) =>
    parse(await client.get(key(GET_STATS_BY_RSN, rsn)));

  const setStatsByRsn = async (rsn, stats) =>
    client.set(key(GET_STATS_BY_RSN, rsn), stringify(stats));

  const getStatsSnapshotByRsnAndTimestamp = async (rsn, timestamp) =>
    parse(
      await client.get(
        key(GET_STATS_SNAPSHOT_BY_RSN_AND_TIMESTAMP, rsn, timestamp)
      )
    );

  const setStatsSnapshotByRsnAndTimestamp = async (rsn, timestamp, stats) =>
    client.set(
      key(GET_STATS_SNAPSHOT_BY_RSN_AND_TIMESTAMP, rsn, timestamp),
      stringify(stats)
    );

  const deleteStatsSnapshotByRsnAndTimestamp = async (rsn, timestamp) =>
    client.del(key(GET_STATS_SNAPSHOT_BY_RSN_AND_TIMESTAMP, rsn, timestamp));

  const getStatSnapshotTimestampsByRsn = async (rsn) => {
    const keys = await client.sendCommand([
      "KEYS",
      `${key(GET_STATS_SNAPSHOT_BY_RSN_AND_TIMESTAMP, rsn)}/*`,
    ]);

    return keys.map((k) => k.split("/")[2]);
  };

  const updatePlayersByRsns = async (rsns) => {
    const rsnsSet = new Set(rsns);
    const oldRsns = await getAllRsns();
    const removedRsns = oldRsns.filter((rsn) => !rsnsSet.has(rsn));

    await client.set(GET_ALL_RSNS, stringify(rsns));

    const promises = removedRsns.map(async (rsn) => {
      await client.del(key(GET_STATS_BY_RSN, rsn));

      // Note: Don't delete snapshots! They may be used in event results.
    });

    await Promise.all(promises);
  };

  client.getAllRsns = getAllRsns;
  client.updatePlayersByRsns = updatePlayersByRsns;
  client.getRsnByUserId = getRsnByUserId;
  client.setRsnByUserId = setRsnByUserId;
  client.deleteRsnByUserId = deleteRsnByUserId;
  client.getUserIdByRsn = getUserIdByRsn;
  client.getStatsByRsn = getStatsByRsn;
  client.setStatsByRsn = setStatsByRsn;
  client.getStatsSnapshotByRsnAndTimestamp = getStatsSnapshotByRsnAndTimestamp;
  client.setStatsSnapshotByRsnAndTimestamp = setStatsSnapshotByRsnAndTimestamp;
  client.deleteStatsSnapshotByRsnAndTimestamp =
    deleteStatsSnapshotByRsnAndTimestamp;
  client.getStatSnapshotTimestampsByRsn = getStatSnapshotTimestampsByRsn;

  return client;
};

const connectRedisClient = async () => {
  const client = createClient({
    url: process.env.REDIS_URL,
  });

  client.on("error", (err) => console.log("Redis Client Error", err));

  await client.connect();

  return Redis(client);
};

module.exports = {
  connectRedisClient,
};
