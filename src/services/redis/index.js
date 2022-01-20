const { createClient } = require("redis");

const GET_ALL_RSNS = "GetAllRsns";
const GET_RSN_BY_USER_ID = "GetRsnByUserId";
const GET_USER_ID_BY_RSN = "GetUserIdByRsn";

const key = (...parts) => parts.join("/");
const { parse, stringify } = JSON;

const Redis = (client) => {
  const getAllRsns = async () => parse(await client.get(GET_ALL_RSNS)) || [];

  const setAllRsns = async (rsns) => client.set(GET_ALL_RSNS, stringify(rsns));

  const getRsnByUserId = async (userId) =>
    client.get(key(GET_RSN_BY_USER_ID, userId));

  const setRsnByUserId = async (userId, rsn) => {
    if (rsn == null) {
      await client.del(key(GET_RSN_BY_USER_ID, userId));
      await client.del(key(GET_USER_ID_BY_RSN, rsn));
    } else {
      await client.set(key(GET_RSN_BY_USER_ID, userId), rsn);
      await client.set(key(GET_USER_ID_BY_RSN, rsn), userId);
    }
  };

  const getUserIdByRsn = async (rsn) =>
    client.get(key(GET_USER_ID_BY_RSN, rsn));

  return {
    ...client,
    getAllRsns,
    setAllRsns,
    getRsnByUserId,
    setRsnByUserId,
    getUserIdByRsn,
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
