import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "vitest";

test("native subscription review authenticates immutable source and genuine evidence", () => {
  execFileSync(
    process.execPath,
    ["--test", fileURLToPath(new URL("./subscription-review.test.mjs", import.meta.url))],
    { timeout: 10_000, stdio: "pipe" },
  );
}, 15_000);
