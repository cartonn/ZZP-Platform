import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  assertTrustedExecution,
  readTrustedExecution,
  createReviewCheck,
  completeReviewCheck,
  githubApi,
  prepare,
  writePrompt,
  enforce,
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

const controlSha = "c".repeat(40);
const trustedEnv = {
  GITHUB_REPOSITORY: context.repository,
  GITHUB_EVENT_NAME: "workflow_dispatch",
  GITHUB_REF: "refs/heads/main",
  GITHUB_REF_PROTECTED: "true",
  GITHUB_SHA: controlSha,
  REVIEW_CONTROL_SHA: controlSha,
  REVIEW_WORKFLOW_REF: `${context.repository}/.github/workflows/pr-review.yml@refs/heads/main`,
  GITHUB_RUN_ID: "34576381918",
  GITHUB_RUN_ATTEMPT: "1",
};
const execution = assertTrustedExecution(trustedEnv);
const ticket = { ...context, ...execution, checkId: 123 };
const externalId = `${context.repository}:${context.pr}:${context.headSha}:${context.baseSha}:${controlSha}:${execution.runId}:${execution.runAttempt}`;
const runUrl = `https://github.com/${context.repository}/actions/runs/${execution.runId}/attempts/1`;
const remoteCheck = {
  id: ticket.checkId,
  name: "agent-review",
  head_sha: context.headSha,
  external_id: externalId,
  details_url: runUrl,
  app: { id: 15368 },
  status: "in_progress",
  conclusion: null,
};

test("only a protected default workflow or externally pinned bootstrap can execute controls", () => {
  assert.equal(execution.controlSha, controlSha);
  assert.notEqual(execution.controlSha, context.headSha);
  assert.equal(
    assertTrustedExecution({ ...trustedEnv, GITHUB_REF_PROTECTED: "True" }).controlSha,
    controlSha,
  );
  for (const extra of [
    { GITHUB_REF: "refs/heads/feature/pr" },
    { GITHUB_REF_PROTECTED: "false" },
    { GITHUB_REF_PROTECTED: "False" },
    { GITHUB_REF_PROTECTED: "1" },
    { GITHUB_EVENT_NAME: "pull_request" },
    { REVIEW_CONTROL_SHA: context.headSha },
    { REVIEW_WORKFLOW_REF: `${context.repository}/.github/workflows/other.yml@refs/heads/main` },
    { GITHUB_RUN_ID: "123/injection" },
    { GITHUB_RUN_ATTEMPT: "0" },
  ])
    assert.throws(() => assertTrustedExecution({ ...trustedEnv, ...extra }));
  const bootstrap = {
    ...trustedEnv,
    GITHUB_REF: "refs/heads/codex/review-bootstrap-20260911",
    REVIEW_WORKFLOW_REF: `${context.repository}/.github/workflows/pr-review.yml@refs/heads/codex/review-bootstrap-20260911`,
    REVIEW_BOOTSTRAP_SHA: controlSha,
  };
  assert.equal(assertTrustedExecution(bootstrap).controlSha, controlSha);
  assert.throws(() => assertTrustedExecution({ ...bootstrap, REVIEW_BOOTSTRAP_SHA: "" }));
  assert.throws(() =>
    assertTrustedExecution({ ...bootstrap, REVIEW_BOOTSTRAP_SHA: context.headSha }),
  );
  assert.throws(() =>
    assertTrustedExecution({ ...bootstrap, GITHUB_EVENT_NAME: "pull_request_target" }),
  );
});

test("live default branch and protected control ref must still match the trusted execution", async () => {
  const api =
    (change = {}) =>
    async (route) =>
      route.endsWith("/branches/main")
        ? { name: "main", protected: true, commit: { sha: controlSha }, ...change }
        : { default_branch: "main" };
  assert.deepEqual(await readTrustedExecution(api(), trustedEnv), execution);
  await assert.rejects(readTrustedExecution(api({ protected: false }), trustedEnv));
  await assert.rejects(readTrustedExecution(api({ commit: { sha: context.headSha } }), trustedEnv));
  await assert.rejects(readTrustedExecution(async () => ({ default_branch: "other" }), trustedEnv));
});

test("create starts a genuine check on reviewed head with immutable run, attempt and control identity", async () => {
  const calls = [];
  const api = async (route, request) => {
    calls.push({ route, request });
    return remoteCheck;
  };
  assert.deepEqual(await createReviewCheck(api, context, execution), ticket);
  assert.equal(calls[0].request.method, "POST");
  assert.equal(calls[0].request.body.head_sha, context.headSha);
  assert.equal(calls[0].request.body.status, "in_progress");
  assert.equal(calls[0].request.body.external_id, externalId);
  assert.equal(calls[1].route, `/repos/${context.repository}/check-runs/123`);
  await assert.rejects(createReviewCheck(api, { ...context, files: [] }, execution));
  for (const extra of [
    { app: { id: 1 } },
    { head_sha: controlSha },
    { id: 0 },
    { status: "completed" },
  ])
    await assert.rejects(
      createReviewCheck(async () => ({ ...remoteCheck, ...extra }), context, execution),
    );
});

test("publication updates and reads back the same check, never another run or head", async () => {
  const calls = [];
  let value = { ...remoteCheck };
  const api = async (route, request) => {
    calls.push({ route, request });
    if (request?.method === "PATCH") value = { ...value, ...request.body };
    return value;
  };
  await completeReviewCheck(api, ticket, execution, check(), "summary");
  assert.equal(value.conclusion, "success");
  assert.equal(value.status, "completed");
  assert.ok(calls.every(({ route }) => route === `/repos/${context.repository}/check-runs/123`));
  assert.equal(calls.filter(({ request }) => request?.method === "PATCH").length, 1);
  for (const extra of [
    { head_sha: controlSha },
    { app: { id: 1 } },
    { external_id: "another-run" },
    { details_url: "https://example.com" },
    { name: "other" },
    { status: "completed" },
  ]) {
    let mutated = false;
    await assert.rejects(
      completeReviewCheck(
        async (_route, request) => {
          mutated ||= Boolean(request);
          return { ...remoteCheck, ...extra };
        },
        ticket,
        execution,
        check(),
        "summary",
      ),
    );
    assert.equal(mutated, false);
  }
  for (const extra of [
    { runAttempt: 2 },
    { runId: "2" },
    { controlSha: context.headSha },
    { checkId: 0 },
    { files: [] },
  ])
    await assert.rejects(
      completeReviewCheck(api, { ...ticket, ...extra }, execution, check(), "summary"),
    );
});

test("BLOCK and INCOMPLETE publish failure; a missing final read-back never counts as success", async () => {
  for (const result of [check({ findings: [blocker] }), check({}, { runResult: "cancelled" })]) {
    let value = { ...remoteCheck };
    await completeReviewCheck(
      async (_route, request) => {
        if (request) value = { ...value, ...request.body };
        return value;
      },
      ticket,
      execution,
      result,
      "summary",
    );
    assert.equal(value.conclusion, "failure");
  }
  let reads = 0;
  await assert.rejects(
    completeReviewCheck(
      async (_route, request) => {
        if (request) return { ...remoteCheck, ...request.body };
        if (++reads > 1) throw new Error("read-back failed");
        return remoteCheck;
      },
      ticket,
      execution,
      check(),
      "summary",
    ),
  );
});

test("HTTP transport uses explicit methods, redacts errors, and retries only idempotent operations", async () => {
  const calls = [];
  let requests = 0;
  const api = githubApi("test-secret", {
    sleep: async () => {},
    fetch: async (url, options) => {
      calls.push({ url, options });
      if (++requests === 1) return new Response("test-secret", { status: 503 });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    },
  });
  assert.deepEqual(
    await api("/repos/cartonn/ZZP-Platform/check-runs/123", {
      method: "PATCH",
      body: { status: "completed" },
    }),
    { ok: true },
  );
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.method, "PATCH");
  assert.equal(calls[0].options.redirect, "error");
  assert.deepEqual(JSON.parse(calls[0].options.body), { status: "completed" });
  let posts = 0;
  const failing = githubApi("test-secret", {
    sleep: async () => {},
    fetch: async () => {
      posts++;
      throw new Error("secret test-secret");
    },
  });
  await assert.rejects(
    failing("/repos/cartonn/ZZP-Platform/check-runs", { method: "POST", body: {} }),
    (error) => !error.message.includes("test-secret"),
  );
  assert.equal(posts, 1);
  await assert.rejects(api("https://example.com"));
  await assert.rejects(api("//example.com/path"));
  await assert.rejects(api("/repos/x/y", { method: "DELETE" }));
});

function handlerFixture(t, { changeAfterComment = false } = {}) {
  const directory = mkdtempSync(join(tmpdir(), "codex-review-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const calls = [];
  let value = { ...remoteCheck };
  let head = context.headSha;
  const env = {
    ...trustedEnv,
    REVIEW_PR: String(context.pr),
    REVIEW_EVENT_HEAD: context.headSha,
    GITHUB_OUTPUT: join(directory, "output"),
    GITHUB_STEP_SUMMARY: join(directory, "summary"),
    RUNNER_TEMP: directory,
    REVIEW_CONTEXT: JSON.stringify(ticket),
    REVIEW_REPORT: JSON.stringify(report),
    REVIEW_RUN_RESULT: "success",
    REVIEW_AUTHENTICATED: "true",
  };
  const api = async (route, request) => {
    calls.push({ route, request });
    if (route === `/repos/${context.repository}`) return { default_branch: "main" };
    if (route.includes("/branches/")) return { protected: true, commit: { sha: controlSha } };
    if (route.includes("/files?")) return context.files.map((filename) => ({ filename }));
    if (route === `/repos/${context.repository}/pulls/${context.pr}`)
      return {
        state: "open",
        draft: false,
        changed_files: 2,
        head: { sha: head },
        base: { sha: context.baseSha },
      };
    if (route.endsWith("/comments")) {
      if (changeAfterComment) head = "d".repeat(40);
      return { id: 9 };
    }
    if (route.includes("/check-runs")) {
      if (request) value = { ...value, ...request.body };
      return value;
    }
    throw new Error(`Unexpected fixture route ${route}`);
  };
  return {
    env,
    api,
    calls,
    get check() {
      return value;
    },
  };
}

test("handlers carry trusted preparation through prompt creation and confirmed publication", async (t) => {
  const fixture = handlerFixture(t);
  const actual = await prepare(fixture.env, fixture.api);
  assert.deepEqual(actual, ticket);
  const output = readFileSync(fixture.env.GITHUB_OUTPUT, "utf8");
  assert.ok(output.startsWith(`head=${context.headSha}\ncontext=`));
  assert.equal(JSON.parse(output.split("context=")[1]).checkId, 123);
  writePrompt(fixture.env);
  const prompt = readFileSync(
    join(fixture.env.RUNNER_TEMP, "agent-review-codex-prompt.md"),
    "utf8",
  );
  assert.ok(prompt.includes(JSON.stringify(ticket, null, 2)));
  assert.equal((await enforce(fixture.env, fixture.api)).passed, true);
  assert.equal(fixture.check.conclusion, "success");
  const evidence = JSON.parse(
    readFileSync(join(fixture.env.RUNNER_TEMP, "agent-review-codex-verdict.json"), "utf8"),
  );
  assert.equal(evidence.context.checkId, ticket.checkId);
  assert.equal(evidence.context.controlSha, controlSha);
  assert.equal(evidence.context.runAttempt, 1);
});

test("stale trigger heads never start a check, and invalid publication contexts never mutate", async (t) => {
  const fixture = handlerFixture(t);
  await assert.rejects(prepare({ ...fixture.env, REVIEW_EVENT_HEAD: "d".repeat(40) }, fixture.api));
  for (const raw of [
    "null",
    "{",
    JSON.stringify({ ...ticket, checkId: 0 }),
    JSON.stringify({ ...ticket, repository: "other/repo" }),
    JSON.stringify({ ...ticket, runAttempt: 2 }),
  ]) {
    await assert.rejects(enforce({ ...fixture.env, REVIEW_CONTEXT: raw }, fixture.api));
    assert.throws(() => writePrompt({ ...fixture.env, REVIEW_CONTEXT: raw }));
  }
  assert.equal(fixture.calls.filter(({ request }) => request).length, 0);
});

test("a PR update during evidence publication changes a proposed PASS to a failed check", async (t) => {
  const fixture = handlerFixture(t, { changeAfterComment: true });
  assert.equal((await enforce(fixture.env, fixture.api)).verdict, "INCOMPLETE");
  assert.equal(fixture.check.conclusion, "failure");
});

test("raw output artifacts never rescue an unsuccessful action or missing direct report", async (t) => {
  for (const extra of [
    { REVIEW_REPORT: "" },
    { REVIEW_RUN_RESULT: "cancelled" },
    { REVIEW_RUN_RESULT: "failure" },
    { REVIEW_AUTHENTICATED: "" },
  ]) {
    const fixture = handlerFixture(t);
    writeFileSync(
      join(fixture.env.RUNNER_TEMP, "agent-review-codex-final.json"),
      JSON.stringify(report),
    );
    assert.equal((await enforce({ ...fixture.env, ...extra }, fixture.api)).verdict, "INCOMPLETE");
    assert.equal(fixture.check.conclusion, "failure");
  }
});

test("failed comment transport does not prematurely complete the protected check", async (t) => {
  const fixture = handlerFixture(t);
  await assert.rejects(
    enforce(fixture.env, async (route, request) => {
      if (route.endsWith("/comments")) throw new Error("publication unavailable");
      return fixture.api(route, request);
    }),
  );
  assert.equal(fixture.check.status, "in_progress");
  assert.ok(fixture.calls.every(({ request }) => request?.method !== "PATCH"));
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
