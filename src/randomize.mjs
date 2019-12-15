const shuffle = (arr) => {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; --i) {
    let j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};
export const randomizeBlocks = (
  shouldRandomize,
  block
) => {
  if (!shouldRandomize) {
    return block;
  }

  if (!block.children) {
    return block;
  }

  const randomizedChildren = block.children.map((child) =>
    randomizeBlocks(shouldRandomize, child)
  );

  return {
    ...block,
    children: shuffle(randomizedChildren),
  };
};
