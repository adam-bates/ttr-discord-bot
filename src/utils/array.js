const forEachAsync = async (array, asyncCallback) => {
  const promises = array.map(asyncCallback);
  return Promise.all(promises);
};

module.exports = {
  forEachAsync,
};
