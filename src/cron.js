require("dotenv").config();

let cron = require("node-cron");
const { fetchData, sendMessages } = require("./bot");

let schedule = (_name, key, callback) => cron.schedule(key, callback);

if (process.env.CRONITOR_API_KEY) {
  // eslint-disable-next-line global-require
  const cronitor = require("cronitor")(process.env.CRONITOR_API_KEY);
  cronitor.wraps(cron);
  cron = cronitor;

  schedule = (name, key, callback) => cronitor.schedule(name, key, callback);
}

// Every 3 hours
schedule("Fetch data", "0 */3 * * *", () => fetchData());

// Every day at midnight
schedule("Fetch daily data", "0 0 * * *", () =>
  fetchData({ isDayStart: true })
);

// Every Monday at midnight
schedule("Fetch weekly data", "0 0 * * 1", () =>
  fetchData({ isWeekStart: true })
);

// Every 5 minutes
cron.schedule("Send messages", "*/5 * * * *", () => sendMessages());
