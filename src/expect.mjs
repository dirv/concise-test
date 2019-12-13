import { ExpectationError } from "./ExpectationError.mjs";
import * as matchers from "./matchers.mjs";

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
