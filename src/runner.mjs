import path from "path";
import fs from "fs";
import { formatStackTrace } from "./stackTraceFormatter.mjs";
import { runParsedBlocks } from "./testContext.mjs";

Error.prepareStackTrace = formatStackTrace;

const exitCodes = {
  ok: 0,
  failures: 1,
  cannotAccessFile: 2,
  parseError: 3,
};

const isSingleFileMode = () => process.argv[2];

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

export const run = async () => {
  try {
    const testFilePaths = await chooseTestFiles();
    await Promise.all(
      testFilePaths.map(async (testFilePath) => {
        await import(testFilePath);
      })
    );
    const { failures, successes } = runParsedBlocks();
    printFailures(failures);
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
  } catch (e) {
    console.error(e.message);
    console.error(e.stack);
    process.exit(exitCodes.parseError);
  }
};

const fullTestDescription = ({ name, describeStack }) =>
  [...describeStack, { name }]
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

const printFailures = (failures) => {
  if (failures.length > 0) {
    console.error("");
    console.error("Failures:");
    console.error("");
  }
  failures.forEach(printFailure);
};
