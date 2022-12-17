import { color } from "./colors.mjs";
import { ExpectationError } from "./ExpectationError.mjs";
import { EOL } from "os";
export { toBeCalledWith } from "./spy.mjs";

export const toBeDefined = (actual) => {
  if (actual === undefined) {
    throw new ExpectationError("<actual> to be defined", {
      actual,
    });
  }
};

export const toBe = (actual, expected) => {
  if (actual !== expected) {
    throw new ExpectationError(
      "<actual> to be <expected>",
      { actual, expected }
    );
  }
};

export const toThrow = (source, expected) => {
  try {
    source();
    throw new ExpectationError(
      "<source> to throw exception but it did not",
      { source }
    );
  } catch (actual) {
    if (expected && actual.message !== expected.message)
      throw new ExpectationError(
        "<source> to throw an exception, but the thrown error message did not match the expected message." +
          EOL +
          "  Expected exception message: <expected>" +
          EOL +
          "    Actual exception message: <actual>",
        {
          source,
          actual: actual.message,
          expected: expected.message,
        }
      );
  }
};

export const toHaveLength = (actual, expected) => {
  if (actual.length !== expected) {
    throw new ExpectationError(
      "value to have length <expected> but it was <actual>",
      { actual: actual.length, expected }
    );
  }
};
