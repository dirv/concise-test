import path from "path";

export const run = async () => {
  try {
    await import(
      path.resolve(process.cwd(), "test/tests.js")
    );
  } catch (e) {
    console.error(e);
  }
  console.log("Test run finished");
};

export const it = (name, body) => {
  try {
    body();
  } catch (e) {
    console.error(e);
  }
};
