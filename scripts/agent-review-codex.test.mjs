import assert from "node:assert/strict";
import test from "node:test";
import {
  assertDispatchHead,
  readCurrentContext,
  reviewSummary,
  validateVerdict,
} from "./agent-review-codex.mjs";

const context = {
  repository: "cartonn/ZZP-Platform",
  pr: 1474,
  headSha: "a".repeat(40),
  baseSha: "b".repeat(40),
  files: ["src/lib/authz.ts", "src/lib/authz.test.ts"],
};
const report = {
  schemaVersion: 1,
  repository: context.repository,
  pr: context.pr,
  headSha: context.headSha,
  baseSha: context.baseSha,
  verdict: "PASS",
  complete: true,
  summary: "Volledige review, geen blockers gevonden.",
  reviewedFiles: [...context.files],
  findings: [],
};
const check = (change = {}, extra = {}) =>
  validateVerdict({
    rawReport: JSON.stringify({ ...report, ...change }),
    expected: context,
    current: context,
    runResult: "success",
    ...extra,
  });
const blocker = {
  severity: "blocker",
  path: context.files[0],
  line: 12,
  problem: "Ownership ontbreekt.",
  fix: "Controleer de eigenaar vóór de mutatie.",
};

test("only a complete successful review of current head/base and every file passes", () => {
  assert.equal(check().passed, true);
  assert.equal(check({ reviewedFiles: [...context.files].reverse() }).passed, true);
  for (const result of ["failure", "cancelled", "skipped", "", undefined])
    assert.equal(check({}, { runResult: result }).verdict, "INCOMPLETE");
});

test("old head, old base and changed manifests cannot reuse a PASS", () => {
  for (const field of ["headSha", "baseSha"])
    assert.equal(check({}, { current: { ...context, [field]: "c".repeat(40) } }).passed, false);
  assert.equal(check({}, { current: { ...context, files: ["src/lib/other.ts"] } }).passed, false);
  assert.equal(check({ pr: context.pr + 1 }).passed, false);
  assert.equal(check({ repository: "elsewhere/repo" }).passed, false);
  assert.equal(check({ headSha: "c".repeat(40) }).passed, false);
  assert.equal(check({ baseSha: "c".repeat(40) }).passed, false);
});

test("missing, duplicate, invented or incomplete file coverage blocks", () => {
  for (const reviewedFiles of [
    [],
    [context.files[0]],
    [context.files[0], context.files[0]],
    [...context.files, "invented.ts"],
  ])
    assert.equal(check({ reviewedFiles }).passed, false);
  assert.equal(check({ complete: false }).passed, false);
  assert.equal(check({}, { expected: { ...context, files: [] } }).passed, false);
});

test("content blockers remain BLOCK, including a contradictory PASS", () => {
  assert.equal(check({ verdict: "BLOCK", findings: [blocker] }).verdict, "BLOCK");
  assert.equal(check({ findings: [blocker] }).verdict, "BLOCK");
  assert.equal(check({ verdict: "BLOCK" }).verdict, "INCOMPLETE");
  assert.equal(
    check({
      verdict: "INCOMPLETE",
      complete: false,
      reviewedFiles: [context.files[0]],
      summary: "Tests nog niet beoordeeld.",
    }).verdict,
    "INCOMPLETE",
  );
});

test("malformed or pre-seeded output cannot satisfy the gate", () => {
  for (const rawReport of [
    undefined,
    "",
    "PASS",
    "```json\n{}\n```",
    "null",
    "[]",
    "x".repeat(500_001),
  ])
    assert.equal(check({}, { rawReport }).passed, false);
  for (const change of [
    { complete: "true" },
    { schemaVersion: 2 },
    { verdict: "pass" },
    { summary: " " },
    { unknown: true },
    { findings: [{ ...blocker, line: 0 }] },
    { findings: [{ ...blocker, path: "unknown.ts" }] },
    { findings: [{ ...blocker, fix: "" }] },
  ])
    assert.equal(check(change).passed, false);
});

test("manual bootstrap must target the same commit as the PR head", () => {
  assert.doesNotThrow(() => assertDispatchHead({ dispatchSha: context.headSha, context }));
  assert.throws(() => assertDispatchHead({ dispatchSha: context.baseSha, context }), /head-branch/);
  assert.throws(() => assertDispatchHead({ eventHead: "c".repeat(40), context }), /trigger-event/);
});

function mockApi({ count = 2, truncate = false, change = false } = {}) {
  let metadataReads = 0;
  return async (route) => {
    if (route.includes("/files?")) {
      const page = Number(new URL(`https://api.github.com${route}`).searchParams.get("page"));
      return Array.from(
        { length: truncate ? 1 : Math.min(100, count - (page - 1) * 100) },
        (_, i) => ({ filename: `file-${(page - 1) * 100 + i}.ts` }),
      );
    }
    metadataReads++;
    return {
      state: "open",
      draft: false,
      changed_files: count,
      head: { sha: change && metadataReads > 1 ? "c".repeat(40) : context.headSha },
      base: { sha: context.baseSha },
    };
  };
}

test("manifest pagination covers every changed file and rejects truncation", async () => {
  const actual = await readCurrentContext(mockApi({ count: 205 }), context.repository, context.pr);
  assert.equal(actual.files.length, 205);
  assert.equal(actual.files[204], "file-204.ts");
  await assert.rejects(
    readCurrentContext(mockApi({ truncate: true }), context.repository, context.pr),
    /onvolledig/,
  );
  await assert.rejects(
    readCurrentContext(mockApi({ count: 3001 }), context.repository, context.pr),
    /splits/,
  );
});

test("PR update during pagination invalidates the whole review context", async () => {
  await assert.rejects(
    readCurrentContext(mockApi({ change: true }), context.repository, context.pr),
    /veranderde/,
  );
});

test("report text cannot inject HTML or ping repository users in the published review", () => {
  const summary = reviewSummary(
    {
      verdict: "BLOCK",
      reason: "</pre><script>@everyone</script>",
      findings: [blocker],
      passed: false,
    },
    context,
    "https://github.com/cartonn/ZZP-Platform/actions/runs/123",
  );
  assert.ok(summary.includes("&lt;script&gt;"));
  assert.ok(!summary.includes("<script>"));
  assert.ok(!summary.includes("@everyone"));
});
