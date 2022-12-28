import { workerData } from "node:worker_threads";
import { runParsedBlocks } from "./testContext.mjs";
import { installReporter } from "./reporters/workerForwarder.mjs";

const { testFilePath, tags, shouldRandomize } =
  workerData;

const exitCodes = {
  ok: 0,
  failures: 1,
  parseError: 3,
};

installReporter();

try {
  await import(testFilePath);
} catch (e) {
  console.error(e.message);
  console.error(e.stack);
  process.exit(exitCodes.parseError);
}

const failed = await runParsedBlocks({
  tags,
  shouldRandomize,
});

process.exit(failed ? exitCodes.failures : exitCodes.ok);
