const axios = require("axios");

const getUserInfo = async (rsn) => {
  const res = await axios.get(
    `https://secure.runescape.com/m=hiscore/index_lite.ws?player=${rsn}`
  );

  return res.data;
};

const getClanInfo = async () => {
  const res = await axios.get(
    "http://services.runescape.com/m=clan-hiscores/members_lite.ws?clanName=the+last+citadel"
  );

  const data = res.data.replaceAll("�", " ");

  const lines = data.split("\n");
  lines.shift();

  const clan = lines.reduce((arr, line) => {
    const [rsn, rank] = line.split(",");
    return [...arr, { rsn, rank }];
  }, []);

  return clan;
};

module.exports = {
  getUserInfo,
  getClanInfo,
};
