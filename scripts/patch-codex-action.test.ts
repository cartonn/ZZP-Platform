import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "vitest";

test("official Codex action patch preserves results and bounds descendant stdio", () => {
  execFileSync(
    process.execPath,
    ["--test", fileURLToPath(new URL("./patch-codex-action.test.mjs", import.meta.url))],
    { timeout: 20_000, stdio: "pipe" },
  );
}, 25_000);
