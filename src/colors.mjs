const ansiColors = {
  bold: "\u001b[37;1m",
  cyan: "\u001b[36m",
  green: "\u001b[32m",
  red: "\u001b[31m",
  yellow: "\u001b[33m",
};
const ansiReset = "\u001b[0m";

export const color = (message) =>
  Object.keys(ansiColors).reduce(
    (message, color) =>
      message
        .replace(
          new RegExp(`<${color}>`, "g"),
          ansiColors[color]
        )
        .replace(
          new RegExp(`</${color}>`, "g"),
          ansiReset
        ),
    message
  );
