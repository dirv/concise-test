import { color } from "./colors.mjs";
import { focusedOnly } from "./focus.mjs";
import { TestTimeoutError } from "./TestTimeoutError.mjs";
import { dispatch } from "./eventDispatcher.mjs";
export { expect } from "./expect.mjs";
import {
  registerSharedExample,
  findSharedExample,
  buildSharedExampleTest,
} from "./sharedExamples.mjs";

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

const runDescribe = async (describe) => {
  dispatch("beginningDescribe", describeStack, describe);
  describeStack = [...describeStack, describe];
  for (let i = 0; i < describe.children.length; ++i) {
    await runBlock(describe.children[i]);
  }
  describeStack = withoutLast(describeStack);
};

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
  const wrappedBody = buildSharedExampleTest(test);
  try {
    invokeBefores(test);
    await runBodyAndWait(wrappedBody);
    invokeAfters(test);
  } catch (e) {
    test.errors.push(e);
  }
  dispatch("finishedTest", test);
  global.currentTest = null;
};

const runItWithOpts = (timeout) => {
  currentTest = {
    ...currentTest,
    timeoutError: new TestTimeoutError(timeout),
  };
};

addModifier(it, "timesOutAfter", runItWithOpts, {});

const behavesLike = (name, sharedContextFn) =>
  describeWithOpts(name, findSharedExample(name), {
    sharedContextFn,
  });

addModifier(it, "behavesLike", behavesLike, {});
addModifier(describe, "shared", registerSharedExample);

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

const anyFailed = (block) => {
  if (isIt(block)) {
    return block.errors.length > 0;
  } else {
    return block.children.some(anyFailed);
  }
};

export const runParsedBlocks = async () => {
  const withFocus = focusedOnly(currentDescribe);
  for (let i = 0; i < withFocus.children.length; ++i) {
    await runBlock(withFocus.children[i]);
  }
  return anyFailed(currentDescribe);
};
