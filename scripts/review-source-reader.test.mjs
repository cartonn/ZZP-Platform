import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, writeFile, rm, symlink, unlink, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createSourceReader } from "./review-source-reader.mjs";

async function fixture(t, initial = { "sample.txt": "old\n", "keep.txt": "stable\n" }) {
  const cwd = await mkdtemp(join(tmpdir(), "review-source-"));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync("/usr/bin/git", args, {
      cwd,
      encoding: "utf8",
      env: {
        PATH: "/usr/bin:/bin",
        HOME: cwd,
        GIT_CONFIG_NOSYSTEM: "1",
        GIT_CONFIG_GLOBAL: "/dev/null",
        GIT_AUTHOR_NAME: "Test",
        GIT_COMMITTER_NAME: "Test",
        GIT_AUTHOR_EMAIL: "test@example.invalid",
        GIT_COMMITTER_EMAIL: "test@example.invalid",
      },
    }).trim();
  git("init", "-q");
  async function write(path, content) {
    await writeFile(join(cwd, path), content);
  }
  for (const [path, content] of Object.entries(initial)) await write(path, content);
  const commit = () => {
    git("add", "-A");
    git("commit", "-qm", "fixture");
    return git("rev-parse", "HEAD");
  };
  const baseSha = commit();
  return {
    cwd,
    git,
    write,
    baseSha,
    commit,
    reader: (headSha, changedFiles) => createSourceReader({ cwd, headSha, baseSha, changedFiles }),
  };
}
const read = (reader, path, revision = "head", start_line = 1, max_lines = 500) =>
  reader.callTool("read_source", { path, revision, start_line, max_lines }).then(JSON.parse);

test("complete immutable diff, manifest, stat and explicit paginated source delivery", async (t) => {
  const f = await fixture(t);
  await f.write("sample.txt", "one\ntwo\nthree\n");
  const head = f.commit();
  const reader = await f.reader(head, ["sample.txt"]);
  const initial = JSON.parse(reader.initialContext);
  assert.match(initial.fullDiff, /-old\n\+one\n\+two\n\+three/);
  assert.match(initial.stat, /sample.txt/);
  assert.equal(initial.manifest[0].head.sha, f.git("rev-parse", `${head}:sample.txt`));
  assert.equal(reader.evidence().complete, true);
  await f.write("sample.txt", "HOST SECRET MUST NOT READ");
  const first = await read(reader, "sample.txt", "head", 1, 2);
  assert.deepEqual(first.lines, ["one", "two"]);
  assert.equal(first.next_start_line, 3);
  const last = await read(reader, "sample.txt", "head", 3, 2);
  assert.deepEqual(last.lines, ["three"]);
  assert.equal(last.next_start_line, null);
  assert.deepEqual((await read(reader, "sample.txt", "base")).lines, ["old"]);
  assert.equal(reader.evidence().reads.length, 3);
  assert.doesNotMatch(JSON.stringify(reader.evidence()), /HOST SECRET|one\\ntwo/);
  const listing = JSON.parse(
    await reader.callTool("list_source_paths", { filter: "", cursor: 0, limit: 1 }),
  );
  assert.equal(listing.next_cursor, 1);
  assert.equal(listing.total, 2);
  assert.equal(
    JSON.parse(await reader.callTool("list_source_paths", { filter: "", cursor: 1, limit: 1 }))
      .next_cursor,
    null,
  );
});

test("never follows committed or worktree symlinks or reads a host path", async (t) => {
  const f = await fixture(t);
  const outside = join(f.cwd, "host-secret");
  await writeFile(outside, "DO_NOT_LEAK");
  await symlink(outside, join(f.cwd, "link.txt"));
  f.git("add", "link.txt");
  f.git("commit", "-qm", "link");
  const reader = await f.reader(f.git("rev-parse", "HEAD"), ["link.txt"]);
  const link = await read(reader, "link.txt");
  assert.equal(link.kind, "symlink_text");
  assert.deepEqual(link.lines, [outside]);
  assert.doesNotMatch(reader.initialContext, /DO_NOT_LEAK/);
  await unlink(join(f.cwd, "sample.txt"));
  await symlink(outside, join(f.cwd, "sample.txt"));
  assert.deepEqual((await read(reader, "sample.txt")).lines, ["old"]);
  for (const path of [
    outside,
    "../host-secret",
    "a/../../host-secret",
    "./sample.txt",
    "host-secret",
    "missing",
    "a\\b",
  ]) {
    await assert.rejects(read(reader, path));
  }
});

test("literal path listing and catalog reads cannot inject commands or Git pathspecs", async (t) => {
  const f = await fixture(t);
  const names = ["--output=owned", ":(glob)*", "$(touch owned)"];
  for (const path of names) await f.write(path, `${path}\n`);
  const reader = await f.reader(f.commit(), names);
  for (const path of names) assert.deepEqual((await read(reader, path)).lines, [path]);
  assert.equal(
    JSON.parse(await reader.callTool("list_source_paths", { filter: "*", cursor: 0, limit: 10 }))
      .total,
    1,
  );
  await assert.rejects(readFile(join(f.cwd, "owned")));
  await assert.rejects(
    reader.callTool("read_source", {
      path: "sample.txt",
      revision: "head;touch owned",
      start_line: 1,
      max_lines: 1,
    }),
  );
  await assert.rejects(reader.callTool("cat-file", { sha: "a".repeat(40) }));
  await assert.rejects(
    reader.callTool("read_source", {
      path: "sample.txt",
      revision: "head",
      start_line: 1,
      max_lines: 1,
      sha: "a".repeat(40),
    }),
  );
});

test("renames, deletions, additions and mode changes are covered without missing old paths", async (t) => {
  const f = await fixture(t, {
    "old.txt": "same\n",
    "deleted.txt": "gone\n",
    "mode.txt": "mode\n",
  });
  f.git("mv", "old.txt", "new.txt");
  await unlink(join(f.cwd, "deleted.txt"));
  await f.write("added.txt", "new file\n");
  f.git("update-index", "--chmod=+x", "mode.txt");
  f.git("config", "core.fileMode", "false");
  const head = f.commit();
  const reader = await f.reader(head, ["new.txt", "deleted.txt", "added.txt", "mode.txt"]);
  assert.deepEqual(reader.evidence().manifest.paths, [
    "added.txt",
    "deleted.txt",
    "mode.txt",
    "new.txt",
    "old.txt",
  ]);
  assert.equal(reader.evidence().complete, true);
  const diff = JSON.parse(reader.initialContext).fullDiff;
  assert.match(diff, /deleted file mode/);
  assert.match(diff, /new file mode/);
  assert.match(diff, /old mode 100644\nnew mode 100755/);
  assert.deepEqual((await read(reader, "old.txt", "base")).lines, ["same"]);
  await assert.rejects(read(reader, "old.txt", "head"));
  await assert.rejects(f.reader(head, ["new.txt"]), /manifest_missing_change/);
});

test("invalid and wrong identities, unknown manifest paths and unavailable revisions fail closed", async (t) => {
  const f = await fixture(t);
  await f.write("sample.txt", "new\n");
  const headSha = f.commit();
  const context = { cwd: f.cwd, baseSha: f.baseSha, headSha, changedFiles: ["sample.txt"] };
  await assert.rejects(createSourceReader({ ...context, headSha: f.baseSha }), /head_mismatch/);
  for (const headSha of ["HEAD", "--help", "a".repeat(40) + ";touch owned", "$(id)"])
    await assert.rejects(createSourceReader({ ...context, headSha }), /invalid_context/);
  await assert.rejects(createSourceReader({ ...context, baseSha: "a".repeat(40) }));
  await assert.rejects(
    createSourceReader({ ...context, baseSha: f.git("rev-parse", `${headSha}:sample.txt`) }),
    /revision_not_commit/,
  );
  await assert.rejects(
    createSourceReader({ ...context, changedFiles: ["keep.txt"] }),
    /manifest_unknown_change/,
  );
});

test("binary and gitlink changes cannot claim complete source coverage", async (t) => {
  const f = await fixture(t);
  await f.write("binary.bin", Buffer.from([65, 0, 66]));
  f.git("add", "-A");
  f.git("update-index", "--add", "--cacheinfo", `160000,${f.baseSha},submodule`);
  f.git("commit", "-qm", "binary and gitlink");
  const reader = await f.reader(f.git("rev-parse", "HEAD"), ["binary.bin", "submodule"]);
  assert.equal(reader.evidence().complete, false);
  assert.deepEqual(
    reader
      .evidence()
      .unsupported.map((item) => item.reason)
      .sort(),
    ["binary", "gitlink"],
  );
  await assert.rejects(read(reader, "binary.bin"), /binary/);
  await assert.rejects(read(reader, "submodule"), /gitlink/);
});

test("non-UTF8 changed source fails closed without normalization", async (t) => {
  const f = await fixture(t);
  await f.write("invalid.txt", Buffer.from([0xff, 0xfe]));
  await assert.rejects(f.reader(f.commit(), ["invalid.txt"]), /non_utf8/);
});

test("a divergent or newer base requires updating the PR before review", async (t) => {
  const f = await fixture(t);
  f.git("checkout", "-qb", "main-next");
  await f.write("main-only.txt", "main change\n");
  const baseSha = f.commit();
  f.git("checkout", "-qb", "pr", f.baseSha);
  await f.write("pr-only.txt", "pr change\n");
  const headSha = f.commit();
  await assert.rejects(
    createSourceReader({ cwd: f.cwd, baseSha, headSha, changedFiles: ["pr-only.txt"] }),
    /base_not_ancestor_update_branch/,
  );
  f.git("checkout", "-q", f.baseSha);
  await assert.rejects(
    createSourceReader({
      cwd: f.cwd,
      baseSha,
      headSha: f.baseSha,
      changedFiles: ["main-only.txt"],
    }),
    /base_not_ancestor_update_branch/,
  );
});

test("attribute binary suppression and external drivers never hide complete coverage or execute", async (t) => {
  const f = await fixture(t);
  await f.write(".gitattributes", "sample.txt -diff\n");
  await f.write("sample.txt", "new\n");
  const head = f.commit();
  f.git("config", "diff.external", "touch owned");
  f.git("config", "core.fsmonitor", "touch owned");
  const reader = await f.reader(head, [".gitattributes", "sample.txt"]);
  assert.equal(reader.evidence().complete, false);
  assert.ok(reader.evidence().unsupported.some((item) => item.reason === "binary_diff_driver"));
  await assert.rejects(readFile(join(f.cwd, "owned")));
});

test("oversized complete diff refuses instead of returning a truncated context", async (t) => {
  const old = "a".repeat(100) + "\n";
  const next = "b".repeat(100) + "\n";
  const f = await fixture(t, { "large.txt": old.repeat(11_000) });
  await f.write("large.txt", next.repeat(11_000));
  await assert.rejects(f.reader(f.commit(), ["large.txt"]), /limit/);
});

test("read pages enforce ranges and byte bounds without silent truncation; BOM is retained", async (t) => {
  const f = await fixture(t);
  await f.write("sample.txt", "\uFEFFfirst\nsecond\n");
  await f.write("wide.txt", "x".repeat(270_000));
  const reader = await f.reader(f.commit(), ["sample.txt", "wide.txt"]);
  assert.equal((await read(reader, "sample.txt")).lines[0], "\uFEFFfirst");
  await assert.rejects(read(reader, "sample.txt", "head", 0, 1));
  await assert.rejects(read(reader, "sample.txt", "head", 5, 1));
  await assert.rejects(read(reader, "sample.txt", "head", 1, 501));
  await assert.rejects(read(reader, "wide.txt"), /page_byte_limit/);
  await assert.rejects(
    reader.callTool("list_source_paths", { filter: "absent", cursor: 1, limit: 1 }),
  );
});

function fontHeader(size = 80) {
  const bytes = Buffer.alloc(size);
  bytes.write("wOF2", 0, "ascii");
  bytes.writeUInt32BE(0x00010000, 4);
  bytes.writeUInt32BE(size, 8);
  bytes.writeUInt16BE(1, 12);
  bytes.writeUInt32BE(123_456, 16); // Informational, deliberately not decoded size.
  bytes.writeUInt32BE(8, 20);
  return bytes;
}

test("small WOFF2 delivers lossless complete bytes plus explicitly header-only metadata", async (t) => {
  const f = await fixture(t);
  const bytes = fontHeader();
  bytes.writeUInt32BE(60, 28);
  bytes.writeUInt32BE(4, 32);
  bytes.writeUInt32BE(16, 36);
  bytes.writeUInt32BE(68, 40);
  bytes.writeUInt32BE(8, 44);
  await f.write("font.woff2", bytes);
  const reader = await f.reader(f.commit(), ["font.woff2"]);
  const initial = JSON.parse(reader.initialContext);
  assert.equal(reader.evidence().complete, true);
  const delivered = initial.binarySources[0];
  assert.ok(Buffer.from(delivered.data, "base64").equals(bytes));
  assert.equal(delivered.byteCount, bytes.length);
  assert.equal(delivered.sha256, createHash("sha256").update(bytes).digest("hex"));
  assert.equal(delivered.blobSha, f.git("rev-parse", "HEAD:font.woff2"));
  assert.equal(delivered.header.totalSfntSizeInformational, 123_456);
  assert.match(delivered.validation, /NOT validated/);
  assert.equal(reader.evidence().binaryDeliveries[0].headerOnly, true);
  assert.equal(JSON.stringify(reader.evidence()).includes(delivered.data), false);
  assert.ok(Buffer.from((await read(reader, "font.woff2")).data, "base64").equals(bytes));
  await assert.rejects(read(reader, "font.woff2", "head", 2, 1));
});

test("malformed, out-of-bounds, oversized and non-WOFF2 binary remain incomplete", async (t) => {
  const f = await fixture(t);
  const variants = new Map();
  for (const [name, offset, value] of [
    ["length", 8, 81],
    ["flavor", 4, 42],
    ["compressed", 20, 999],
    ["metadata", 28, 100],
    ["private", 40, 100],
    ["overlap-header", 40, 20],
  ]) {
    const bytes = fontHeader();
    bytes.writeUInt32BE(value, offset);
    variants.set(`${name}.woff2`, bytes);
  }
  const noTables = fontHeader();
  noTables.writeUInt16BE(0, 12);
  variants.set("tables.woff2", noTables);
  const overlapping = fontHeader();
  overlapping.writeUInt32BE(60, 28);
  overlapping.writeUInt32BE(12, 32);
  overlapping.writeUInt32BE(20, 36);
  overlapping.writeUInt32BE(68, 40);
  overlapping.writeUInt32BE(4, 44);
  variants.set("overlap.woff2", overlapping);
  variants.set("large.woff2", fontHeader(256 * 1024 + 1));
  variants.set("wrong-magic.woff2", Buffer.alloc(80));
  variants.set("header-short.woff2", Buffer.from("wOF2\0"));
  variants.set("renamed.bin", fontHeader());
  for (const [path, bytes] of variants) await f.write(path, bytes);
  const reader = await f.reader(f.commit(), [...variants.keys()]);
  assert.equal(reader.evidence().complete, false);
  assert.equal(reader.evidence().binaryDeliveries.length, 0);
  assert.equal(reader.evidence().unsupported.length, variants.size);
  for (const path of variants.keys()) await assert.rejects(read(reader, path), /binary/);
});

test("WOFF2 never conceals another suppressed binary or a text-to-font transition", async (t) => {
  const f = await fixture(t, { "font.woff2": "old full text\n", "sample.txt": "old\n" });
  await f.write("font.woff2", fontHeader());
  const reader = await f.reader(f.commit(), ["font.woff2"]);
  assert.equal(reader.evidence().complete, true);
  assert.equal(JSON.parse(reader.initialContext).textSupplements[0].fullText, "old full text\n");
  await f.write(".gitattributes", "sample.txt -diff\n");
  await f.write("sample.txt", "new\n");
  const incomplete = await f.reader(f.commit(), ["font.woff2", ".gitattributes", "sample.txt"]);
  assert.equal(incomplete.evidence().complete, false);
  assert.ok(incomplete.evidence().unsupported.some((item) => item.path === "sample.txt"));
});
