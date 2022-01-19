const chunkArray = (arr, totalChunks) => {
  const chunks = [];

  const perChunk = Math.ceil(arr.length / totalChunks);

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
