import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  assertSingleExecutionBlock,
  ORIGINAL_EXECUTION_BLOCK,
  PATCHED_EXECUTION_BLOCK,
  patchBundle,
  patchCodexAction,
} from "./patch-codex-action.mjs";

const patchScript = fileURLToPath(new URL("./patch-codex-action.mjs", import.meta.url));

function runFixture({ legacy = false, mode = "descendant", exitCode = 0, missing = false } = {}) {
  const directory = mkdtempSync(path.join(os.tmpdir(), "codex-action-stdio-"));
  const wrapperPath = path.join(directory, "wrapper.mjs");
  const fakePath = path.join(directory, "fake-codex.mjs");
  const outputPath = path.join(directory, "output.json");
  const finalizedPath = path.join(directory, "finalized.json");
  const descendantPath = path.join(directory, "descendant.pid");
  const fakePidPath = path.join(directory, "fake.pid");
  const input = "Review the exact head.\n".repeat(8_000);
  const report = { verdict: "BLOCK", complete: true, summary: "A real blocking finding." };
  writeFileSync(
    fakePath,
    `import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
writeFileSync(${JSON.stringify(fakePidPath)}, String(process.pid));
let input = "";
for await (const chunk of process.stdin) input += chunk;
if (!${missing}) writeFileSync(${JSON.stringify(outputPath)}, JSON.stringify({
  report: ${JSON.stringify(report)}, input,
}));
console.log("final JSON emitted");
console.error("tokens used 100,379");
if (${JSON.stringify(mode)} === "large") {
  process.stdout.write("stdout-start:" + "o".repeat(1024 * 1024) + ":stdout-end\\n");
  process.stderr.write("stderr-start:" + "e".repeat(1024 * 1024) + ":stderr-end\\n");
}
if (!["none", "hang"].includes(${JSON.stringify(mode)})) {
  const child = spawn(process.execPath, ["-e", ${JSON.stringify(
    mode === "continuous"
      ? 'process.stdout.on("error", () => process.exit(0)); process.stdout.write("descendant\\n"); process.send("ready"); setInterval(() => process.stdout.write("descendant\\n"), 5); setTimeout(() => process.exit(0), 10000);'
      : 'process.send("ready"); setTimeout(() => {}, 10000)',
  )}], { stdio: ["ignore", "inherit", "inherit", "ipc"], env: {} });
  writeFileSync(${JSON.stringify(descendantPath)}, String(child.pid));
  await new Promise((resolve) => child.once("message", () => {
    child.disconnect();
    child.unref();
    resolve();
  }));
}
if (${JSON.stringify(mode)} === "hang") setTimeout(() => {}, 10000);
process.exitCode = ${exitCode};
`,
  );
  writeFileSync(
    wrapperPath,
    `import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
const import_child_process2 = { spawn };
const program2 = process.execPath;
const command = [${JSON.stringify(fakePath)}];
const env = {};
const input = ${JSON.stringify(input)};
const outputFile = { file: ${JSON.stringify(outputPath)} };
const runAsUser = null;
async function finalizeExecution(file) {
  const output = await readFile(file.file, "utf8");
  await writeFile(${JSON.stringify(finalizedPath)}, output);
}
try {
${legacy ? ORIGINAL_EXECUTION_BLOCK : PATCHED_EXECUTION_BLOCK}
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
`,
  );
  const started = performance.now();
  try {
    const result = spawnSync(process.execPath, [wrapperPath], {
      env: {},
      encoding: "utf8",
      timeout: legacy || mode === "hang" ? 800 : 3_000,
      maxBuffer: 6 * 1024 * 1024,
    });
    let finalized = null;
    try {
      finalized = JSON.parse(readFileSync(finalizedPath, "utf8"));
    } catch {}
    return { result, finalized, input, report, elapsed: performance.now() - started };
  } finally {
    for (const pidPath of [descendantPath, fakePidPath]) {
      try {
        process.kill(Number(readFileSync(pidPath, "utf8")), "SIGKILL");
      } catch (error) {
        if (!["ENOENT", "ESRCH"].includes(error.code)) throw error;
      }
    }
    rmSync(directory, { recursive: true, force: true });
  }
}

test("the exact old lifecycle reproduces the inherited-descendant hang", () => {
  const { result } = runFixture({ legacy: true });
  assert.equal(result.error?.code, "ETIMEDOUT");
  assert.match(result.stdout, /final JSON emitted/);
  assert.match(result.stderr, /tokens used 100,379/);
});

test("patched lifecycle preserves stdin and the BLOCK report without waiting for descendants", () => {
  const { result, finalized, input, report, elapsed } = runFixture();
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(finalized, { report, input });
  assert.match(result.stdout, /final JSON emitted/);
  assert.match(result.stderr, /tokens used 100,379/);
  assert.ok(elapsed < 3_000, `waited ${elapsed} ms for a 10 s descendant`);
});

test("large final stdout and stderr remain complete", () => {
  const { result, finalized } = runFixture({ mode: "large" });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(finalized);
  assert.ok(result.stdout.includes(`stdout-start:${"o".repeat(1024 * 1024)}:stdout-end`));
  assert.ok(result.stderr.includes(`stderr-start:${"e".repeat(1024 * 1024)}:stderr-end`));
});

test("continuous descendant output cannot keep extending the drain deadline", () => {
  const { result, finalized, elapsed } = runFixture({ mode: "continuous" });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(finalized);
  assert.match(result.stdout, /descendant/);
  assert.ok(elapsed >= 1_000, "the continuously active pipe must exercise the absolute deadline");
});

test("a timed-out process never publishes a report merely because it already wrote the file", () => {
  const { result, finalized } = runFixture({ mode: "hang" });
  assert.equal(result.error?.code, "ETIMEDOUT");
  assert.match(result.stdout, /final JSON emitted/);
  assert.equal(finalized, null);
});

test("a nonzero exit never publishes even an already written complete report", () => {
  const { result, finalized } = runFixture({ exitCode: 7 });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /exited with code 7/);
  assert.equal(finalized, null);
});

test("missing result fails despite a successful process and final log lines", () => {
  const { result, finalized } = runFixture({ mode: "none", missing: true });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /ENOENT/);
  assert.equal(finalized, null);
});

test("exactly one complete lifecycle block is required", () => {
  assertSingleExecutionBlock(`prefix\n${ORIGINAL_EXECUTION_BLOCK}\nsuffix`);
  assert.throws(() => assertSingleExecutionBlock("unrelated bundle"), /exactly once/);
  assert.throws(
    () => assertSingleExecutionBlock(ORIGINAL_EXECUTION_BLOCK.repeat(2)),
    /exactly once/,
  );
});

test("bad bundle hash fails closed before writing, including a convincing matching block", async () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "codex-action-hash-"));
  const bundlePath = path.join(directory, "dist/main.js");
  mkdirSync(path.dirname(bundlePath));
  const original = Buffer.from(`untrusted prefix\n${ORIGINAL_EXECUTION_BLOCK}\n`);
  writeFileSync(bundlePath, original);
  try {
    assert.throws(() => patchBundle(original), /unexpected SHA-256/);
    await assert.rejects(patchCodexAction(directory), /unexpected SHA-256/);
    assert.deepEqual(readFileSync(bundlePath), original);
    const result = spawnSync(process.execPath, [patchScript, directory], { encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /unexpected SHA-256/);
    assert.deepEqual(readFileSync(bundlePath), original);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI refuses missing arguments", () => {
  assert.throws(() => execFileSync(process.execPath, [patchScript], { stdio: "pipe" }));
});
