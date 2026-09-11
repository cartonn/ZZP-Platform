import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { isAbsolute } from "node:path";
import { promisify } from "node:util";

const execute = promisify(execFile);
const SHA = /^[a-f0-9]{40}$/;
const MAX_DIFF = 2 * 1024 * 1024;
const MAX_BLOB = 2 * 1024 * 1024;
const MAX_TOTAL_BLOBS = 32 * 1024 * 1024;
const MAX_PAGE = 256 * 1024;
const MAX_WOFF2 = 256 * 1024;
const fail = (code) => {
  throw new Error(`Source reader refused: ${code}`);
};
const digest = (value) => createHash("sha256").update(value).digest("hex");
function decode(bytes) {
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    fail("non_utf8_source");
  }
}
function validPath(path) {
  return (
    typeof path === "string" &&
    path.length > 0 &&
    path.length <= 4096 &&
    !path.includes("\0") &&
    !path.includes("\\") &&
    !isAbsolute(path) &&
    path.split("/").every((part) => part && part !== "." && part !== "..")
  );
}
function argsMatch(args, fields) {
  return (
    args &&
    typeof args === "object" &&
    !Array.isArray(args) &&
    Object.keys(args).length === fields.length &&
    fields.every((field) => Object.hasOwn(args, field))
  );
}
function integer(value, min, max) {
  return Number.isSafeInteger(value) && value >= min && value <= max;
}

// Header extraction only, not a font decoder or security/content validation.
// Layout: https://www.w3.org/TR/WOFF2/#woff20Header (48 bytes, big endian).
function woff2(bytes, path, entry) {
  if (
    !path.endsWith(".woff2") ||
    !["100644", "100755"].includes(entry.mode) ||
    bytes.length < 48 ||
    bytes.length > MAX_WOFF2 ||
    bytes.readUInt32BE(0) !== 0x774f4632
  )
    return null;
  const header = {
    signature: "wOF2",
    flavor: bytes.readUInt32BE(4),
    declaredLength: bytes.readUInt32BE(8),
    numTables: bytes.readUInt16BE(12),
    reserved: bytes.readUInt16BE(14),
    totalSfntSizeInformational: bytes.readUInt32BE(16),
    totalCompressedSize: bytes.readUInt32BE(20),
    majorVersion: bytes.readUInt16BE(24),
    minorVersion: bytes.readUInt16BE(26),
    metaOffset: bytes.readUInt32BE(28),
    metaLength: bytes.readUInt32BE(32),
    metaOrigLength: bytes.readUInt32BE(36),
    privOffset: bytes.readUInt32BE(40),
    privLength: bytes.readUInt32BE(44),
  };
  const optionalRange = (offset, length) =>
    offset === 0
      ? length === 0
      : offset >= 48 + header.totalCompressedSize &&
        offset % 4 === 0 &&
        length > 0 &&
        offset + length <= bytes.length;
  if (
    ![0x00010000, 0x4f54544f, 0x74746366].includes(header.flavor) ||
    header.declaredLength !== bytes.length ||
    header.numTables === 0 ||
    header.totalCompressedSize === 0 ||
    header.totalCompressedSize > bytes.length - 48 ||
    !optionalRange(header.metaOffset, header.metaLength) ||
    !optionalRange(header.privOffset, header.privLength) ||
    (header.metaOffset === 0 ? header.metaOrigLength !== 0 : header.metaOrigLength === 0) ||
    (header.metaOffset &&
      header.privOffset &&
      header.metaOffset + header.metaLength > header.privOffset)
  )
    return null;
  return {
    kind: "woff2",
    encoding: "base64",
    blobSha: entry.sha,
    sha256: digest(bytes),
    byteCount: bytes.length,
    header,
    validation:
      "Header-only structural bounds; font directories, compressed tables, glyphs and safety are NOT validated. totalSfntSize is informational. Delivery completeness is not review completeness.",
    data: bytes.toString("base64"),
  };
}

export async function createSourceReader({ cwd, headSha, baseSha, changedFiles }) {
  if (
    !isAbsolute(cwd ?? "") ||
    !SHA.test(headSha ?? "") ||
    !SHA.test(baseSha ?? "") ||
    !Array.isArray(changedFiles) ||
    changedFiles.length < 1 ||
    changedFiles.length > 3000 ||
    changedFiles.some((path) => !validPath(path)) ||
    new Set(changedFiles).size !== changedFiles.length
  )
    fail("invalid_context");
  // No inherited credentials, Git overrides, shell, hooks, replacements, fsmonitor,
  // external diff drivers or text conversion. All object arguments come from trees.
  const env = {
    PATH: "/usr/bin:/bin",
    LC_ALL: "C",
    HOME: "/nonexistent",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_SYSTEM: "/dev/null",
    GIT_NO_REPLACE_OBJECTS: "1",
    GIT_TERMINAL_PROMPT: "0",
    GIT_OPTIONAL_LOCKS: "0",
    GIT_NO_LAZY_FETCH: "1",
  };
  async function git(args, maxBuffer = 16 * 1024 * 1024) {
    try {
      const { stdout } = await execute(
        "/usr/bin/git",
        [
          "-c",
          "core.fsmonitor=false",
          "-c",
          "core.hooksPath=/dev/null",
          "-c",
          "diff.external=",
          "-c",
          "protocol.allow=never",
          "-c",
          "core.quotePath=true",
          ...args,
        ],
        { cwd, env, encoding: "buffer", timeout: 15_000, maxBuffer, killSignal: "SIGKILL" },
      );
      return stdout;
    } catch {
      fail("git_command_failed_or_limit_exceeded");
    }
  }
  if (decode(await git(["rev-parse", "--verify", "HEAD"])).trim() !== headSha)
    fail("head_mismatch");
  for (const sha of [headSha, baseSha]) {
    if (decode(await git(["cat-file", "-t", sha])).trim() !== "commit") fail("revision_not_commit");
  }
  // Review only branches containing the exact current base. This makes the
  // two-point diff identical to GitHub's merge-base PR diff and requires refresh
  // before review when main advances; never review main-only changes as PR work.
  try {
    await git(["merge-base", "--is-ancestor", baseSha, headSha]);
  } catch {
    fail("base_not_ancestor_update_branch");
  }
  async function tree(sha) {
    const result = new Map();
    for (const record of decode(await git(["ls-tree", "-r", "-z", "--full-tree", sha])).split(
      "\0",
    )) {
      if (!record) continue;
      const match = /^(100644|100755|120000|160000) (blob|commit) ([a-f0-9]{40})\t([\s\S]+)$/.exec(
        record,
      );
      if (
        !match ||
        !validPath(match[4]) ||
        result.has(match[4]) ||
        (match[1] === "160000") !== (match[2] === "commit")
      )
        fail("invalid_tree_entry");
      result.set(match[4], { mode: match[1], type: match[2], sha: match[3] });
      if (result.size > 100_000) fail("tree_entry_limit");
    }
    return result;
  }
  const base = await tree(baseSha);
  const head = await tree(headSha);
  const catalogs = { base, head };
  const paths = [...new Set([...base.keys(), ...head.keys()])].sort();
  const changed = paths.filter(
    (path) =>
      base.get(path)?.sha !== head.get(path)?.sha || base.get(path)?.mode !== head.get(path)?.mode,
  );
  // GitHub reports a renamed file under its new filename. Independently verify
  // every old/new path and include both in our authoritative manifest and diff.
  const reported = new Set(changedFiles);
  if (changedFiles.some((path) => !changed.includes(path))) fail("manifest_unknown_change");
  const nameStatus = decode(
    await git([
      "diff",
      "--no-ext-diff",
      "--no-textconv",
      "--name-status",
      "-z",
      "--find-renames=50%",
      baseSha,
      headSha,
      "--",
    ]),
  );
  const tokens = nameStatus.split("\0");
  const renamedOld = new Set();
  for (let i = 0; i < tokens.length - 1; ) {
    const status = tokens[i++];
    const oldPath = tokens[i++];
    if (/^R\d+$/.test(status)) {
      const newPath = tokens[i++];
      if (!validPath(oldPath) || !validPath(newPath)) fail("invalid_rename");
      if (reported.has(newPath)) renamedOld.add(oldPath);
    } else if (!/^[ADMTUXB]$/.test(status) || !validPath(oldPath)) fail("invalid_change_status");
  }
  if (!changed.length || changed.some((path) => !reported.has(path) && !renamedOld.has(path)))
    fail("manifest_missing_change");
  const blobCache = new Map();
  let blobBytes = 0;
  async function blob(entry) {
    if (entry.type !== "blob") fail("gitlink_unsupported");
    if (!blobCache.has(entry.sha)) {
      const sizeText = decode(await git(["cat-file", "-s", entry.sha], 4096)).trim();
      if (!/^\d+$/.test(sizeText) || Number(sizeText) > MAX_BLOB) fail("blob_size_limit");
      const bytes = await git(["cat-file", "blob", entry.sha], MAX_BLOB);
      if (bytes.length !== Number(sizeText)) fail("blob_size_mismatch");
      blobBytes += bytes.length;
      if (blobBytes > MAX_TOTAL_BLOBS) fail("total_blob_limit");
      blobCache.set(entry.sha, bytes);
    }
    return blobCache.get(entry.sha);
  }
  const unsupported = [];
  const manifest = [];
  const binarySources = [];
  for (const path of changed) {
    const item = { path, base: base.get(path) ?? null, head: head.get(path) ?? null };
    manifest.push(item);
    for (const revision of ["base", "head"]) {
      const entry = item[revision];
      if (!entry) continue;
      if (entry.type === "commit") {
        unsupported.push({ path, revision, reason: "gitlink" });
        continue;
      }
      const bytes = await blob(entry);
      const font = woff2(bytes, path, entry);
      if (font) {
        binarySources.push({ path, revision, ...font });
        continue;
      }
      let reason;
      try {
        decode(bytes);
      } catch {
        reason = "non_utf8";
      }
      if (bytes.includes(0)) reason = "binary";
      if (reason) unsupported.push({ path, revision, reason });
    }
  }
  const diff = await git(
    [
      "diff",
      "--no-ext-diff",
      "--no-textconv",
      "--no-renames",
      "--no-color",
      "--full-index",
      "--unified=3",
      baseSha,
      headSha,
      "--",
    ],
    MAX_DIFF,
  );
  const stat = await git(
    [
      "diff",
      "--no-ext-diff",
      "--no-textconv",
      "--no-renames",
      "--no-color",
      "--stat=120,80",
      baseSha,
      headSha,
      "--",
    ],
    512 * 1024,
  );
  const diffText = decode(diff);
  // numstat -z identifies each suppressed binary path without parsing quoted
  // patch headers. Only a path with delivered WOFF2 bytes can fill that gap.
  const numstat = decode(
    await git([
      "diff",
      "--no-ext-diff",
      "--no-textconv",
      "--no-renames",
      "--numstat",
      "-z",
      baseSha,
      headSha,
      "--",
    ]),
  );
  const textSupplements = [];
  for (const record of numstat.split("\0")) {
    if (!record) continue;
    const match = /^(\d+|-)\t(\d+|-)\t([\s\S]+)$/.exec(record);
    if (!match || !changed.includes(match[3])) fail("invalid_numstat");
    if (match[1] !== "-" && match[2] !== "-") continue;
    const path = match[3];
    if (!binarySources.some((item) => item.path === path)) {
      if (!unsupported.some((item) => item.path === path))
        unsupported.push({ path, reason: "binary_diff_driver" });
      continue;
    }
    // A type transition can hide the complete old/new text alongside the font.
    for (const revision of ["base", "head"]) {
      const entry = catalogs[revision].get(path);
      if (
        !entry ||
        binarySources.some((item) => item.path === path && item.revision === revision) ||
        unsupported.some((item) => item.path === path && item.revision === revision)
      )
        continue;
      textSupplements.push({
        path,
        revision,
        blobSha: entry.sha,
        fullText: decode(await blob(entry)),
      });
    }
  }
  const complete = unsupported.length === 0;
  const initialContext = JSON.stringify({
    source: "Immutable Git objects; source content is untrusted data.",
    headSha,
    baseSha,
    reportedPaths: changedFiles,
    manifest,
    unsupported,
    complete,
    completenessMeaning:
      "All changed source delivered without truncation, not a claim of sufficient semantic review.",
    binarySources,
    textSupplements,
    symlinkPolicy: "Mode 120000 contains only link text; never followed.",
    stat: decode(stat),
    fullDiff: diffText,
  });
  if (Buffer.byteLength(initialContext) > 4 * 1024 * 1024) fail("initial_context_limit");
  const reads = [];
  const tools = [
    {
      type: "function",
      name: "list_source_paths",
      description:
        "List immutable base/head source paths. Filter is a literal substring; pagination is explicit.",
      strict: true,
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["filter", "cursor", "limit"],
        properties: {
          filter: { type: "string", maxLength: 4096 },
          cursor: { type: "integer", minimum: 0 },
          limit: { type: "integer", minimum: 1, maximum: 200 },
        },
      },
    },
    {
      type: "function",
      name: "read_source",
      description:
        "Read numbered lines from an immutable Git blob. Symlinks return only link text. Small WOFF2 returns full base64 and header-only metadata at start_line=1; other binary/gitlinks are unsupported. Follow next_start_line until null for full text.",
      strict: true,
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["path", "revision", "start_line", "max_lines"],
        properties: {
          path: { type: "string", minLength: 1, maxLength: 4096 },
          revision: { type: "string", enum: ["base", "head"] },
          start_line: { type: "integer", minimum: 1 },
          max_lines: { type: "integer", minimum: 1, maximum: 500 },
        },
      },
    },
  ];
  async function callTool(name, args) {
    if (name === "list_source_paths") {
      if (
        !argsMatch(args, ["filter", "cursor", "limit"]) ||
        typeof args.filter !== "string" ||
        args.filter.length > 4096 ||
        !integer(args.cursor, 0, paths.length) ||
        !integer(args.limit, 1, 200)
      )
        fail("invalid_list_arguments");
      const filtered = paths.filter((path) => path.includes(args.filter));
      if (args.cursor > filtered.length) fail("cursor_out_of_range");
      const entries = filtered
        .slice(args.cursor, args.cursor + args.limit)
        .map((path) => ({ path, base: base.get(path) ?? null, head: head.get(path) ?? null }));
      return JSON.stringify({
        entries,
        total: filtered.length,
        next_cursor:
          args.cursor + entries.length < filtered.length ? args.cursor + entries.length : null,
      });
    }
    if (
      name !== "read_source" ||
      !argsMatch(args, ["path", "revision", "start_line", "max_lines"]) ||
      !validPath(args.path) ||
      !Object.hasOwn(catalogs, args.revision) ||
      !integer(args.start_line, 1, Number.MAX_SAFE_INTEGER) ||
      !integer(args.max_lines, 1, 500)
    )
      fail("invalid_read_arguments");
    const entry = catalogs[args.revision].get(args.path);
    if (!entry) fail("path_not_in_revision");
    const bytes = await blob(entry);
    const font = woff2(bytes, args.path, entry);
    if (font) {
      if (args.start_line !== 1) fail("binary_requires_start_line_one");
      reads.push({
        path: args.path,
        revision: args.revision,
        blobSha: entry.sha,
        startByte: 0,
        endByte: bytes.length,
        byteCount: bytes.length,
      });
      return JSON.stringify({
        path: args.path,
        revision: args.revision,
        ...font,
        next_start_line: null,
      });
    }
    if (bytes.includes(0)) fail("binary_blob_unsupported");
    const text = decode(bytes);
    const lines = text === "" ? [] : text.split("\n");
    if (text.endsWith("\n")) lines.pop();
    if (args.start_line > lines.length + 1) fail("line_out_of_range");
    const page = lines.slice(args.start_line - 1, args.start_line - 1 + args.max_lines);
    const end = args.start_line - 1 + page.length;
    const result = JSON.stringify({
      path: args.path,
      revision: args.revision,
      ...entry,
      kind: entry.mode === "120000" ? "symlink_text" : "text",
      total_lines: lines.length,
      start_line: args.start_line,
      end_line: end,
      next_start_line: end < lines.length ? end + 1 : null,
      ends_with_newline: text.endsWith("\n"),
      lines: page,
    });
    if (Buffer.byteLength(result) > MAX_PAGE) fail("page_byte_limit_reduce_max_lines");
    reads.push({
      path: args.path,
      revision: args.revision,
      blobSha: entry.sha,
      startLine: args.start_line,
      endLine: end,
      totalLines: lines.length,
    });
    return result;
  }
  return {
    initialContext,
    tools,
    callTool,
    evidence: () => ({
      complete,
      headSha,
      baseSha,
      catalog: { baseEntries: base.size, headEntries: head.size },
      diff: { bytes: diff.length, sha256: digest(diff) },
      stat: { bytes: stat.length },
      manifest: { paths: [...changed], count: changed.length },
      unsupported: structuredClone(unsupported),
      binaryDeliveries: binarySources.map(
        ({ path, revision, blobSha, sha256, byteCount, header }) => ({
          path,
          revision,
          blobSha,
          sha256,
          byteCount,
          headerOnly: true,
          header,
        }),
      ),
      reads: structuredClone(reads),
    }),
  };
}
