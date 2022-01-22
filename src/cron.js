require("dotenv").config();

const cron = require("node-cron");
const cronitor = require("cronitor")(process.env.CRONITOR_API_KEY);
const { fetchData, sendMessages } = require("./bot");

cronitor.wraps(cron);

// Every 3 hours
cronitor.schedule("Fetch data", "0 */3 * * *", () => fetchData());

// Every day at midnight
cronitor.schedule("Fetch daily data", "0 0 * * *", () =>
  fetchData({ isDayStart: true })
);

// Every Monday at midnight
cronitor.schedule("Fetch weekly data", "0 0 * * 1", () =>
  fetchData({ isWeekStart: true })
);

// Every 5 minutes
cronitor.schedule("Send messages", "*/5 * * * *", () => sendMessages());
