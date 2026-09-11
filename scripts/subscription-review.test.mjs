import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  prepareSubscription,
  inspectNative,
  publishSubscription,
  summaryState,
  triggerBody,
  validateLock,
  pages,
} from "./subscription-review.mjs";
import { assertTrustedExecution } from "./agent-review-codex.mjs";

const repository = "cartonn/ZZP-Platform";
const base = "a".repeat(40),
  head = "b".repeat(40),
  control = "c".repeat(40);
const botUser = { id: 199175422, login: "chatgpt-codex-connector[bot]", type: "Bot" };
const user = { id: 77, login: "cartonn", type: "User" };
const prepared = Date.parse("2026-09-11T12:00:00Z");
const now = () => Date.parse("2026-09-11T12:04:00Z");
const freeze = (id, branch, types) => ({
  id,
  name: "Native review lock",
  source: repository,
  source_type: "Repository",
  target: "branch",
  enforcement: "active",
  bypass_actors: [],
  conditions: { ref_name: { include: [`refs/heads/${branch}`], exclude: [] } },
  rules: types.map((type) => ({ type })),
  created_at: "2026-09-11T12:30:00+02:00",
  updated_at: "2026-09-11T12:30:00+02:00",
});
const sourceRule = freeze(1, "feature", ["update", "deletion"]);
const mainRule = freeze(2, "main", ["non_fast_forward", "deletion"]);
const effective = (rule) =>
  rule.rules.map((r) => ({ ...r, ruleset_id: rule.id, ruleset_source_type: "Repository" }));
const summary = (sha = head.slice(0, 7)) => ({
  id: 101,
  user: botUser,
  performed_via_github_app: { id: 1144995 },
  issue_url: `https://api.github.com/repos/${repository}/issues/1`,
  created_at: "2026-09-11T11:00:00Z",
  updated_at: "2026-09-11T12:03:00Z",
  body: `<!-- codex-pull-request-review-summary -->\n\n| 📝 **Code Review** | ✅ **Completed** <relative-time datetime="2026-09-11T12:02:00Z">2026-09-11T12:02:00Z</relative-time> | \`${sha}\` | Manual request |`,
});
const noFindings = (sha = head.slice(0, 10)) => ({
  id: 103,
  user: botUser,
  performed_via_github_app: { id: 1144995 },
  issue_url: `https://api.github.com/repos/${repository}/issues/1`,
  created_at: "2026-09-11T12:01:59Z",
  updated_at: "2026-09-11T12:01:59Z",
  body: `Codex Review: Didn't find any major issues. :rocket:\n\n**Reviewed commit:** \`${sha}\`\n\n<details> <summary>ℹ️ About Codex in GitHub</summary>\nAbout the service.\n</details>`,
});

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), "native-review-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const policy = {
    version: 1,
    repository,
    pr: 1,
    headSha: head,
    baseSha: base,
    source: { branch: "feature", rule: structuredClone(sourceRule) },
    main: { rule: structuredClone(mainRule) },
  };
  const ticket = {
    repository,
    pr: 1,
    headSha: head,
    baseSha: base,
    files: ["a.ts"],
    controlSha: control,
    controlRef: "refs/heads/codex/review-subscription-bootstrap-20260911",
    runId: "123",
    runAttempt: 1,
    checkId: 42,
  };
  const sourceLock = validateLock(
    sourceRule,
    effective(sourceRule),
    "feature",
    prepared,
    sourceRule,
  );
  const mainLock = validateLock(mainRule, effective(mainRule), "main", prepared, mainRule, [
    "non_fast_forward",
    "deletion",
  ]);
  ticket.native = {
    version: 1,
    preparedAt: new Date(prepared).toISOString(),
    challengeReadyAt: new Date(prepared).toISOString(),
    actorId: user.id,
    actorLogin: user.login,
    latestCommentId: 101,
    policy,
    lock: { branch: "feature", ...sourceLock, mainLock },
    idleSummary: null,
    idleIssueReactionIds: [],
  };
  const env = {
    GITHUB_REPOSITORY: repository,
    GITHUB_REF: ticket.controlRef,
    GITHUB_REF_PROTECTED: "true",
    GITHUB_EVENT_NAME: "workflow_dispatch",
    GITHUB_SHA: control,
    REVIEW_CONTROL_SHA: control,
    REVIEW_BOOTSTRAP_SHA: control,
    REVIEW_WORKFLOW_REF: `${repository}/.github/workflows/subscription-review.yml@${ticket.controlRef}`,
    GITHUB_RUN_ID: "123",
    GITHUB_RUN_ATTEMPT: "1",
    GITHUB_ACTOR: user.login,
    GITHUB_ACTOR_ID: String(user.id),
    REVIEW_PR: "1",
    REVIEW_CONTEXT: JSON.stringify(ticket),
    REVIEW_SOURCE_POLICY: JSON.stringify(policy),
    REVIEW_WAIT_RESULT: "success",
    RUNNER_TEMP: directory,
    GITHUB_OUTPUT: join(directory, "output"),
    GITHUB_STEP_SUMMARY: join(directory, "summary"),
  };
  const trigger = {
    id: 102,
    user,
    body: triggerBody(ticket),
    issue_url: `https://api.github.com/repos/${repository}/issues/1`,
    created_at: "2026-09-11T12:01:00Z",
    updated_at: "2026-09-11T12:01:00Z",
  };
  const state = {
    head,
    base,
    rules: [structuredClone(sourceRule), structuredClone(mainRule)],
    comments: [summary(), trigger, noFindings()],
    reactions: [
      {
        id: 9,
        user: { ...botUser, type: "User" },
        content: "+1",
        created_at: "2026-09-11T12:02:01Z",
      },
    ],
    triggerReactions: [],
    reviews: [],
    findings: [],
    mutations: [],
    check: {
      id: 42,
      app: { id: 15368 },
      name: "agent-review",
      head_sha: head,
      status: "in_progress",
      conclusion: null,
      external_id: `${repository}:1:${head}:${base}:${control}:123:1`,
      details_url: `https://github.com/${repository}/runs/42`,
    },
  };
  const api = async (route, request) => {
    assert.ok(route.startsWith(`/repos/${repository}`));
    if (request) state.mutations.push({ route, request });
    const path = route.split("?")[0].slice(`/repos/${repository}`.length);
    if (path === "") return { default_branch: "main" };
    if (path === "/collaborators/cartonn/permission") return { permission: "admin", user };
    if (path === "/pulls/1")
      return {
        state: "open",
        draft: false,
        changed_files: 1,
        head: { sha: state.head, ref: "feature", repo: { full_name: repository } },
        base: { sha: state.base, ref: "main" },
      };
    if (path === "/pulls/1/files") return [{ filename: "a.ts" }];
    if (path.startsWith("/branches/"))
      return {
        protected: true,
        commit: {
          sha:
            path === "/branches/main"
              ? state.base
              : path === "/branches/feature"
                ? state.head
                : control,
        },
      };
    if (path.startsWith("/rules/branches/"))
      return effective(state.rules[path.endsWith("main") ? 1 : 0]);
    if (path.startsWith("/rulesets/")) {
      const result = structuredClone(state.rules[Number(path.split("/").at(-1)) - 1]);
      delete result.bypass_actors;
      return result;
    }
    if (path.startsWith("/compare/")) return { merge_base_commit: { sha: state.base } };
    if (path === "/issues/1/comments") return state.comments;
    if (path === "/issues/1/reactions") return state.reactions;
    if (path === "/issues/1/timeline") return [];
    if (/^\/issues\/comments\/\d+\/reactions$/.test(path)) return state.triggerReactions;
    if (path === "/pulls/1/reviews") return state.reviews;
    if (/^\/pulls\/1\/reviews\/\d+\/comments$/.test(path)) return state.findings;
    if (path === "/check-runs" && request?.method === "POST") return state.check;
    if (path === "/check-runs/42") {
      if (request?.method === "PATCH") Object.assign(state.check, request.body);
      return structuredClone(state.check);
    }
    assert.fail(`Unexpected request: ${route}`);
  };
  return { directory, policy, ticket, env, state, api, trigger };
}

test("only the explicit native workflow/ref pair allows bootstrap push; main push and paid workflow cannot", () => {
  const env = {
    GITHUB_REPOSITORY: repository,
    GITHUB_REF: "refs/heads/codex/review-subscription-bootstrap-20260911",
    GITHUB_REF_PROTECTED: "true",
    GITHUB_EVENT_NAME: "push",
    GITHUB_SHA: control,
    REVIEW_CONTROL_SHA: control,
    REVIEW_BOOTSTRAP_SHA: control,
    GITHUB_RUN_ID: "123",
    GITHUB_RUN_ATTEMPT: "1",
  };
  env.REVIEW_WORKFLOW_REF = `${repository}/.github/workflows/subscription-review.yml@${env.GITHUB_REF}`;
  assert.equal(assertTrustedExecution(env).controlSha, control);
  for (const change of [
    { REVIEW_BOOTSTRAP_SHA: head },
    { GITHUB_REF_PROTECTED: "false" },
    { REVIEW_WORKFLOW_REF: `${repository}/.github/workflows/pr-review.yml@${env.GITHUB_REF}` },
    {
      GITHUB_REF: "refs/heads/main",
      REVIEW_WORKFLOW_REF: `${repository}/.github/workflows/subscription-review.yml@refs/heads/main`,
    },
  ])
    assert.throws(() => assertTrustedExecution({ ...env, ...change }));
});

test("owner policy supplies hidden bypass evidence; missing, changed, weak or freshly replaced locks refuse", () => {
  const hidden = structuredClone(sourceRule);
  delete hidden.bypass_actors;
  assert.ok(validateLock(hidden, effective(sourceRule), "feature", prepared, sourceRule));
  for (const mutate of [
    (r) => {
      delete r.bypass_actors;
    },
    (r) => {
      r.bypass_actors = [{ actor_type: "RepositoryRole" }];
    },
    (r) => {
      r.updated_at = new Date(prepared).toISOString();
    },
    (r) => {
      r.conditions.ref_name.include = ["refs/heads/*"];
    },
    (r) => {
      r.enforcement = "evaluate";
    },
    (r) => {
      r.rules[0].parameters = { update_allows_fetch_and_merge: true };
    },
  ]) {
    const changed = structuredClone(sourceRule);
    mutate(changed);
    assert.throws(() => validateLock(changed, effective(changed), "feature", prepared, changed));
  }
  assert.throws(() =>
    validateLock(
      { ...hidden, updated_at: "2026-09-11T11:59:59Z" },
      effective(sourceRule),
      "feature",
      prepared,
      sourceRule,
    ),
  );
  assert.throws(() => validateLock(hidden, [], "feature", prepared, sourceRule));
});

test("fresh native no-findings review is bound to full frozen source, separately from control", async (t) => {
  const f = fixture(t),
    result = await inspectNative(f.api, f.ticket, now);
  assert.equal(result.verdict, "PASS");
  assert.equal(result.triggerId, 102);
  assert.equal(result.reactionId, 9);
  assert.equal(result.reactionTarget, "pull_request");
  assert.equal(result.noFindingsCommentId, 103);
  assert.notEqual(f.ticket.headSha, f.ticket.controlSha);
  assert.deepEqual(f.state.mutations, []);
});

test("an issue thumb requires a new authentic no-findings comment and an idle reaction snapshot", async (t) => {
  for (const change of [
    (f) => {
      f.state.comments.pop();
    },
    (f) => {
      f.state.reactions = [];
    },
    (f) => {
      f.ticket.native.idleIssueReactionIds = [9];
    },
    (f) => {
      f.state.triggerReactions = f.state.reactions;
      f.state.reactions = [];
    },
    (f) => {
      f.state.reactions[0].user.type = "Organization";
    },
    (f) => {
      f.state.reactions[0].user.id = 1;
    },
    (f) => {
      f.state.reactions[0].user.login = "other[bot]";
    },
  ]) {
    const f = fixture(t);
    change(f);
    assert.equal((await inspectNative(f.api, f.ticket, now)).status, "pending");
  }
  const f = fixture(t);
  delete f.ticket.native.idleIssueReactionIds;
  await assert.rejects(inspectNative(f.api, f.ticket, now), /missing_idle_reaction_snapshot/);
});

test("no-findings comments cannot be spoofed, edited, scoped, replayed or multiply supplied", async (t) => {
  for (const change of [
    (c) => {
      c.user = user;
    },
    (c) => {
      c.performed_via_github_app.id = 1;
    },
    (c) => {
      c.id = 100;
    },
    (c) => {
      c.created_at = "2026-09-11T11:59:00Z";
      c.updated_at = c.created_at;
    },
    (c) => {
      c.updated_at = "2026-09-11T12:02:00Z";
    },
    (c) => {
      c.issue_url = "https://api.github.com/repos/other/repo/issues/1";
    },
    (c) => {
      c.body = noFindings("1234567890").body;
    },
    (c) => {
      c.body = c.body.replace("Didn't find any major issues.", "Reviewed only one file.");
    },
    (c) => {
      c.body += "\nAn extra finding follows.";
    },
  ]) {
    const f = fixture(t);
    change(f.state.comments[2]);
    await assert.rejects(inspectNative(f.api, f.ticket, now), /unbound_native_no_findings_comment/);
  }
  const f = fixture(t);
  f.state.comments.push({ ...noFindings(), id: 104 });
  await assert.rejects(inspectNative(f.api, f.ticket, now), /ambiguous_no_findings_comments/);
});

test("the final re-read detects a changed clean comment or issue reaction", async (t) => {
  for (const target of ["comment", "reaction"]) {
    const f = fixture(t);
    let reads = 0;
    await assert.rejects(
      inspectNative(
        async (route, request) => {
          const matches =
            target === "comment"
              ? route.includes("/issues/1/comments?")
              : route.includes("/issues/1/reactions?");
          if (matches && ++reads === 2) {
            if (target === "comment") f.state.comments[2].body += " changed";
            else f.state.reactions[0].id = 10;
          }
          return structuredClone(await f.api(route, request));
        },
        f.ticket,
        now,
      ),
      /native_evidence_changed_during_read/,
    );
  }
});

for (const [name, mutate] of [
  [
    "spoofed summary user",
    (f) => {
      f.state.comments[0].user = user;
    },
  ],
  [
    "wrong GitHub app",
    (f) => {
      f.state.comments[0].performed_via_github_app.id = 1;
    },
  ],
  [
    "stale trigger",
    (f) => {
      f.trigger.created_at = f.trigger.updated_at = "2026-09-11T11:59:00Z";
    },
  ],
  [
    "edited trigger",
    (f) => {
      f.trigger.updated_at = "2026-09-11T12:01:01Z";
    },
  ],
  [
    "partial-scope command",
    (f) => {
      f.trigger.body += "\nOnly look at formatting.";
    },
  ],
  [
    "different requester",
    (f) => {
      f.trigger.user = { ...user, id: 9 };
    },
  ],
  [
    "concurrent request",
    (f) => {
      f.state.comments.push({ ...f.trigger, id: 103 });
    },
  ],
  [
    "head change with same seven-character prefix",
    (f) => {
      f.state.head = head.slice(0, 7) + "d".repeat(33);
    },
  ],
  [
    "base change",
    (f) => {
      f.state.base = "d".repeat(40);
    },
  ],
  [
    "ABA via lock update then restore",
    (f) => {
      f.state.rules[0].updated_at = "2026-09-11T12:01:01Z";
    },
  ],
  [
    "main anti-rollback rule changed",
    (f) => {
      f.state.rules[1].updated_at = "2026-09-11T12:01:01Z";
    },
  ],
  [
    "unrelated completed summary",
    (f) => {
      f.state.comments[0] = summary("1234567");
    },
  ],
])
  test(`rejects ${name}`, async (t) => {
    const f = fixture(t);
    mutate(f);
    await assert.rejects(inspectNative(f.api, f.ticket, now));
    assert.deepEqual(f.state.mutations, []);
  });

test("summary alone, another user's thumb, an old thumb and eyes never produce PASS", async (t) => {
  for (const reactions of [
    [],
    [{ id: 9, user, content: "+1", created_at: "2026-09-11T12:02:01Z" }],
    [{ id: 9, user: botUser, content: "+1", created_at: "2026-09-11T11:02:01Z" }],
    [{ id: 9, user: botUser, content: "eyes" }],
  ]) {
    const f = fixture(t);
    f.state.reactions = reactions;
    assert.equal((await inspectNative(f.api, f.ticket, now)).status, "pending");
  }
});

test("native findings on this full head remain BLOCK even after a new thumb or dismissal", async (t) => {
  const f = fixture(t);
  f.state.reviews = [
    {
      id: 8,
      user: botUser,
      state: "DISMISSED",
      commit_id: head,
      submitted_at: "2026-09-11T11:00:00Z",
      pull_request_url: `https://api.github.com/repos/${repository}/pulls/1`,
    },
  ];
  f.state.findings = [
    {
      id: 7,
      user: botUser,
      pull_request_review_id: 8,
      commit_id: head,
      path: "a.ts",
      line: 1,
      body: "A concrete issue",
      html_url: "https://github.com/cartonn/ZZP-Platform/pull/1#discussion_r7",
    },
  ];
  const result = await inspectNative(f.api, f.ticket, now);
  assert.equal(result.verdict, "BLOCK");
  assert.equal(result.findings[0].id, 7);
});

test("summary identity/format and pagination cannot hide missing evidence", async () => {
  assert.throws(() => summaryState([summary(), summary()], repository, 1));
  const s = summary();
  s.body += "\n| 🔒 **Security Review** | Running |";
  assert.throws(() => summaryState([s], repository, 1));
  await assert.rejects(
    pages(async () => Array(100).fill({}), "/repos/x/y/issues"),
    /pagination_limit/,
  );
});

test("prepare refuses pending native work before creating a protected check", async (t) => {
  const f = fixture(t);
  f.state.comments = [f.trigger];
  await assert.rejects(
    prepareSubscription(f.env, f.api, () => prepared),
    /prior_native_review_not_completed/,
  );
  assert.deepEqual(f.state.mutations, []);
});

test("prepare rejects an older command still running after a newer review completed", async (t) => {
  for (const body of ["@codex review", "@codex security review"]) {
    const f = fixture(t);
    const old = {
      ...f.trigger,
      id: 98,
      body,
      created_at: "2026-09-11T11:20:00Z",
      updated_at: "2026-09-11T11:20:00Z",
    };
    const recent = {
      ...f.trigger,
      id: 99,
      body: "@codex review",
      created_at: "2026-09-11T11:40:00Z",
      updated_at: "2026-09-11T11:40:00Z",
    };
    const completed = summary();
    completed.body = completed.body.replaceAll("12:02:00Z", "11:50:00Z");
    completed.updated_at = "2026-09-11T11:51:00Z";
    f.state.comments = [old, recent, completed];
    f.state.reactions = [];
    await assert.rejects(
      prepareSubscription(
        f.env,
        async (route, request) =>
          route.includes("/issues/comments/98/reactions?")
            ? [{ id: 10, user: { ...botUser, type: "User" }, content: "eyes" }]
            : f.api(route, request),
        () => prepared,
      ),
      /prior_native_review_running/,
    );
    assert.deepEqual(f.state.mutations, []);
  }
});

test("prepare rejects an older command edited after the newest completed review even without eyes", async (t) => {
  const f = fixture(t);
  const old = {
    ...f.trigger,
    id: 98,
    body: "@codex review",
    created_at: "2026-09-11T11:20:00Z",
    updated_at: "2026-09-11T11:59:00Z",
  };
  const recent = {
    ...f.trigger,
    id: 99,
    body: "@codex review",
    created_at: "2026-09-11T11:40:00Z",
    updated_at: "2026-09-11T11:40:00Z",
  };
  const completed = summary();
  completed.body = completed.body.replaceAll("12:02:00Z", "11:50:00Z");
  completed.updated_at = "2026-09-11T11:51:00Z";
  f.state.comments = [old, recent, completed];
  f.state.reactions = [];
  await assert.rejects(
    prepareSubscription(f.env, f.api, () => prepared),
    /prior_native_review_not_completed/,
  );
  assert.deepEqual(f.state.mutations, []);
});

test("prepare creates a fresh challenge only after idle/freeze verification", async (t) => {
  const f = fixture(t);
  f.state.comments = [];
  f.state.reactions = [];
  const ticket = await prepareSubscription(f.env, f.api, () => prepared);
  assert.equal(ticket.checkId, 42);
  assert.equal(ticket.native.latestCommentId, 0);
  assert.ok(readFileSync(f.env.GITHUB_STEP_SUMMARY, "utf8").includes(triggerBody(ticket)));
  assert.equal(f.state.mutations.length, 1);
  assert.equal(f.state.mutations[0].request.method, "POST");
});

test("prepare snapshots existing issue reactions and rejects a reaction race before check creation", async (t) => {
  const f = fixture(t);
  f.state.comments = [];
  const ticket = await prepareSubscription(f.env, f.api, () => prepared);
  assert.deepEqual(ticket.native.idleIssueReactionIds, [9]);
  const raced = fixture(t);
  raced.state.comments = [];
  let reads = 0;
  await assert.rejects(
    prepareSubscription(
      raced.env,
      async (route, request) => {
        if (route.includes("/issues/1/reactions?") && ++reads === 2)
          raced.state.reactions[0].id = 10;
        return structuredClone(await raced.api(route, request));
      },
      () => prepared,
    ),
    /preparation_context_changed/,
  );
  assert.deepEqual(raced.state.mutations, []);
});

test("the observation window includes old-note edits and PR retargets while the check is created", async (t) => {
  for (const variant of ["note-edit", "retarget"]) {
    const f = fixture(t);
    f.state.reactions = [];
    f.state.comments = [
      {
        ...f.trigger,
        id: 100,
        body: "Ordinary note",
        created_at: "2026-09-11T11:00:00Z",
        updated_at: "2026-09-11T11:00:00Z",
      },
    ];
    const events = [];
    const api = async (route, request) => {
      if (route.endsWith("/check-runs") && request?.method === "POST") {
        if (variant === "note-edit") {
          f.state.comments[0].body = "@codex review only README.md";
          f.state.comments[0].updated_at = "2026-09-11T12:00:05Z";
        } else events.push({ event: "base_ref_changed", created_at: "2026-09-11T12:00:05Z" });
      }
      if (route.includes("/timeline?")) return events;
      return structuredClone(await f.api(route, request));
    };
    let timeReads = 0;
    const ticket = await prepareSubscription(
      f.env,
      api,
      () => prepared + (timeReads++ ? 10_000 : 0),
    );
    f.state.comments.push({ ...f.trigger, body: triggerBody(ticket) }, summary(), noFindings());
    f.state.reactions = [
      {
        id: 9,
        user: { ...botUser, type: "User" },
        content: "+1",
        created_at: "2026-09-11T12:02:01Z",
      },
    ];
    await assert.rejects(
      inspectNative(api, ticket, now),
      variant === "note-edit"
        ? /concurrent_or_edited_review_requests/
        : /pull_request_metadata_changed_during_review/,
    );
  }
});

test("the unique trigger must still postdate check creation, not merely the first observation", async (t) => {
  const f = fixture(t);
  f.ticket.native.challengeReadyAt = "2026-09-11T12:01:01Z";
  await assert.rejects(
    inspectNative(f.api, f.ticket, now),
    /trigger_does_not_match_trusted_challenge/,
  );
});

test("whole-second timestamps cannot hide a note edit during the first observation second", async (t) => {
  const f = fixture(t);
  f.state.reactions = [];
  f.state.comments = [
    {
      ...f.trigger,
      id: 100,
      body: "Ordinary note",
      created_at: "2026-09-11T11:00:00Z",
      updated_at: "2026-09-11T11:00:00Z",
    },
  ];
  const api = async (route, request) => {
    if (route.endsWith("/check-runs") && request?.method === "POST") {
      f.state.comments[0].body = "@codex review only README.md";
      f.state.comments[0].updated_at = "2026-09-11T12:00:00Z";
    }
    return structuredClone(await f.api(route, request));
  };
  let reads = 0;
  const ticket = await prepareSubscription(
    f.env,
    api,
    () => prepared + 500 + (reads++ ? 10_000 : 0),
  );
  f.state.comments.push({ ...f.trigger, body: triggerBody(ticket) }, summary(), noFindings());
  f.state.reactions = [
    {
      id: 9,
      user: { ...botUser, type: "User" },
      content: "+1",
      created_at: "2026-09-11T12:02:01Z",
    },
  ];
  await assert.rejects(inspectNative(api, ticket, now), /concurrent_or_edited_review_requests/);
});

test("an older command edit in the summary completion second is conservatively not idle", async (t) => {
  const f = fixture(t);
  const old = {
    ...f.trigger,
    id: 98,
    body: "@codex review",
    created_at: "2026-09-11T11:20:00Z",
    updated_at: "2026-09-11T11:50:00Z",
  };
  const recent = {
    ...f.trigger,
    id: 99,
    body: "@codex review",
    created_at: "2026-09-11T11:40:00Z",
    updated_at: "2026-09-11T11:40:00Z",
  };
  const completed = summary();
  completed.body = completed.body.replaceAll("12:02:00Z", "11:50:00.500Z");
  completed.updated_at = "2026-09-11T11:50:01Z";
  f.state.comments = [old, recent, completed];
  f.state.reactions = [];
  await assert.rejects(
    prepareSubscription(f.env, f.api, () => prepared),
    /prior_native_review_not_completed/,
  );
  assert.deepEqual(f.state.mutations, []);
});

test("completion and the clean comment must each be provably later than the trigger second", async (t) => {
  const f = fixture(t);
  f.state.comments[0].body = f.state.comments[0].body.replaceAll("12:02:00Z", "12:01:00.500Z");
  assert.equal((await inspectNative(f.api, f.ticket, now)).status, "pending");
  const sameComment = fixture(t);
  sameComment.state.comments[2].created_at = "2026-09-11T12:01:00Z";
  sameComment.state.comments[2].updated_at = "2026-09-11T12:01:00Z";
  await assert.rejects(
    inspectNative(sameComment.api, sameComment.ticket, now),
    /unbound_native_no_findings_comment/,
  );
});

test("a changed source during final evidence reads cannot publish success", async (t) => {
  const f = fixture(t);
  await assert.rejects(
    inspectNative(
      async (route, request) => {
        const result = await f.api(route, request);
        if (route.includes("/reviews?")) f.state.head = "d".repeat(40);
        return result;
      },
      f.ticket,
      now,
    ),
  );
});

test("failed waiter remains INCOMPLETE despite native-looking evidence; no old API report is consumed", async (t) => {
  const f = fixture(t);
  f.env.REVIEW_WAIT_RESULT = "failure";
  const result = await publishSubscription(f.env, f.api, now);
  assert.equal(result.verdict, "INCOMPLETE");
  assert.equal(f.state.check.conclusion, "failure");
  const evidence = JSON.parse(readFileSync(join(f.directory, "subscription-review-verdict.json")));
  assert.equal(evidence.kind, "codex-github-native");
  assert.equal(evidence.publication.checkConfirmed, true);
  assert.ok(!Object.hasOwn(evidence, "reviewedFiles"));
});

test("publisher re-reads native evidence and updates exactly its prepared genuine check", async (t) => {
  const f = fixture(t);
  const result = await publishSubscription(f.env, f.api, now);
  assert.equal(result.verdict, "PASS");
  assert.equal(f.state.check.conclusion, "success");
  assert.equal(f.state.mutations.length, 1);
  assert.equal(f.state.mutations[0].request.method, "PATCH");
  assert.equal(f.state.mutations[0].route, `/repos/${repository}/check-runs/42`);
  const evidence = JSON.parse(readFileSync(join(f.directory, "subscription-review-verdict.json")));
  assert.equal(evidence.native.reactionId, 9);
  assert.equal(evidence.publication.checkConfirmed, true);
});

test("changed public native evidence during pagination cannot be accepted", async (t) => {
  const f = fixture(t);
  let reads = 0;
  await assert.rejects(
    inspectNative(
      async (route, request) => {
        if (route.includes("/issues/1/comments?")) {
          reads++;
          if (reads === 2) f.state.comments.push({ ...f.trigger, id: 103 });
        }
        return structuredClone(await f.api(route, request));
      },
      f.ticket,
      now,
    ),
    /native_evidence_changed_during_read/,
  );
});

test("expired review windows and changed external policy never publish PASS", async (t) => {
  const f = fixture(t);
  await assert.rejects(
    inspectNative(f.api, f.ticket, () => prepared + 36 * 60_000),
    /review_window_expired/,
  );
  f.env.REVIEW_SOURCE_POLICY = "null";
  await assert.rejects(publishSubscription(f.env, f.api, now), /external_policy_changed/);
  assert.deepEqual(f.state.mutations, []);
});

test("retargeting the PR away and back cannot reuse a review on the same source SHA", async (t) => {
  const f = fixture(t);
  await assert.rejects(
    inspectNative(
      async (route, request) =>
        route.includes("/timeline?")
          ? [
              { event: "base_ref_changed", created_at: "2026-09-11T12:01:10Z" },
              { event: "base_ref_changed", created_at: "2026-09-11T12:01:20Z" },
            ]
          : f.api(route, request),
      f.ticket,
      now,
    ),
    /metadata_changed/,
  );
});
