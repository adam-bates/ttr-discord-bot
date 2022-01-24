const unixTimestamp = (date = new Date()) => Math.floor(date.getTime() / 1000);

const fromUnixTimestamp = (timestamp) => new Date(timestamp * 1000);

const dropTime = (date) =>
  new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

module.exports = {
  unixTimestamp,
  fromUnixTimestamp,
  dropTime,
};
