const keysEqual = (l, r) => {
  const lks = Object.keys(l);
  const rks = Object.keys(r);

  if (lks.length !== rks.length) return false;

  return lks.every((lk) => rks.includes(lk));
};

const objectsWithSameKeys = (l, r) =>
  typeof l === "object" &&
  typeof r === "object" &&
  keysEqual(l, r);

const arraysOfEqualLength = (l, r) =>
  Array.isArray(l) &&
  Array.isArray(r) &&
  l.length === r.length;

export const equals = (l, r) => {
  if (l === r) return true;

  if (!l) return false;
  if (!r) return false;

  // The following conditional enables use of
  // "constraining" functions like anObjectMatching.
  if (typeof r === "function") {
    return r(l);
  }

  if (
    arraysOfEqualLength(l, r) &&
    l.every((lv, i) => equals(lv, r[i]))
  )
    return true;

  if (
    objectsWithSameKeys(l, r) &&
    Object.keys(l).every((lk) => equals(l[lk], r[lk]))
  )
    return true;

  return false;
};

const contains = (l, r) => {
  if (!l) return false;
  if (!r) return false;

  if (typeof l !== "object") return false;
  if (typeof r !== "object") return false;

  return Object.keys(r).every((rk) =>
    equals(l[rk], r[rk])
  );
};

export const anObjectContaining =
  (expected) => (actual) =>
    contains(actual, expected);
