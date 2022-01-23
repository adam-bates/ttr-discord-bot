/* eslint-disable no-param-reassign */

const { createClient } = require("redis");

const GET_ALL_RSNS = "GetAllRsns";

const GET_RSN = "GetRsn";
const GET_USER_ID = "GetUserId";

const GET_LATEST_STATS = "GetStats/latest";
const GET_TODAY_STATS = "GetStats/today";
const GET_YESTERDAY_STATS = "GetStats/yesterday";
const GET_WEEK_STATS = "GetStats/week";

const GET_SNAPSHOT = "GetSnapshot";

const GET_EVENT_DETAILS = "GetEventDetails";
const GET_EVENT_START_SNAPSHOT = "GetEventStartSnapshot";
const GET_EVENT_END_SNAPSHOT = "GetEventStartSnapshot";

const GET_ROLE_ID = "GetRoleId";

const key = (...parts) => parts.join("/");
const { parse, stringify } = JSON;

const Redis = (client) => {
  const getAllRsns = async () => parse(await client.get(GET_ALL_RSNS)) || [];

  const getRsnByUserId = async (userId) => client.get(key(GET_RSN, userId));

  const setRsnByUserId = async (userId, rsn) => {
    await client.set(key(GET_RSN, userId), rsn);
    await client.set(key(GET_USER_ID, rsn), userId);
  };

  const deleteRsnByUserId = async (userId, rsn) => {
    await client.del(key(GET_RSN, userId));
    await client.del(key(GET_USER_ID, rsn));
  };

  const getUserIdByRsn = async (rsn) => client.get(key(GET_USER_ID, rsn));

  const getStatsByRsn = async (rsn) =>
    parse(await client.get(key(GET_LATEST_STATS, rsn)));

  const setStatsByRsn = async (rsn, stats) =>
    client.set(key(GET_LATEST_STATS, rsn), stringify(stats));

  const getTodayStatsByRsn = async (rsn) =>
    parse(await client.get(key(GET_TODAY_STATS, rsn)));

  const setTodayStatsByRsn = async (rsn, stats) =>
    client.set(key(GET_TODAY_STATS, rsn), stringify(stats));

  const getYesterdayStatsByRsn = async (rsn) =>
    parse(await client.get(key(GET_YESTERDAY_STATS, rsn)));

  const setYesterdayStatsByRsn = async (rsn, stats) =>
    client.set(key(GET_YESTERDAY_STATS, rsn), stringify(stats));

  const getWeekStatsByRsn = async (rsn) =>
    parse(await client.get(key(GET_WEEK_STATS, rsn)));

  const setWeekStatsByRsn = async (rsn, stats) =>
    client.set(key(GET_WEEK_STATS, rsn), stringify(stats));

  const getStatsSnapshotByRsnAndTimestamp = async (rsn, timestamp) =>
    parse(await client.get(key(GET_SNAPSHOT, rsn, timestamp)));

  const setStatsSnapshotByRsnAndTimestamp = async (rsn, timestamp, stats) =>
    client.set(key(GET_SNAPSHOT, rsn, timestamp), stringify(stats));

  const deleteStatsSnapshotByRsnAndTimestamp = async (rsn, timestamp) =>
    client.del(key(GET_SNAPSHOT, rsn, timestamp));

  const getStatSnapshotTimestampsByRsn = async (rsn) => {
    const keys = await client.sendCommand([
      "KEYS",
      `${key(GET_SNAPSHOT, rsn)}/*`,
    ]);

    return keys.map((k) => k.split("/")[2]);
  };

  const updatePlayersByRsns = async (rsns) => {
    const rsnsSet = new Set(rsns);
    const oldRsns = await getAllRsns();
    const removedRsns = oldRsns.filter((rsn) => !rsnsSet.has(rsn));

    // TODO: Look for changed names (removed <= new, comparing stats)

    await client.set(GET_ALL_RSNS, stringify(rsns));

    const promises = removedRsns.map(async (rsn) => {
      await client.del(key(GET_LATEST_STATS, rsn));

      // Note: Don't delete snapshots! They may be used in event results.
    });

    await Promise.all(promises);
  };

  const getRoleIdByLevel = async (level) => client.get(key(GET_ROLE_ID, level));

  const setRoleIdByLevel = async (level, roleId) =>
    client.set(key(GET_ROLE_ID, level), roleId);

  const deleteRoleIdByLevel = async (level) =>
    client.del(key(GET_ROLE_ID, level));

  const getAllLevelRoleIdAssignments = async () => {
    const keys = await client.sendCommand(["KEYS", `${GET_ROLE_ID}/*`]);

    const promises = keys.map(async (k) => {
      const level = k.split("/")[1];
      const roleId = await client.get(k);
      return { level, roleId };
    });

    return Promise.all(promises);
  };

  const searchForLevelWithRoleId = async (roleId) => {
    const assignments = await getAllLevelRoleIdAssignments();

    const res = assignments.find((assignment) => assignment.roleId === roleId);

    return res && res.level;
  };

  client.getAllRsns = getAllRsns;
  client.updatePlayersByRsns = updatePlayersByRsns;
  client.getRsnByUserId = getRsnByUserId;
  client.setRsnByUserId = setRsnByUserId;
  client.deleteRsnByUserId = deleteRsnByUserId;
  client.getUserIdByRsn = getUserIdByRsn;
  client.getStatsByRsn = getStatsByRsn;
  client.setStatsByRsn = setStatsByRsn;
  client.getTodayStatsByRsn = getTodayStatsByRsn;
  client.setTodayStatsByRsn = setTodayStatsByRsn;
  client.getYesterdayStatsByRsn = getYesterdayStatsByRsn;
  client.setYesterdayStatsByRsn = setYesterdayStatsByRsn;
  client.getWeekStatsByRsn = getWeekStatsByRsn;
  client.setWeekStatsByRsn = setWeekStatsByRsn;
  client.getStatsSnapshotByRsnAndTimestamp = getStatsSnapshotByRsnAndTimestamp;
  client.setStatsSnapshotByRsnAndTimestamp = setStatsSnapshotByRsnAndTimestamp;
  client.deleteStatsSnapshotByRsnAndTimestamp =
    deleteStatsSnapshotByRsnAndTimestamp;
  client.getStatSnapshotTimestampsByRsn = getStatSnapshotTimestampsByRsn;
  client.getRoleIdByLevel = getRoleIdByLevel;
  client.setRoleIdByLevel = setRoleIdByLevel;
  client.deleteRoleIdByLevel = deleteRoleIdByLevel;
  client.getAllLevelRoleIdAssignments = getAllLevelRoleIdAssignments;
  client.searchForLevelWithRoleId = searchForLevelWithRoleId;

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
