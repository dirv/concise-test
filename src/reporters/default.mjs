import { listen, dispatch } from "../eventDispatcher.mjs";

const indent = (stack, message) =>
  `${" ".repeat(stack.length * 2)}${message}`;

export const installReporter = () => {
  listen(
    "beginningDescribe",
    (describeStack, { name }) => {
      console.log(indent(describeStack, name));
    }
  );
};
