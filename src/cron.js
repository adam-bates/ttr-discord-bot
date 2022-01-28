require("dotenv").config();

const cron = require("node-cron");
const cronitor = require("cronitor")(process.env.CRONITOR_API_KEY);
const { fetchData } = require("./bot");

cronitor.wraps(cron);

/* Every 8 minutes, 6 times per hour, starting at the 10th minute of the hour.
ie. Minutes: 10, 18, 26, 34, 42, 50

This maintains a safe distance from the daily / weekly runs, while also being fairly up-to-date
*/
cronitor.schedule("Fetch data", "10,18,26,34,42,50 * * * *", () => fetchData());

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
