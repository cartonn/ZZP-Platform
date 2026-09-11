import { createHash } from "node:crypto";
import { lstat, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const OFFICIAL_ACTION_SHA = "86365089eb2b84e0a8fb0717b304f8bdcb13b20e";
export const OFFICIAL_BUNDLE_SHA256 =
  "feae0cc84b0697c562677c390ede65a85978a61ac43d6de3a37bc5c42e912979";

// Only this lifecycle block is replaced. All official privilege isolation,
// argument validation, authentication and result publication remain unchanged.
export const ORIGINAL_EXECUTION_BLOCK = `    await new Promise((resolve, reject) => {
      const child = (0, import_child_process2.spawn)(program2, command, {
        env,
        stdio: ["pipe", "inherit", "inherit"]
      });
      child.stdin.write(input);
      child.stdin.end();
      child.on("error", reject);
      child.on("close", async (code) => {
        if (code !== 0) {
          reject(new Error(\`\${program2} exited with code \${code}\`));
          return;
        }
        try {
          await finalizeExecution(outputFile, runAsUser);
          resolve(void 0);
        } catch (err) {
          reject(err);
        }
      });
    });`;

// Based on the reviewed mechanism in openai/codex-action#151, including its
// bounded drain correction. No code is fetched from that unmerged fork.
// This function must stay self-contained: its source is inserted into the
// verified official bundle, and the tests execute that exact inserted source.
export function runWithIsolatedStdio(spawnChild, program, command, env, input, finalize) {
  return new Promise((resolve, reject) => {
    const child = spawnChild(program, command, { env, stdio: ["pipe", "pipe", "pipe"] });
    let settled = false;
    const closeOutputStreams = () => {
      child.stdout.unpipe(process.stdout);
      child.stderr.unpipe(process.stderr);
      child.stdout.destroy();
      child.stderr.destroy();
    };
    const fail = (error) => {
      if (settled) return;
      settled = true;
      closeOutputStreams();
      reject(error);
    };
    child.stdout.pipe(process.stdout, { end: false });
    child.stderr.pipe(process.stderr, { end: false });
    child.stdout.once("error", fail);
    child.stderr.once("error", fail);
    child.stdin.once("error", fail);
    child.once("error", fail);
    child.once("exit", async (code, signal) => {
      // EOF is deliberately not required: descendants can retain the write ends.
      // Drain pending output, but never let ongoing output extend the 1 s bound.
      await new Promise((drained) => {
        const streams = [child.stdout, child.stderr];
        let quietTimer;
        const finish = () => {
          clearTimeout(quietTimer);
          clearTimeout(deadline);
          for (const stream of streams) stream.off("data", scheduleQuietCheck);
          drained();
        };
        const scheduleQuietCheck = () => {
          clearTimeout(quietTimer);
          quietTimer = setTimeout(() => {
            if (
              streams.every(
                (stream) =>
                  stream.destroyed ||
                  (stream.readableLength === 0 && stream.readableFlowing !== false),
              )
            ) {
              finish();
            } else {
              scheduleQuietCheck();
            }
          }, 25);
        };
        const deadline = setTimeout(finish, 1_000);
        for (const stream of streams) stream.on("data", scheduleQuietCheck);
        scheduleQuietCheck();
      });
      closeOutputStreams();
      if (settled) return;
      if (code !== 0) {
        fail(new Error(`${program} exited with code ${code}${signal ? ` (${signal})` : ""}`));
        return;
      }
      try {
        await finalize();
        settled = true;
        resolve();
      } catch (error) {
        fail(error);
      }
    });
    child.stdin.end(input);
  });
}

export const PATCHED_EXECUTION_BLOCK = `    await (${runWithIsolatedStdio.toString()})(
      import_child_process2.spawn, program2, command, env, input,
      () => finalizeExecution(outputFile, runAsUser)
    );`;

export function assertSingleExecutionBlock(source) {
  if (source.split(ORIGINAL_EXECUTION_BLOCK).length !== 2) {
    throw new Error("Official Codex action execution block must match exactly once.");
  }
}

export function patchBundle(bundle) {
  const digest = createHash("sha256").update(bundle).digest("hex");
  if (digest !== OFFICIAL_BUNDLE_SHA256) {
    throw new Error(`Refusing Codex action bundle with unexpected SHA-256: ${digest}`);
  }
  const source = bundle.toString("utf8");
  assertSingleExecutionBlock(source);
  return source.replace(ORIGINAL_EXECUTION_BLOCK, () => PATCHED_EXECUTION_BLOCK);
}

export async function patchCodexAction(actionDirectory) {
  const bundlePath = path.resolve(actionDirectory, "dist/main.js");
  if (!(await lstat(bundlePath)).isFile()) {
    throw new Error("Codex action bundle must be a regular file, not a symlink.");
  }
  const patched = patchBundle(await readFile(bundlePath));
  await writeFile(bundlePath, patched, "utf8");
  return bundlePath;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3 || !process.argv[2]) {
      throw new Error("Usage: node scripts/patch-codex-action.mjs <official-action-checkout>");
    }
    await patchCodexAction(process.argv[2]);
    console.log(
      `Patched verified official Codex action ${OFFICIAL_ACTION_SHA}: bounded stdio drain.`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
