import { parentPort } from "node:worker_threads";
import { listen } from "../eventDispatcher.mjs";

const forwardEvent = (event) =>
  listen(event, (...args) => {
    parentPort.postMessage([event, args]);
  });

export const installReporter = () => {
  forwardEvent("beginningDescribe");
  forwardEvent("finishedTest");
  forwardEvent("skippingDescribe");
  forwardEvent("skippingTest");
};
