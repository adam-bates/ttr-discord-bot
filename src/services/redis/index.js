const { createClient } = require("redis");

const GET_ALL_RSNS = "GetAllRsns";
const GET_RSN_BY_USER_ID = "GetRsnByUserId";
const GET_USER_ID_BY_RSN = "GetUserIdByRsn";
const GET_STATS_BY_RSN_BY_TIMESTAMP = "GetStatsByRsnByTimestamp";

const key = (...parts) => parts.join("/");
const { parse, stringify } = JSON;

const Redis = (client) => {
  const getAllRsns = async () => parse(await client.get(GET_ALL_RSNS)) || [];

  const setAllRsns = async (rsns) => client.set(GET_ALL_RSNS, stringify(rsns));

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

  const getStatsByRsnByTimestamp = async (rsn, timestamp) =>
    parse(await client.get(key(GET_STATS_BY_RSN_BY_TIMESTAMP, rsn, timestamp)));

  const addStatsByRsnByTimestamp = async (rsn, timestamp, snapshot) =>
    client.set(
      key(GET_STATS_BY_RSN_BY_TIMESTAMP, rsn, timestamp),
      stringify(snapshot)
    );

  const deleteStatsByRsnByTimestamp = async (rsn, timestamp) =>
    client.del(key(GET_STATS_BY_RSN_BY_TIMESTAMP, rsn, timestamp));

  const getStatTimestampsByRsn = async (rsn) => {
    const keys = await client.sendCommand([
      "KEYS",
      `${key(GET_STATS_BY_RSN_BY_TIMESTAMP, rsn)}/*`,
    ]);

    return keys.map((k) => k.split("/")[2]);
  };

  const getLatestStatTimestampByRsn = async (rsn) => {
    const timestamps = await getStatTimestampsByRsn(rsn);
    return Math.max(...timestamps);
  };

  const getLatestStatsByRsn = async (rsn) =>
    getStatsByRsnByTimestamp(rsn, await getLatestStatTimestampByRsn(rsn));

  return {
    disconnect: client.disconnect,
    getAllRsns,
    setAllRsns,
    getRsnByUserId,
    setRsnByUserId,
    deleteRsnByUserId,
    getUserIdByRsn,
    getStatsByRsnByTimestamp,
    addStatsByRsnByTimestamp,
    deleteStatsByRsnByTimestamp,
    getStatTimestampsByRsn,
    getLatestStatTimestampByRsn,
    getLatestStatsByRsn,
  };
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
