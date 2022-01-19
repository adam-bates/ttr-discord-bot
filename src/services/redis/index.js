const { createClient } = require("redis");

const connectRedisClient = async () => {
  const client = createClient();

  client.on("error", (err) => console.log("Redis Client Error", err));

  return client.connect();
};

module.exports = {
  connectRedisClient,
};
