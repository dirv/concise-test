import { color } from "./colors.mjs";
import { focusedOnly } from "./focus.mjs";
export { expect } from "./expect.mjs";

let currentDescribe;

const makeDescribe = (name, options) => ({
  ...options,
  name,
  befores: [],
  afters: [],
  children: [],
});

currentDescribe = makeDescribe("root");

const describeWithOpts = (name, body, options = {}) => {
  const parentDescribe = currentDescribe;
  currentDescribe = makeDescribe(name, options);
  body();
  currentDescribe = {
    ...parentDescribe,
    children: [
      ...parentDescribe.children,
      currentDescribe,
    ],
  };
};

export const describe = (name, body) =>
  describeWithOpts(name, body, {});

const makeTest = (name, body, options) => ({
  name,
  body,
  ...options,
  errors: [],
});

const itWithOpts = (name, body, options) => {
  currentDescribe = {
    ...currentDescribe,
    children: [
      ...currentDescribe.children,
      makeTest(name, body, options),
    ],
  };
};

export const it = (name, body) =>
  itWithOpts(name, body, {});

const addModifier = (object, property, fn, options) =>
  Object.defineProperty(object, property, {
    value: (...args) => fn(...args, options),
  });

addModifier(it, "only", itWithOpts, {
  focus: true,
});
addModifier(describe, "only", describeWithOpts, {
  focus: true,
});

export const beforeEach = (body) => {
  currentDescribe = {
    ...currentDescribe,
    befores: [...currentDescribe.befores, body],
  };
};

export const afterEach = (body) => {
  currentDescribe = {
    ...currentDescribe,
    afters: [...currentDescribe.afters, body],
  };
};

const isIt = (testObject) =>
  testObject.hasOwnProperty("body");

let describeStack = [];

const indent = (message) =>
  `${" ".repeat(describeStack.length * 2)}${message}`;

const withoutLast = (arr) => arr.slice(0, -1);

const runDescribe = (describe) => {
  console.log(indent(describe.name));
  describeStack = [...describeStack, describe];
  describe.children.forEach(runBlock);
  describeStack = withoutLast(describeStack);
};

let successes = 0;
let failures = [];

const runIt = (test) => {
  global.currentTest = test;
  test.describeStack = [...describeStack];
  try {
    invokeBefores(test);
    test.body();
    invokeAfters(test);
  } catch (e) {
    test.errors.push(e);
  }
  if (test.errors.length > 0) {
    console.log(
      indent(color(`<red>✗</red> ${test.name}`))
    );
    failures.push(test);
  } else {
    successes++;
    console.log(
      indent(color(`<green>✓</green> ${test.name}`))
    );
  }
  global.currentTest = null;
};

const invokeAll = (fnArray) =>
  fnArray.forEach((fn) => fn());

const invokeBefores = () =>
  invokeAll(
    describeStack.flatMap((describe) => describe.befores)
  );

const invokeAfters = () =>
  invokeAll(
    describeStack.flatMap((describe) => describe.afters)
  );

const runBlock = (block) =>
  isIt(block) ? runIt(block) : runDescribe(block);

export const runParsedBlocks = () => {
  const withFocus = focusedOnly(currentDescribe);
  withFocus.children.forEach(runBlock);
  return { successes, failures };
};
