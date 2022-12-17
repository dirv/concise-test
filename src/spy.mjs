import { ExpectationError } from "./ExpectationError.mjs";
import { equals } from "./equals.mjs";

export const spy = (returnValue) => {
  let callHistory = [];
  const spyFunction = (...args) => {
    callHistory.push(args);
    return returnValue;
  };
  spyFunction.calls = callHistory;
  return spyFunction;
};

export const toBeCalledWith = (spy, ...expectedArgs) => {
  const anyMatch = spy.calls.some((callArgs) =>
    equals(callArgs, expectedArgs)
  );

  if (!anyMatch)
    throw new ExpectationError(
      "spy to be called with arguments",
      {
        actual: spy.calls,
        expected: expectedArgs,
        source: null,
      }
    );
};
