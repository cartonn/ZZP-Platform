import { appendFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  githubApi,
  readTrustedExecution,
  readCurrentContext,
  createReviewCheck,
  completeReviewCheck,
  reviewSummary,
} from "./agent-review-codex.mjs";

const BOT = 199175422;
const APP = 1144995;
const LOGIN = "chatgpt-codex-connector[bot]";
const MARKER = "<!-- codex-pull-request-review-summary -->";
const MAX_WAIT = 35 * 60_000;
const fail = (code) => {
  throw new Error(`subscription-review: ${code}`);
};
const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const isId = (value) => Number.isSafeInteger(value) && value > 0;
const wholeSecond = (ms) => Math.floor(ms / 1000) * 1000;
const time = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value) ||
    !Number.isFinite(Date.parse(value))
  )
    fail("invalid_timestamp");
  return Date.parse(value);
};
const bot = (value) =>
  value?.user?.id === BOT && value.user.login === LOGIN && value.user.type === "Bot";
// GitHub's reactions endpoint serializes this app account as User, while its
// comments/reviews use Bot. The immutable account ID and login must still match.
const reactionBot = (value) =>
  value?.user?.id === BOT &&
  value.user.login === LOGIN &&
  ["Bot", "User"].includes(value.user.type);
const cleanComment = (value) => value?.body?.startsWith("Codex Review:");
const command = (value) =>
  value?.user?.type === "User" && /@codex\s+(?:security\s+)?review\b/i.test(value.body || "");
const issueRoute = (ticket) => `/repos/${ticket.repository}/issues/${ticket.pr}`;
const sameContext = (a, b) =>
  ["repository", "pr", "headSha", "baseSha"].every((key) => a[key] === b[key]) &&
  a.files.length === b.files.length &&
  [...a.files].sort().every((path, i) => path === [...b.files].sort()[i]);

export async function pages(api, route) {
  const rows = [];
  for (let page = 1; page <= 20; page++) {
    const part = await api(`${route}${route.includes("?") ? "&" : "?"}per_page=100&page=${page}`);
    if (!Array.isArray(part) || part.length > 100) fail("invalid_or_truncated_pagination");
    rows.push(...part);
    if (part.length < 100) return rows;
  }
  fail("pagination_limit");
}

// A short hash is only a display cross-check. The actual binding is the full
// PR head plus an unchanged, no-bypass source lock established before the request.
export function summaryState(comments, repository, pr) {
  const summaries = comments.filter((item) => item.body?.startsWith(MARKER));
  if (!summaries.length) return null;
  if (summaries.length !== 1) fail("ambiguous_summary");
  const item = summaries[0];
  if (
    !bot(item) ||
    item.performed_via_github_app?.id !== APP ||
    !isId(item.id) ||
    item.issue_url !== `https://api.github.com/repos/${repository}/issues/${pr}`
  )
    fail("unauthenticated_summary");
  const rows = item.body.split("\n").filter((line) => /^\| .*\*\*.*Review\*\* \|/.test(line));
  if (rows.length !== 1) fail("unsupported_or_concurrent_review_summary");
  const match =
    /^\| 📝 \*\*Code Review\*\* \| ✅ \*\*Completed\*\* <relative-time datetime="([^"]+)">[^<]+<\/relative-time> \| `([a-f0-9]{7,40})` \| Manual request \|$/.exec(
      rows[0],
    );
  if (!match) return { id: item.id, state: "pending", updatedAt: item.updated_at };
  const completedAt = time(match[1]);
  if (completedAt > time(item.updated_at) + 1000) fail("invalid_summary_completion");
  return {
    id: item.id,
    state: "completed",
    completedAt,
    shortSha: match[2],
    updatedAt: item.updated_at,
  };
}

export function publicRule(rule) {
  return Object.fromEntries(
    [
      "id",
      "name",
      "source",
      "source_type",
      "target",
      "enforcement",
      "conditions",
      "rules",
      "created_at",
      "updated_at",
    ].map((key) => [key, rule?.[key]]),
  );
}

export function validateLock(
  rule,
  effective,
  branch,
  before,
  expected,
  required = ["update", "deletion"],
) {
  // GitHub intentionally hides bypass_actors from GITHUB_TOKEN. Only the owner's
  // separate, non-secret policy pin supplies that fact; missing evidence fails.
  if (
    !expected ||
    !Array.isArray(expected.bypass_actors) ||
    expected.bypass_actors.length !== 0 ||
    hash(publicRule(rule)) !== hash(publicRule(expected)) ||
    (rule.bypass_actors !== undefined &&
      (!Array.isArray(rule.bypass_actors) || rule.bypass_actors.length))
  )
    fail("lock_does_not_match_admin_policy");
  if (
    !isId(rule?.id) ||
    rule.target !== "branch" ||
    rule.enforcement !== "active" ||
    rule.source_type !== "Repository" ||
    rule.conditions?.ref_name?.include?.length !== 1 ||
    rule.conditions.ref_name.include[0] !== `refs/heads/${branch}` ||
    rule.conditions.ref_name.exclude?.length !== 0
  )
    fail("source_not_immutably_locked");
  if (time(rule.created_at) >= before || time(rule.updated_at) >= before)
    fail("source_lock_not_established_before_request");
  for (const type of required) {
    const declared = rule.rules?.filter((item) => item.type === type);
    if (
      declared?.length !== 1 ||
      declared[0].parameters?.update_allows_fetch_and_merge === true ||
      !effective.some(
        (item) =>
          item.type === type &&
          item.ruleset_id === rule.id &&
          item.ruleset_source_type === "Repository",
      )
    )
      fail("source_lock_not_effective");
  }
  return { id: rule.id, digest: hash(publicRule(rule)), updatedAt: rule.updated_at };
}

export async function frozenSource(api, ticket, before, policy = ticket.native?.policy) {
  const route = `/repos/${ticket.repository}`;
  if (
    !policy ||
    policy.version !== 1 ||
    ["repository", "pr", "headSha", "baseSha"].some((key) => policy[key] !== ticket[key]) ||
    !isId(policy.source?.rule?.id) ||
    !isId(policy.main?.rule?.id)
  )
    fail("missing_or_mismatched_admin_policy");
  const pr = await api(`${route}/pulls/${ticket.pr}`);
  if (
    pr.head?.repo?.full_name !== ticket.repository ||
    pr.head?.sha !== ticket.headSha ||
    pr.base?.ref !== "main" ||
    pr.base?.sha !== ticket.baseSha ||
    pr.draft ||
    pr.state !== "open"
  )
    fail("source_context_changed_or_fork");
  const branch = pr.head.ref;
  if (typeof branch !== "string" || !branch || branch === "main" || branch !== policy.source.branch)
    fail("invalid_source_branch");
  const current = await api(`${route}/branches/${encodeURIComponent(branch)}`);
  if (current.commit?.sha !== ticket.headSha || current.protected !== true)
    fail("source_ref_changed");
  const effective = await pages(api, `${route}/rules/branches/${encodeURIComponent(branch)}`);
  const sourceRule = await api(`${route}/rulesets/${policy.source.rule.id}`);
  const lock = validateLock(sourceRule, effective, branch, before, policy.source.rule);
  const mainBranch = await api(`${route}/branches/main`);
  if (mainBranch.protected !== true || mainBranch.commit?.sha !== ticket.baseSha)
    fail("base_changed");
  const mainEffective = await pages(api, `${route}/rules/branches/main`);
  const mainRule = await api(`${route}/rulesets/${policy.main.rule.id}`);
  const mainLock = validateLock(mainRule, mainEffective, "main", before, policy.main.rule, [
    "non_fast_forward",
    "deletion",
  ]);
  const compare = await api(`${route}/compare/${ticket.baseSha}...${ticket.headSha}`);
  if (compare.merge_base_commit?.sha !== ticket.baseSha) fail("base_not_ancestor_update_branch");
  return { branch, ...lock, mainLock };
}

export function triggerBody(ticket) {
  return `@codex review\n\nReview the entire pull request at head ${ticket.headSha} against base ${ticket.baseSha}. Review only; do not change code.\n\n<!-- handslag-subscription-review:${ticket.repository}:${ticket.pr}:${ticket.runId}:${ticket.runAttempt}:${ticket.checkId} -->`;
}

async function reactions(api, route) {
  return pages(api, `${route}/reactions`);
}

export async function prepareSubscription(env, api = githubApi(env.GH_TOKEN), now = Date.now) {
  const execution = await readTrustedExecution(api, env);
  const context = await readCurrentContext(api, env.GITHUB_REPOSITORY, Number(env.REVIEW_PR));
  const permission = await api(
    `/repos/${context.repository}/collaborators/${encodeURIComponent(env.GITHUB_ACTOR)}/permission`,
  );
  const actor = permission.user;
  if (
    !actor ||
    actor.type !== "User" ||
    actor.login !== env.GITHUB_ACTOR ||
    actor.id !== Number(env.GITHUB_ACTOR_ID) ||
    !["admin", "maintain", "write"].includes(permission.permission)
  )
    fail("requester_not_authorized");
  const before = now();
  const policy = JSON.parse(env.REVIEW_SOURCE_POLICY || "null");
  const lock = await frozenSource(api, context, before, policy);
  const comments = await pages(api, `${issueRoute(context)}/comments`);
  if (comments.some((c) => !isId(c.id))) fail("invalid_comment_id");
  const summary = summaryState(comments, context.repository, context.pr);
  const commands = comments.filter(command).sort((a, b) => time(b.created_at) - time(a.created_at));
  if (
    summary?.state === "pending" ||
    (commands.length &&
      (!summary ||
        commands.some((item) => time(item.updated_at) >= wholeSecond(summary.completedAt))))
  )
    fail("prior_native_review_not_completed");
  const idleIssueReactions = await reactions(api, issueRoute(context));
  if (idleIssueReactions.some((r) => !isId(r.id))) fail("invalid_reaction_id");
  if (idleIssueReactions.some((r) => reactionBot(r) && r.content === "eyes"))
    fail("prior_native_review_running");
  for (const item of commands) {
    const prior = await reactions(api, `/repos/${context.repository}/issues/comments/${item.id}`);
    if (prior.some((r) => reactionBot(r) && r.content === "eyes"))
      fail("prior_native_review_running");
  }
  const afterLock = await frozenSource(api, context, before, policy);
  if (
    hash(lock) !== hash(afterLock) ||
    hash(idleIssueReactions) !== hash(await reactions(api, issueRoute(context))) ||
    !sameContext(context, await readCurrentContext(api, context.repository, context.pr))
  )
    fail("preparation_context_changed");
  const ticket = {
    ...(await createReviewCheck(api, context, execution)),
    native: {
      version: 1,
      preparedAt: new Date(wholeSecond(before)).toISOString(),
      challengeReadyAt: new Date(now()).toISOString(),
      actorId: actor.id,
      actorLogin: actor.login,
      lock,
      policy,
      idleSummary: summary,
      idleIssueReactionIds: idleIssueReactions.map((r) => r.id),
      latestCommentId: Math.max(0, ...comments.map((c) => c.id)),
    },
  };
  appendFileSync(env.GITHUB_OUTPUT, `context=${JSON.stringify(ticket)}\n`);
  appendFileSync(
    env.GITHUB_STEP_SUMMARY,
    `Source locked at \`${ticket.headSha}\`; base \`${ticket.baseSha}\`. From the linked GitHub account ${actor.login}, post this exact fresh request now:\n\n\`\`\`text\n${triggerBody(ticket)}\n\`\`\`\n`,
  );
  writeFileSync(
    join(env.RUNNER_TEMP, "subscription-review-preparation.json"),
    JSON.stringify(ticket, null, 2),
  );
  return ticket;
}

export async function inspectNative(api, ticket, now = Date.now) {
  const since = time(ticket.native?.preparedAt);
  const challengeReady = time(ticket.native?.challengeReadyAt);
  if (challengeReady < since || challengeReady > now()) fail("invalid_challenge_window");
  const idleReactionIds = ticket.native?.idleIssueReactionIds;
  if (
    !Array.isArray(idleReactionIds) ||
    idleReactionIds.some((id) => !isId(id)) ||
    new Set(idleReactionIds).size !== idleReactionIds.length
  )
    fail("missing_idle_reaction_snapshot");
  if (now() < since || now() - since > MAX_WAIT) fail("review_window_expired");
  if (!sameContext(ticket, await readCurrentContext(api, ticket.repository, ticket.pr)))
    fail("current_context_changed");
  const lock = await frozenSource(api, ticket, since);
  if (hash(lock) !== hash(ticket.native.lock)) fail("source_lock_changed");
  const checkTimeline = async () => {
    const events = await pages(api, `${issueRoute(ticket)}/timeline`);
    const changes = new Set([
      "base_ref_changed",
      "base_ref_force_pushed",
      "head_ref_force_pushed",
      "head_ref_deleted",
      "head_ref_restored",
      "base_ref_deleted",
      "converted_to_draft",
      "ready_for_review",
      "reopened",
      "closed",
      "merged",
    ]);
    if (events.some((event) => changes.has(event.event) && time(event.created_at) >= since))
      fail("pull_request_metadata_changed_during_review");
  };
  await checkTimeline();
  const comments = await pages(api, `${issueRoute(ticket)}/comments`);
  const requests = comments.filter(
    (c) => command(c) && (c.id > ticket.native.latestCommentId || time(c.updated_at) >= since),
  );
  if (!requests.length) return { status: "pending", reason: "waiting_for_fresh_trigger" };
  if (requests.length !== 1) fail("concurrent_or_edited_review_requests");
  const trigger = requests[0];
  if (
    trigger.body !== triggerBody(ticket) ||
    trigger.user.id !== ticket.native.actorId ||
    trigger.user.login !== ticket.native.actorLogin ||
    trigger.created_at !== trigger.updated_at ||
    time(trigger.created_at) <= challengeReady ||
    trigger.issue_url !== `https://api.github.com/repos/${ticket.repository}/issues/${ticket.pr}`
  )
    fail("trigger_does_not_match_trusted_challenge");
  const summary = summaryState(comments, ticket.repository, ticket.pr);
  if (
    !summary ||
    summary.state !== "completed" ||
    wholeSecond(summary.completedAt) <= time(trigger.created_at)
  )
    return { status: "pending", reason: "native_review_not_complete", triggerId: trigger.id };
  if (
    !ticket.headSha.startsWith(summary.shortSha) ||
    time(summary.updatedAt) < time(trigger.created_at)
  )
    fail("summary_for_other_head");
  const react = await reactions(api, `/repos/${ticket.repository}/issues/comments/${trigger.id}`);
  const issueReactions = await reactions(api, issueRoute(ticket));
  if ([...react, ...issueReactions].some((r) => reactionBot(r) && r.content === "eyes"))
    return { status: "pending", reason: "native_review_running", triggerId: trigger.id };
  const reviews = await pages(api, `/repos/${ticket.repository}/pulls/${ticket.pr}/reviews`);
  const nativeReviews = reviews.filter(bot);
  if (
    nativeReviews.some(
      (r) => time(r.submitted_at) >= time(trigger.created_at) && r.commit_id !== ticket.headSha,
    )
  )
    fail("native_review_for_other_head");
  const currentReviews = nativeReviews.filter((r) => r.commit_id === ticket.headSha);
  const findings = [];
  for (const review of currentReviews) {
    if (
      !isId(review.id) ||
      !["COMMENTED", "APPROVED", "CHANGES_REQUESTED", "DISMISSED"].includes(review.state) ||
      review.pull_request_url !==
        `https://api.github.com/repos/${ticket.repository}/pulls/${ticket.pr}`
    )
      fail("invalid_native_review");
    const rows = await pages(
      api,
      `/repos/${ticket.repository}/pulls/${ticket.pr}/reviews/${review.id}/comments`,
    );
    for (const item of rows) {
      if (
        !bot(item) ||
        item.pull_request_review_id !== review.id ||
        item.commit_id !== ticket.headSha ||
        !isId(item.id)
      )
        fail("unbound_native_finding");
      findings.push({
        reviewId: review.id,
        id: item.id,
        path: item.path,
        line: item.line ?? item.original_line,
        body: item.body,
        url: item.html_url,
      });
    }
    // Re-running an unchanged head must never erase a previous native concern,
    // including a dismissed or comment-only review without inline suggestions.
    if (review.state !== "APPROVED" && !rows.length)
      findings.push({ reviewId: review.id, body: review.body, url: review.html_url });
  }
  const finish = async (result) => {
    const relevant = (items) =>
      items.filter((c) => command(c) || c.body?.startsWith(MARKER) || cleanComment(c));
    if (
      hash(relevant(await pages(api, `${issueRoute(ticket)}/comments`))) !==
        hash(relevant(comments)) ||
      hash(await reactions(api, `/repos/${ticket.repository}/issues/comments/${trigger.id}`)) !==
        hash(react) ||
      hash(await reactions(api, issueRoute(ticket))) !== hash(issueReactions) ||
      hash(await pages(api, `/repos/${ticket.repository}/pulls/${ticket.pr}/reviews`)) !==
        hash(reviews)
    )
      fail("native_evidence_changed_during_read");
    await checkTimeline();
    if (
      !sameContext(ticket, await readCurrentContext(api, ticket.repository, ticket.pr)) ||
      hash(await frozenSource(api, ticket, since)) !== hash(ticket.native.lock)
    )
      fail("source_changed_during_evidence_read");
    return result;
  };
  if (findings.length)
    return finish({
      status: "completed",
      verdict: "BLOCK",
      triggerId: trigger.id,
      summary,
      reviewIds: currentReviews.map((r) => r.id),
      findings,
      lock,
    });
  const clean = comments.filter(
    (c) => cleanComment(c) && (c.id > ticket.native.latestCommentId || time(c.updated_at) >= since),
  );
  if (!clean.length)
    return {
      status: "pending",
      reason: "missing_native_no_findings_comment",
      triggerId: trigger.id,
    };
  if (clean.length !== 1) fail("ambiguous_no_findings_comments");
  const confirmation = clean[0];
  // The provider varies the first line's decorative sign-off. The canonical
  // positive sentence, commit paragraph and authenticated evidence stay required.
  const match =
    /^Codex Review: Didn't find any major issues\.(?: [^\r\n]{1,240})?\n\n\*\*Reviewed commit:\*\* `([a-f0-9]{10,40})`\n\n<details> <summary>ℹ️ About Codex in GitHub<\/summary>\n[\s\S]*\n<\/details>$/.exec(
      confirmation.body,
    );
  if (
    !match ||
    !bot(confirmation) ||
    confirmation.performed_via_github_app?.id !== APP ||
    !isId(confirmation.id) ||
    confirmation.id <= ticket.native.latestCommentId ||
    confirmation.issue_url !==
      `https://api.github.com/repos/${ticket.repository}/issues/${ticket.pr}` ||
    confirmation.created_at !== confirmation.updated_at ||
    time(confirmation.created_at) <= time(trigger.created_at) ||
    !ticket.headSha.startsWith(match[1])
  )
    fail("unbound_native_no_findings_comment");
  const thumbs = issueReactions.filter(
    (r) =>
      reactionBot(r) &&
      r.content === "+1" &&
      isId(r.id) &&
      !idleReactionIds.includes(r.id) &&
      time(r.created_at) >= time(trigger.created_at) &&
      time(r.created_at) >= time(confirmation.created_at),
  );
  if (thumbs.length !== 1)
    return {
      status: "pending",
      reason: "no_authenticated_no_findings_reaction",
      triggerId: trigger.id,
    };
  return finish({
    status: "completed",
    verdict: "PASS",
    triggerId: trigger.id,
    summary,
    reviewIds: currentReviews.map((r) => r.id),
    reactionId: thumbs[0].id,
    reactionTarget: "pull_request",
    noFindingsCommentId: confirmation.id,
    findings: [],
    lock,
  });
}

function ticketFrom(env) {
  const ticket = JSON.parse(env.REVIEW_CONTEXT || "null");
  if (
    !ticket ||
    ticket.repository !== env.GITHUB_REPOSITORY ||
    ticket.pr !== Number(env.REVIEW_PR) ||
    !isId(ticket.checkId) ||
    ticket.runId !== env.GITHUB_RUN_ID ||
    ticket.runAttempt !== Number(env.GITHUB_RUN_ATTEMPT) ||
    ticket.controlSha !== env.REVIEW_CONTROL_SHA ||
    !ticket.native ||
    ticket.native.version !== 1
  )
    fail("invalid_prepared_ticket");
  if (hash(ticket.native.policy) !== hash(JSON.parse(env.REVIEW_SOURCE_POLICY || "null")))
    fail("external_policy_changed");
  return ticket;
}

export async function waitSubscription(
  env,
  api = githubApi(env.GH_TOKEN),
  { now = Date.now, sleep = (ms) => new Promise((done) => setTimeout(done, ms)) } = {},
) {
  await readTrustedExecution(api, env);
  const ticket = ticketFrom(env);
  for (;;) {
    const result = await inspectNative(api, ticket, now);
    writeFileSync(
      join(env.RUNNER_TEMP, "subscription-review-observed.json"),
      JSON.stringify(result, null, 2),
    );
    if (result.status === "completed") {
      appendFileSync(env.GITHUB_OUTPUT, "completed=true\n");
      return result;
    }
    await sleep(55_000);
  }
}

export async function publishSubscription(env, api = githubApi(env.GH_TOKEN), now = Date.now) {
  const execution = await readTrustedExecution(api, env);
  const ticket = ticketFrom(env);
  let native;
  let result = {
    verdict: "INCOMPLETE",
    passed: false,
    reason: "De native Codex-review is niet volledig en betrouwbaar bevestigd.",
    findings: [],
  };
  try {
    native = await inspectNative(api, ticket, now);
    if (env.REVIEW_WAIT_RESULT === "success" && native.status === "completed")
      result = {
        verdict: native.verdict,
        passed: native.verdict === "PASS",
        reason:
          native.verdict === "PASS"
            ? "De onafhankelijke Codex GitHub-app heeft deze bevroren PR zonder bevindingen afgerond. Het volledige broncommit is via de onveranderde bronref gebonden; er wordt geen API-modelidentiteit of bestandsdekking gefingeerd."
            : "De onafhankelijke Codex GitHub-app heeft bevindingen op dit volledige broncommit geplaatst. Los ze op en vraag een nieuwe review op een nieuwe commit aan.",
        findings: [],
      };
  } catch (error) {
    native = {
      status: "incomplete",
      reason: error.message?.startsWith("subscription-review:")
        ? error.message
        : "native_evidence_unavailable",
    };
  }
  const runUrl = `https://github.com/${ticket.repository}/actions/runs/${ticket.runId}/attempts/${ticket.runAttempt}`;
  const summary = reviewSummary(result, ticket, runUrl);
  const evidence = {
    kind: "codex-github-native",
    ...result,
    context: ticket,
    native,
    publication: { checkConfirmed: false },
  };
  const save = () =>
    writeFileSync(
      join(env.RUNNER_TEMP, "subscription-review-verdict.json"),
      JSON.stringify(evidence, null, 2),
    );
  save();
  await completeReviewCheck(api, ticket, execution, result, summary);
  evidence.publication.checkConfirmed = true;
  save();
  appendFileSync(env.GITHUB_STEP_SUMMARY, summary + "\n");
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const mode = process.argv[2];
    if (mode === "prepare") await prepareSubscription(process.env);
    else if (mode === "wait") await waitSubscription(process.env);
    else if (mode === "publish") {
      if (!(await publishSubscription(process.env)).passed) process.exitCode = 1;
    } else fail("unknown_mode");
  } catch (error) {
    console.error(
      error.message?.startsWith("subscription-review:")
        ? error.message
        : "subscription-review: INCOMPLETE",
    );
    process.exitCode = 1;
  }
}
