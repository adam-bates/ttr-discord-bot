const chunkArray = (arr, options) => {
  let { perChunk, totalChunks } = options;

  if (perChunk) {
    totalChunks = Math.ceil(arr.length / perChunk);
  } else {
    perChunk = Math.ceil(arr.length / totalChunks);
  }

  const chunks = [];

  for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
    const chunk = [];

    for (
      let idx = chunkIdx * perChunk;
      idx < (1 + chunkIdx) * perChunk && idx < arr.length;
      idx++
    ) {
      chunk.push(arr[idx]);
    }

    chunks.push(chunk);
  }

  return chunks;
};

module.exports = {
  chunkArray,
};
