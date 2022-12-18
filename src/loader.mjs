import { mockedModuleExportsFor } from "./moduleMocks.mjs";
import { EOL } from "os";

const toConstString = (name, value) =>
  `const ${name} = ${value};`;

const toExportedConstString = (name, value) =>
  `export const ${name} = ${value};`;

const toSourceString = (path, exportedKeys) =>
  [
    toConstString(
      "mockedExports",
      `global.mockRegistry["${path}"]`
    ),
    ...exportedKeys.map((exportedKey) =>
      toExportedConstString(
        exportedKey,
        `mockedExports.${exportedKey}`
      )
    ),
  ].join(EOL);

export async function load(url, context, nextLoad) {
  const mockedExports = mockedModuleExportsFor(url);
  if (mockedExports) {
    return {
      format: "module",
      shortCircuit: true,
      source: toSourceString(
        url,
        Object.keys(mockedExports)
      ),
    };
  }
  return nextLoad(url);
}
