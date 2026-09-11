import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "vitest";

// Include the dependency-free gate regression suite in the normal required CI
// unit-test run, while keeping it directly runnable with node --test.
test("Codex review gate rejects stale, incomplete and contradictory verdicts", () => {
  execFileSync(
    process.execPath,
    ["--test", fileURLToPath(new URL("./agent-review-codex.test.mjs", import.meta.url))],
    { timeout: 10_000, stdio: "pipe" },
  );
});
