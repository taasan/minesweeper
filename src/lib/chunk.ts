function chunk<T>(arr: ReadonlyArray<T>, perChunk: number): T[][] {
  return arr.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / perChunk);

    if (resultArray[chunkIndex] == null) {
      resultArray[chunkIndex] = []; // start a new chunk
    }

    resultArray[chunkIndex].push(item);

    return resultArray;
  }, [] as T[][]);
}

export default chunk;
