import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "vitest";

test("Responses review runner preserves state and fails closed", () => {
  execFileSync(
    process.execPath,
    ["--test", fileURLToPath(new URL("./run-agent-review.test.mjs", import.meta.url))],
    { timeout: 10_000, stdio: "pipe" },
  );
}, 15_000);
