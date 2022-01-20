const unixTimestamp = (date = new Date()) => Math.floor(date.getTime() / 1000);

module.exports = {
  unixTimestamp,
};
