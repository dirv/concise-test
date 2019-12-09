import { color } from "./colors.mjs";

export class ExpectationError extends Error {
  constructor(message, { actual, expected, source }) {
    super(
      "Expected " +
        color(
          message
            .replace("<actual>", `<bold>${actual}</bold>`)
            .replace(
              "<expected>",
              `<bold>${expected}</bold>`
            )
            .replace("<source>", `<bold>${source}</bold>`)
        )
    );
  }
}
