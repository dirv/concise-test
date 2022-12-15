import path from "path";
import fs from "fs";
import { color } from "./colors.mjs";
import * as matchers from "./matchers.mjs";
import { ExpectationError } from "./ExpectationError.mjs";
import { formatStackTrace } from "./stackTraceFormatter.mjs";

Error.prepareStackTrace = formatStackTrace;

let successes = 0;
let currentTest;
let failures = [];
let describeStack = [];

const exitCodes = {
  ok: 0,
  failures: 1,
};

export const run = async () => {
  try {
    await import(
      path.resolve(process.cwd(), "test/tests.js")
    );
  } catch (e) {
    console.error(e.message);
    console.error(e.stack);
  }
  printFailures();
  console.log(
    color(
      `<green>${successes}</green> tests passed, ` +
        `<red>${failures.length}</red> tests failed.`
    )
  );
  process.exit(
    failures.length > 0
      ? exitCodes.failures
      : exitCodes.ok
  );
};

const indent = (message) =>
  `${" ".repeat(describeStack.length * 2)}${message}`;

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

const makeTest = (name) => ({
  testName: name,
  errors: [],
  describeStack,
});

export const it = (name, body) => {
  currentTest = makeTest(name);
  try {
    invokeBefores();
    body();
    invokeAfters();
  } catch (e) {
    currentTest.errors.push(e);
  }
  if (currentTest.errors.length > 0) {
    console.log(indent(color(`<red>✗</red> ${name}`)));
    failures.push(currentTest);
  } else {
    successes++;
    console.log(
      indent(color(`<green>✓</green> ${name}`))
    );
  }
};

const fullTestDescription = ({
  testName,
  describeStack,
}) =>
  [...describeStack, { name: testName }]
    .map(({ name }) => `<bold>${name}</bold>`)
    .join(" → ");

const printFailure = (failure) => {
  console.error(color(fullTestDescription(failure)));
  failure.errors.forEach((error) => {
    console.error(error.message);
    console.error(error.stack);
  });
  console.error("");
};

const printFailures = () => {
  if (failures.length > 0) {
    console.error("");
    console.error("Failures:");
    console.error("");
  }
  failures.forEach(printFailure);
};

const withoutLast = (arr) => arr.slice(0, -1);

const makeDescribe = (name) => ({
  name,
  befores: [],
  afters: [],
});

export const describe = (name, body) => {
  console.log(indent(name));
  describeStack = [...describeStack, makeDescribe(name)];
  body();
  describeStack = withoutLast(describeStack);
};

const last = (arr) => arr[arr.length - 1];

const currentDescribe = () => last(describeStack);

const updateDescribe = (newProps) => {
  const newDescribe = {
    ...currentDescribe(),
    ...newProps,
  };
  describeStack = [
    ...withoutLast(describeStack),
    newDescribe,
  ];
};
export const beforeEach = (body) =>
  updateDescribe({
    befores: [...currentDescribe().befores, body],
  });

export const afterEach = (body) =>
  updateDescribe({
    afters: [...currentDescribe().afters, body],
  });

const matcherHandler = (actual) => ({
  get:
    (_, name) =>
    (...args) => {
      try {
        matchers[name](actual, ...args);
      } catch (e) {
        if (e instanceof ExpectationError) {
          currentTest.errors.push(e);
        } else {
          throw e;
        }
      }
    },
});

export const expect = (actual) =>
  new Proxy({}, matcherHandler(actual));
