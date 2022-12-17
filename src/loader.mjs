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
  const urlWithoutQueryString = url.slice(
    0,
    url.indexOf("?")
  );
  const mockedExports = mockedModuleExportsFor(
    urlWithoutQueryString
  );
  if (mockedExports) {
    return {
      format: "module",
      shortCircuit: true,
      source: toSourceString(
        urlWithoutQueryString,
        Object.keys(mockedExports)
      ),
    };
  }
  return nextLoad(url);
}

export async function resolve(
  specifier,
  context,
  nextResolve
) {
  const { parentURL } = context;
  if (parentURL) {
    const url = new URL(specifier, parentURL);
    const mockedExports = mockedModuleExportsFor(url);
    if (mockedExports) {
      return {
        shortCircuit: true,
        url: new URL(`?${Date.now()}`, url)
          .href,
      };
    }
  }

  return nextResolve(specifier);
}
