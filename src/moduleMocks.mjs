import url from "url";
import path from "path";

global.mockRegistry = {};

export const registerMock = (
  relativeFilePath,
  mockedModuleExports
) => {
  const absoluteFilePath = path.resolve(
    process.cwd(),
    relativeFilePath
  );
  const fileUrl = url.pathToFileURL(absoluteFilePath);
  global.mockRegistry[fileUrl] = mockedModuleExports;
};

export const withMockContext = async (importFn) => {
  global.mockRegistry = {};
  await importFn();
};

export const mockedModuleExportsFor = (path) =>
  global.mockRegistry[path];
