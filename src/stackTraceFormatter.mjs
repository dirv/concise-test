import path from "path";
import fs from "fs";
import { EOL } from "os";
import { color } from "./colors.mjs";

const ignoredFilePatterns = [
  "/node_modules/",
  path.dirname(new URL(import.meta.url).pathname),
  "^internal/",
];

const findFailureCallSite = (stack) =>
  stack.find((callSite) => {
    const fileName = callSite.getFileName();
    return (
      fileName &&
      !ignoredFilePatterns.some((pattern) =>
        fileName.match(pattern)
      )
    );
  });

const relative = (fileUrl) =>
  path.relative(
    process.cwd(),
    fileUrl.replace("file://", "")
  );

const getFailureLocation = (stack) => {
  const failureLocation = findFailureCallSite(stack);
  if (failureLocation) {
    return {
      fileName: relative(failureLocation.getFileName()),
      lineNumber: failureLocation.getLineNumber(),
      column: failureLocation.getColumnNumber(),
    };
  }
};

const pipeSeparatedLine = (...columns) =>
  columns.join(" | ");

const withLineNumbers = (lines, start) => {
  const numberColumnWidth = (
    lines.length + start
  ).toString().length;

  return lines.map((line, index) => {
    const number = (start + index)
      .toString()
      .padStart(numberColumnWidth);
    return pipeSeparatedLine(number, line);
  });
};

const pointerAt = (column, maxLineNumber) => {
  const padding = maxLineNumber.toString().length;

  return pipeSeparatedLine(
    " ".repeat(padding),
    `${" ".repeat(column - 1)}<bold>^</bold>`
  );
};

const boundedSlice = (array, from, to) =>
  array.slice(
    Math.max(from, 0),
    Math.min(to, array.length - 1)
  );

const highlightedSource = ({
  fileName,
  lineNumber,
  column,
}) => {
  const allLines = fs
    .readFileSync(fileName, { encoding: "utf8" })
    .split(EOL);

  const fromLine = lineNumber - 3;
  const toLine = lineNumber + 2;

  const highlightedLines = withLineNumbers(
    boundedSlice(allLines, fromLine, toLine),
    fromLine + 1
  );

  return [
    ...highlightedLines.slice(0, 3),
    pointerAt(column, toLine),
    ...highlightedLines.slice(3, 5),
  ];
};

const indentLine = (line) => `  ${line}`;

export const formatStackTrace = (error, stack) => {
  const failureLocation = getFailureLocation(stack);
  if (!failureLocation) return;

  const { fileName } = failureLocation;

  const introLine = `in <bold>${fileName}</bold>:`;

  const allLines = [
    "",
    introLine,
    "",
    ...highlightedSource(failureLocation),
  ];

  return color(allLines.map(indentLine).join(EOL));
};
