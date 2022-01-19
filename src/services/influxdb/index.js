const { InfluxDB, Point } = require("@influxdata/influxdb-client");

const url = process.env.INFLUX_DB_URL;
const token = process.env.INFLUX_DB_TOKEN;
const org = process.env.INFLUX_DB_ORG;
const bucket = process.env.INFLUX_DB_BUCKET;

const createInfluxClient = () => new InfluxDB({ url, token });

// addPlayerStats(null, [
//   {
//     rsn: "Convergent",
//     rank: "overseer",
//     stats: {
//       Overall: 0,
//       Attack: 0,
//       Defence: 0,
//       Strength: 0,
//       Constitution: 0,
//       Ranged: 0,
//       Prayer: 0,
//       Magic: 0,
//       Cooking: 0,
//       Woodcutting: 0,
//       Fletching: 0,
//       Fishing: 0,
//       Firemaking: 0,
//       Crafting: 0,
//       Smithing: 0,
//       Mining: 0,
//       Herblore: 0,
//       Agility: 0,
//       Thieving: 0,
//       Slayer: 0,
//       Farming: 0,
//       Runecrafting: 0,
//       Hunter: 0,
//       Construction: 0,
//       Summoning: 0,
//       Dungeoneering: 0,
//       Divination: 0,
//       Invention: 0,
//       Archaeology: 0,

//       "Bounty Hunter": 0,
//       "B.H. Rogues": 0,
//       "Dominion Tower": 0,
//       "The Crucible": 0,
//       "Castle Wars games": 0,
//       "B.A. Attackers": 0,
//       "B.A. Defenders": 0,
//       "B.A. Collectors": 0,
//       "B.A. Healers": 0,
//       "Duel Tournament": 0,
//       "Mobilising Armies": 0,
//       Conquest: 0,
//       "Fist of Guthix": 0,
//       "GG: Athletics": 0,
//       "GG: Resource Race": 0,
//       "WE2: Armadyl Lifetime Contribution": 0,
//       "WE2: Bandos Lifetime Contribution": 0,
//       "WE2: Armadyl PvP kills": 0,
//       "WE2: Bandos PvP kills": 0,
//       "Heist Guard Level": 0,
//       "Heist Robber Level": 0,
//       "CFP: 5 game average": 0,
//       "AF15: Cow Tipping": 0,
//       "AF15: Rats killed after the miniquest": 0,
//       RuneScore: 0,
//       "Clue Scrolls Easy": 0,
//       "Clue Scrolls Medium": 0,
//       "Clue Scrolls Hard": 0,
//       "Clue Scrolls Elite, Clue Scrolls Master": 0,
//     },
//   },
// ]);

const addPlayerStats = async (influx, playerStats) => {
  const writeApi = influx.getWriteApi(org, bucket);

  const measurement = "player_stats";

  const point = new Point(measurement)
    .floatField("used_percent", 23.43234543)
    .tag("rsn", "Convergent");

  writeApi.writePoint(point);

  try {
    await writeApi.close();
    console.log("FINISHED");
  } catch (e) {
    console.error(e);
    console.log("Finished ERROR");
  }
};

const read = (influx, { next, error, complete } = {}) => {
  const queryApi = influx.getQueryApi(org);

  const query = `from(bucket: "${bucket}") |> range(start: -1h)`;

  queryApi.queryRows(query, {
    next: (...args) => {
      if (next) {
        next(...args);
      }
    },
    error: (...args) => {
      if (error) {
        error(...args);
      }
    },
    complete: (...args) => {
      if (complete) {
        complete(...args);
      }
    },
  });
};

module.exports = {
  createInfluxClient,
  read,
};
