import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Worker } from "node:worker_threads";
import { color } from "./colors.mjs";
import { formatStackTrace } from "./stackTraceFormatter.mjs";
import { runParsedBlocks } from "./testContext.mjs";
import { installReporter } from "./reporters/default.mjs";
import { dispatch } from "./eventDispatcher.mjs";

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);
const workerFilePath = path.join(
  __dirname,
  "./worker.mjs"
);

Error.prepareStackTrace = formatStackTrace;

const exitCodes = {
  ok: 0,
  failures: 1,
  cannotAccessFile: 2,
};

const isSingleFileMode = () =>
  process.argv[2] && !process.argv[2].startsWith("-");

const getSingleFilePath = async () => {
  const filePathArg = process.argv[2];
  try {
    const fullPath = path.resolve(
      process.cwd(),
      filePathArg
    );
    await fs.promises.access(fullPath);
    return [fullPath];
  } catch {
    console.error(
      `File ${filePathArg} could not be accessed.`
    );
    process.exit(exitCodes.cannotAccessFile);
  }
};

const discoverTestFiles = async () => {
  const testDir = path.resolve(process.cwd(), "test");
  const dir = await fs.promises.opendir(testDir);
  let testFilePaths = [];
  for await (const dirent of dir) {
    if (dirent.name.endsWith(".tests.mjs")) {
      const fullPath = path.resolve(
        dir.path,
        dirent.name
      );
      testFilePaths.push(fullPath);
    }
  }
  return testFilePaths;
};

const chooseTestFiles = () =>
  isSingleFileMode()
    ? getSingleFilePath()
    : discoverTestFiles();

const readRandomFlag = () => {
  if (process.argv.find((t) => t === "--randomize")) {
    return true;
  }
};

const readTags = () => {
  const tagArgIndex = process.argv.findIndex(
    (t) => t === "--tags"
  );
  if (tagArgIndex > -1) {
    return process.argv[tagArgIndex + 1]
      .split(",")
      .map((tag) => tag.trim());
  }
};

const createWorker = (testFilePath, processOptions) => {
  const worker = new Worker(workerFilePath, {
    workerData: {
      ...processOptions,
      testFilePath,
    },
  });
  worker.on("message", ([event, args]) =>
    dispatch(event, ...args)
  );
  return worker;
};

const waitForWorker = (worker) =>
  new Promise((resolve) => {
    worker.on("exit", (code) => {
      resolve(code);
    });
  });

const anyFailures = (exitCodes) =>
  exitCodes.filter((exitCode) => exitCode !== 0).count >
  0;

export const run = async () => {
  installReporter();
  const testFilePaths = await chooseTestFiles();
  const processOptions = {
    tags: readTags(),
    shouldRandomise: readRandomFlag(),
  };
  const exitCodes = await Promise.all(
    testFilePaths.map((testFilePath) =>
      waitForWorker(
        createWorker(testFilePath, processOptions)
      )
    )
  );
  dispatch("finishedTestRun");
  process.exit(
    anyFailures(exitCodes)
      ? exitCodes.failures
      : exitCodes.ok
  );
};
