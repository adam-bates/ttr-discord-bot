require("dotenv").config();

const cron = require("node-cron");
const cronitor = require("cronitor")(process.env.CRONITOR_API_KEY);
const { fetchData } = require("./bot");

cronitor.wraps(cron);

// Every 30 minutes, offset by 10 minutes
cronitor.schedule("Fetch data", "10,40 0 * * 1", () => fetchData());

// Every day at 00:05
cronitor.schedule("Fetch daily data", "5 0 * * *", () =>
  fetchData({ isDayStart: true })
);

// Every Monday at 00:00
cronitor.schedule("Fetch weekly data", "0 0 * * 1", () =>
  fetchData({ isWeekStart: true })
);

// Every 5 minutes
// cronitor.schedule("Send messages", "*/5 * * * *", () => sendMessages());
