import { color } from "./colors.mjs";
import { focusedOnly } from "./focus.mjs";
import { TestTimeoutError } from "./TestTimeoutError.mjs";
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
  timeoutError: new TestTimeoutError(5000),
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

const addOptionsOverride = (
  object,
  property,
  fn,
  options
) =>
  Object.defineProperty(object, property, {
    value: (...args) => fn(...args, options),
  });

addOptionsOverride(it, "only", itWithOpts, {
  focus: true,
});
addOptionsOverride(describe, "only", describeWithOpts, {
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

const runDescribe = async (describe) => {
  console.log(indent(describe.name));
  describeStack = [...describeStack, describe];
  for (let i = 0; i < describe.children.length; ++i) {
    await runBlock(describe.children[i]);
  }
  describeStack = withoutLast(describeStack);
};

let successes = 0;
let failures = [];

const timeoutPromise = () =>
  currentTest.timeoutError.createTimeoutPromise();

const runBodyAndWait = async (body) => {
  const result = body();
  if (result instanceof Promise) {
    await Promise.race([result, timeoutPromise()]);
  }
};

const runIt = async (test) => {
  global.currentTest = test;
  test.describeStack = [...describeStack];
  try {
    invokeBefores(test);
    await runBodyAndWait(test.body);
    invokeAfters(test);
  } catch (e) {
    test.errors.push(e);
  }
  if (currentTest.errors.length > 0) {
    console.log(
      indent(color(`<red>✗</red> ${test.name}`))
    );
    failures.push(currentTest);
  } else {
    successes++;
    console.log(
      indent(color(`<green>✓</green> ${test.name}`))
    );
  }
  global.currentTest = null;
};

const runItWithOpts = (timeout) => {
  currentTest = {
    ...currentTest,
    timeoutError: new TestTimeoutError(timeout),
  };
};

addOptionsOverride(
  it,
  "timesOutAfter",
  runItWithOpts,
  {}
);

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

export const runParsedBlocks = async () => {
  const withFocus = focusedOnly(currentDescribe);
  for (let i = 0; i < withFocus.children.length; ++i) {
    await runBlock(withFocus.children[i]);
  }
  return { successes, failures };
};
