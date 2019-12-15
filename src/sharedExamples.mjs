let sharedExamples = {};

export const registerSharedExample = (name, body) => {
  sharedExamples = {
    ...sharedExamples,
    [name]: body,
  };
};

export const findSharedExample = (name) =>
  sharedExamples[name];

const findContextFn = (stack) =>
  stack
    .map((block) => block.sharedContextFn)
    .find((fn) => fn);

export const buildSharedExampleTest = ({
  body,
  describeStack,
}) => {
  const sharedContextFn = findContextFn(describeStack);
  return sharedContextFn
    ? () => body(sharedContextFn())
    : body;
};
