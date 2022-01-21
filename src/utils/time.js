const unixTimestamp = (date = new Date()) => Math.floor(date.getTime() / 1000);

const fromUnixTimestamp = (timestamp) => new Date(timestamp * 1000);

module.exports = {
  unixTimestamp,
  fromUnixTimestamp,
};
