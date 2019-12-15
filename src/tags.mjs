const tagMatch = (tagsToSearch, tagsToFind) =>
  tagsToSearch.some((tag) => tagsToFind.includes(tag));

export const taggedOnly = (tags, block) => {
  if (!tags) {
    return block;
  }

  if (block.tags && tagMatch(block.tags, tags)) {
    return block;
  }

  if (!block.children) {
    return null;
  }

  const taggedChildren = block.children
    .map((child) => taggedOnly(tags, child))
    .filter((child) => child);

  return {
    ...block,
    children: taggedChildren,
  };
};
