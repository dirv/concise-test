import { color } from "./colors.mjs";

export const toBeDefined = (actual) => {
  if (!actual) {
    throw new Error(
      "Expected undefined value to be defined"
    );
  }
};

export const toThrow = (fn, expected) => {
  try {
    fn();
    throw new Error(
      `Expected ${fn} to throw exception but it did not`
    );
  } catch (actual) {
    if (expected && actual.message !== expected.message)
      throw new Error(
        `Expected ${fn} to throw an exception, but the thrown error message did not match the expected message.\n` +
          `  Expected exception message: ${expected.message}\n` +
          `    Actual exception message: ${actual.message}\n`
      );
  }
};

export const toHaveLength = (actual, expected) => {
  if (actual.length !== expected) {
    throw new Error(
      color(
        `Expected value to have length <bold>${expected}</bold> but it was <bold>${actual.length}</bold>`
      )
    );
  }
};
