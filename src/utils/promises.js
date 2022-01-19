const forEachAsync = async (array, asyncCallback) => {
  const promises = array.map(asyncCallback);
  return Promise.all(promises);
};

const forEachAsyncOrdered = async (array, asyncCallback) =>
  array.reduce(
    async (promise, next, idx) => {
      const arr = await promise;
      return [...arr, await asyncCallback(next, idx)];
    },
    new Promise((res) => {
      res([]);
    })
  );

module.exports = {
  forEachAsync,
  forEachAsyncOrdered,
};
