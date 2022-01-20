const { connectRedisClient } = require("../services/redis");

const sendMessages = async () => {
  const redis = await connectRedisClient();

  await redis.disconnect();
};

module.exports = {
  sendMessages,
};
