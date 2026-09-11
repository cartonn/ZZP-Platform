import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "vitest";

test("immutable review source reader enforces coverage and filesystem isolation", () => {
  execFileSync(
    process.execPath,
    ["--test", fileURLToPath(new URL("./review-source-reader.test.mjs", import.meta.url))],
    {
      timeout: 30_000,
      stdio: "pipe",
    },
  );
});
