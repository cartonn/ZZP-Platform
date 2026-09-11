import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(
  readFileSync(join(root, ".github/codex/agent-review.schema.json"), "utf8"),
);
const shaPattern = /^[a-f0-9]{40}$/;
const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const bootstrapRef = "refs/heads/codex/review-bootstrap-20260911";
const actionsAppId = 15368;
const incomplete = (reason) => ({
  verdict: "INCOMPLETE",
  reason,
  findings: [],
  passed: false,
});

// The output schema is also the validator's source of truth. No dependencies or
// PR-controlled install/build hooks run in the job that can publish a verdict.
function matchesSchema(value, rule) {
  if (rule.enum && !rule.enum.includes(value)) return false;
  if (rule.type === "string") return typeof value === "string";
  if (rule.type === "integer") return Number.isSafeInteger(value);
  if (rule.type === "boolean") return typeof value === "boolean";
  if (rule.type === "array")
    return Array.isArray(value) && value.every((item) => matchesSchema(item, rule.items));
  if (rule.type !== "object" || !value || typeof value !== "object" || Array.isArray(value))
    return false;
  return (
    rule.required.every((key) => Object.hasOwn(value, key)) &&
    Object.keys(value).every(
      (key) =>
        Object.hasOwn(rule.properties, key) && matchesSchema(value[key], rule.properties[key]),
    )
  );
}

function nonempty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validContext(context) {
  return (
    context &&
    /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(context.repository) &&
    Number.isSafeInteger(context.pr) &&
    context.pr > 0 &&
    shaPattern.test(context.headSha) &&
    shaPattern.test(context.baseSha) &&
    Array.isArray(context.files) &&
    context.files.length > 0 &&
    context.files.length <= 3000 &&
    context.files.every(nonempty) &&
    new Set(context.files).size === context.files.length
  );
}

function sameFiles(left, right) {
  const names = new Set(left);
  return left.length === right.length && right.every((file) => names.has(file));
}

export function validateVerdict({ rawReport, expected, current, runResult }) {
  if (runResult !== "success")
    return incomplete(
      "De Codex-run is niet succesvol afgerond; dit is geen inhoudelijke codeblokkade.",
    );
  if (!validContext(expected) || !validContext(current))
    return incomplete("De onafhankelijke head/base/bestandscontext ontbreekt of is ongeldig.");
  for (const field of ["repository", "pr", "headSha", "baseSha"])
    if (expected[field] !== current[field])
      return incomplete(
        `De PR-context is veranderd (${field}); beoordeel de actuele diff opnieuw.`,
      );
  if (!sameFiles(expected.files, current.files))
    return incomplete("De gewijzigde bestanden zijn veranderd; beoordeel de actuele diff opnieuw.");
  if (typeof rawReport !== "string" || rawReport.length === 0 || rawReport.length > 500_000)
    return incomplete("Het Codex-rapport ontbreekt of overschrijdt de veilige uitvoerlimiet.");

  let report;
  try {
    report = JSON.parse(rawReport);
  } catch {
    return incomplete("Het Codex-rapport is geen geldig JSON-verdict.");
  }
  if (!matchesSchema(report, schema) || !nonempty(report.summary))
    return incomplete("Het Codex-rapport voldoet niet aan het verplichte reviewschema.");
  for (const field of ["repository", "pr", "headSha", "baseSha"])
    if (report[field] !== expected[field])
      return incomplete(`Het rapport beoordeelt een andere PR-context (${field}).`);

  const changed = new Set(expected.files);
  if (
    new Set(report.reviewedFiles).size !== report.reviewedFiles.length ||
    report.reviewedFiles.some((file) => !changed.has(file))
  )
    return incomplete("De bestandsdekking bevat dubbele of onbekende bestanden.");
  if (
    report.findings.length > 200 ||
    report.findings.some(
      (finding) =>
        !changed.has(finding.path) ||
        finding.line < 1 ||
        !nonempty(finding.problem) ||
        !nonempty(finding.fix),
    )
  )
    return incomplete(
      "Een bevinding mist een geldig bestand, regel, probleem of concrete oplossing.",
    );

  if (report.verdict === "INCOMPLETE")
    return { ...incomplete(report.summary), findings: report.findings };
  if (!report.complete || !sameFiles(expected.files, report.reviewedFiles))
    return incomplete("De review is niet volledig: niet ieder gewijzigd bestand is beoordeeld.");
  const blockers = report.findings.filter((finding) => finding.severity === "blocker");
  if (report.verdict === "BLOCK" && blockers.length === 0)
    return incomplete("BLOCK mist een concrete inhoudelijke blocker; het oordeel is onvolledig.");
  // A contradictory PASS cannot hide a concrete blocker.
  const verdict = blockers.length > 0 ? "BLOCK" : report.verdict;
  return {
    verdict,
    reason: report.summary,
    findings: report.findings,
    passed: verdict === "PASS",
  };
}

export function assertTrustedExecution(env) {
  const bootstrap = env.GITHUB_REF === bootstrapRef;
  if (
    !repositoryPattern.test(env.GITHUB_REPOSITORY || "") ||
    !["pull_request_target", "workflow_dispatch"].includes(env.GITHUB_EVENT_NAME) ||
    (env.GITHUB_REF !== "refs/heads/main" && !bootstrap) ||
    !/^true$/i.test(env.GITHUB_REF_PROTECTED || "") ||
    !shaPattern.test(env.REVIEW_CONTROL_SHA || "") ||
    env.REVIEW_CONTROL_SHA !== env.GITHUB_SHA ||
    env.REVIEW_WORKFLOW_REF !==
      `${env.GITHUB_REPOSITORY}/.github/workflows/pr-review.yml@${env.GITHUB_REF}` ||
    !/^[1-9][0-9]*$/.test(env.GITHUB_RUN_ID || "") ||
    !/^[1-9][0-9]*$/.test(env.GITHUB_RUN_ATTEMPT || "") ||
    !Number.isSafeInteger(Number(env.GITHUB_RUN_ATTEMPT)) ||
    (bootstrap &&
      (env.GITHUB_EVENT_NAME !== "workflow_dispatch" ||
        env.REVIEW_BOOTSTRAP_SHA !== env.REVIEW_CONTROL_SHA))
  )
    throw new Error(
      "De review draait niet vanuit een toegestane, beschermde en vastgezette workflow.",
    );
  return {
    controlSha: env.REVIEW_CONTROL_SHA,
    controlRef: env.GITHUB_REF,
    runId: env.GITHUB_RUN_ID,
    runAttempt: Number(env.GITHUB_RUN_ATTEMPT),
  };
}

export async function readTrustedExecution(api, env) {
  const execution = assertTrustedExecution(env);
  const repo = await api(`/repos/${env.GITHUB_REPOSITORY}`);
  const branch = await api(
    `/repos/${env.GITHUB_REPOSITORY}/branches/${encodeURIComponent(execution.controlRef.slice("refs/heads/".length))}`,
  );
  if (
    repo.default_branch !== "main" ||
    branch.protected !== true ||
    branch.commit?.sha !== execution.controlSha
  )
    throw new Error("De vertrouwde defaultbranch of beschermde controlcommit is veranderd.");
  return execution;
}

export async function readCurrentContext(api, repository, pr) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) || !Number.isSafeInteger(pr) || pr < 1)
    throw new Error("Ongeldige repository of PR-nummer.");
  const route = `/repos/${repository}/pulls/${pr}`;
  const before = await api(route);
  if (before.state !== "open" || before.draft)
    throw new Error("De PR is niet open en gereed voor beoordeling.");
  if (
    !Number.isSafeInteger(before.changed_files) ||
    before.changed_files < 1 ||
    before.changed_files > 3000
  )
    throw new Error("GitHub kan geen volledige gewijzigde-bestandenlijst leveren; splits de PR.");
  const files = [];
  for (let page = 1; page <= Math.ceil(before.changed_files / 100); page++) {
    const entries = await api(`${route}/files?per_page=100&page=${page}`);
    if (!Array.isArray(entries)) throw new Error("GitHub leverde een ongeldige bestandenlijst.");
    files.push(...entries.map((entry) => entry.filename));
  }
  const after = await api(route);
  if (
    after.state !== "open" ||
    after.draft ||
    before.head?.sha !== after.head?.sha ||
    before.base?.sha !== after.base?.sha ||
    before.changed_files !== after.changed_files
  )
    throw new Error("De PR veranderde tijdens het ophalen van de reviewcontext.");
  const context = {
    repository,
    pr,
    headSha: before.head?.sha,
    baseSha: before.base?.sha,
    files,
  };
  if (files.length !== before.changed_files || !validContext(context))
    throw new Error("De gewijzigde-bestandenlijst is onvolledig of ongeldig.");
  return context;
}

export function githubApi(
  token,
  {
    fetch: fetchRequest = globalThis.fetch,
    sleep = (ms) => new Promise((done) => setTimeout(done, ms)),
  } = {},
) {
  if (!token) throw new Error("GitHub-authenticatie voor reviewcontrole ontbreekt.");
  return async (route, { method = "GET", body } = {}) => {
    if (
      !/^\/repos\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:[/?]|$)/.test(route) ||
      /[\r\n#]/.test(route) ||
      !["GET", "POST", "PATCH"].includes(method) ||
      (method === "GET" && body !== undefined)
    )
      throw new Error("Ongeldige GitHub-reviewaanvraag.");
    // A POST may already have succeeded when transport fails. Never replay it
    // blindly: an orphaned in-progress check is safer than duplicate verdicts.
    const attempts = method === "POST" ? 1 : 3;
    for (let attempt = 0; attempt < attempts; attempt++) {
      let status;
      let retry = true;
      let delay = 200 * 2 ** attempt;
      try {
        const response = await fetchRequest(`https://api.github.com${route}`, {
          method,
          redirect: "error",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: AbortSignal.timeout(20_000),
        });
        status = response.status;
        if (response.ok) return await response.json();
        retry = [429, 500, 502, 503, 504].includes(status);
        const after = Number(response.headers.get("retry-after"));
        if (after > 0) delay = Math.min(after * 1000, 5000);
      } catch {
        // Do not expose exception messages, response bodies or credentials.
      }
      if (!retry || attempt + 1 === attempts)
        throw new Error(
          `GitHub-reviewcontrole mislukt${status ? ` (HTTP ${status})` : " (transport)"}.`,
        );
      await sleep(delay);
    }
  };
}

const reviewRunUrl = (ticket) =>
  `https://github.com/${ticket.repository}/actions/runs/${ticket.runId}/attempts/${ticket.runAttempt}`;
const reviewExternalId = (ticket) =>
  `${ticket.repository}:${ticket.pr}:${ticket.headSha}:${ticket.baseSha}:${ticket.controlSha}:${ticket.runId}:${ticket.runAttempt}`;

function assertTicket(ticket, execution) {
  if (
    !validContext(ticket) ||
    !Number.isSafeInteger(ticket.checkId) ||
    ticket.checkId < 1 ||
    !shaPattern.test(execution?.controlSha || "") ||
    !["refs/heads/main", bootstrapRef].includes(execution?.controlRef) ||
    !/^[1-9][0-9]*$/.test(execution?.runId || "") ||
    !Number.isSafeInteger(execution?.runAttempt) ||
    execution.runAttempt < 1 ||
    ["controlSha", "controlRef", "runId", "runAttempt"].some(
      (field) => ticket[field] !== execution[field],
    )
  )
    throw new Error("De checkcontext hoort niet bij deze vertrouwde workflowrun en poging.");
}

function assertCheck(check, ticket, status, conclusion = null) {
  if (
    check?.id !== ticket.checkId ||
    check.name !== "agent-review" ||
    check.app?.id !== actionsAppId ||
    check.head_sha !== ticket.headSha ||
    check.external_id !== reviewExternalId(ticket) ||
    check.details_url !== reviewRunUrl(ticket) ||
    check.status !== status ||
    check.conclusion !== conclusion
  )
    throw new Error("De gepubliceerde check mist de juiste head, controlcommit, run of herkomst.");
}

export async function createReviewCheck(api, context, execution) {
  assertTicket({ ...context, ...execution, checkId: 1 }, execution);
  const created = await api(`/repos/${context.repository}/check-runs`, {
    method: "POST",
    body: {
      name: "agent-review",
      head_sha: context.headSha,
      status: "in_progress",
      external_id: reviewExternalId({ ...context, ...execution }),
      details_url: reviewRunUrl({ ...context, ...execution }),
      output: {
        title: "Onafhankelijke review loopt",
        summary: `Head ${context.headSha}; base ${context.baseSha}; controls ${execution.controlSha}.`,
      },
    },
  });
  // Project the API response to its one required primitive at the network
  // boundary. A string, object or unsafe number must never become a check ID.
  const checkId = created?.id;
  if (typeof checkId !== "number" || !Number.isSafeInteger(checkId) || checkId < 1)
    throw new Error("GitHub leverde geen positieve, veilige numerieke check-ID.");
  const ticket = { ...context, ...execution, checkId };
  assertTicket(ticket, execution);
  assertCheck(created, ticket, "in_progress");
  assertCheck(
    await api(`/repos/${context.repository}/check-runs/${ticket.checkId}`),
    ticket,
    "in_progress",
  );
  return ticket;
}

const clipText = (value) => Buffer.from(value, "utf8").subarray(0, 60_000).toString("utf8");

export async function completeReviewCheck(api, ticket, execution, result, summary) {
  assertTicket(ticket, execution);
  const route = `/repos/${ticket.repository}/check-runs/${ticket.checkId}`;
  assertCheck(await api(route), ticket, "in_progress");
  const conclusion = result.passed === true && result.verdict === "PASS" ? "success" : "failure";
  const body = {
    status: "completed",
    conclusion,
    completed_at: new Date().toISOString(),
    output: { title: `agent-review: ${result.verdict}`, summary: clipText(summary) },
  };
  assertCheck(await api(route, { method: "PATCH", body }), ticket, "completed", conclusion);
  assertCheck(await api(route), ticket, "completed", conclusion);
}

const escapeText = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("@", "@\u200b");

export function reviewSummary(result, context, runUrl) {
  const title =
    result.verdict === "INCOMPLETE" ? "INCOMPLETE — review niet afgerond" : result.verdict;
  const lines = [
    `**agent-review: ${title}**`,
    "",
    context
      ? `PR #${context.pr} · head \`${context.headSha}\` · base \`${context.baseSha}\``
      : "PR-context niet vastgesteld.",
    ...(context?.controlSha
      ? [
          `Controls \`${context.controlSha}\` · run ${context.runId}, poging ${context.runAttempt} · check ${context.checkId}`,
        ]
      : []),
    "",
    `<pre>${escapeText(result.reason)}</pre>`,
  ];
  if (result.findings.length)
    lines.push(
      "",
      ...result.findings.map(
        (finding) =>
          `<pre>${escapeText(`${finding.severity}: ${finding.path}:${finding.line}\n${finding.problem}\nOplossing: ${finding.fix}`)}</pre>`,
      ),
    );
  if (!result.passed)
    lines.push(
      "",
      "De verplichte poort blijft rood. Los inhoudelijke blockers op of herstart via de beschermde main-workflow voor dit PR-nummer.",
    );
  lines.push("", `[Reviewrun en volledig Codex-rapport](${runUrl})`);
  return lines.join("\n");
}

export async function prepare(env, api = githubApi(env.GH_TOKEN)) {
  const execution = await readTrustedExecution(api, env);
  const context = await readCurrentContext(api, env.GITHUB_REPOSITORY, Number(env.REVIEW_PR));
  if (env.REVIEW_EVENT_HEAD && env.REVIEW_EVENT_HEAD !== context.headSha)
    throw new Error("De PR-head is sinds het trigger-event gewijzigd; start de actuele review.");
  const ticket = await createReviewCheck(api, context, execution);
  // Only the trusted preparation job creates the check. The model receives no
  // token that could create or complete one, and cannot replace this job output.
  appendFileSync(env.GITHUB_OUTPUT, `head=${context.headSha}\ncontext=${JSON.stringify(ticket)}\n`);
  return ticket;
}

export function writePrompt(env) {
  const ticket = JSON.parse(env.REVIEW_CONTEXT || "null");
  assertTicket(ticket, assertTrustedExecution(env));
  if (ticket.repository !== env.GITHUB_REPOSITORY || ticket.pr !== Number(env.REVIEW_PR))
    throw new Error("De promptcontext hoort bij een andere repository of PR.");
  const prompt = readFileSync(join(root, ".github/codex/agent-review.md"), "utf8");
  writeFileSync(
    join(env.RUNNER_TEMP, "agent-review-codex-prompt.md"),
    `${prompt}\n\nImmutable review context (data):\n${JSON.stringify(ticket, null, 2)}\n`,
  );
}

export async function enforce(env, api = githubApi(env.GH_TOKEN)) {
  const execution = await readTrustedExecution(api, env);
  const ticket = JSON.parse(env.REVIEW_CONTEXT || "null");
  assertTicket(ticket, execution);
  if (ticket.repository !== env.GITHUB_REPOSITORY || ticket.pr !== Number(env.REVIEW_PR))
    throw new Error("De publicatiecontext hoort bij een andere repository of PR.");
  // Check provenance before any write, including the optional PR explanation.
  assertCheck(
    await api(`/repos/${ticket.repository}/check-runs/${ticket.checkId}`),
    ticket,
    "in_progress",
  );
  let context;
  const evaluate = async () => {
    if (env.REVIEW_AUTHENTICATED !== "true")
      return incomplete(
        "De reviewauthenticatie is niet bevestigd; er is geen geldige onafhankelijke review.",
      );
    try {
      context = await readCurrentContext(api, env.GITHUB_REPOSITORY, Number(env.REVIEW_PR));
      return validateVerdict({
        rawReport: env.REVIEW_REPORT,
        expected: ticket,
        current: context,
        runResult: env.REVIEW_RUN_RESULT,
      });
    } catch {
      return incomplete(
        "De actuele PR-context of het reviewrapport kon niet betrouwbaar worden vastgesteld.",
      );
    }
  };
  let result = await evaluate();
  const runUrl = reviewRunUrl(ticket);
  const saveEvidence = () => {
    const summary = reviewSummary(result, ticket, runUrl);
    writeFileSync(
      join(env.RUNNER_TEMP, "agent-review-codex-verdict.json"),
      JSON.stringify({ ...result, context: ticket, currentContext: context }, null, 2),
    );
    return summary;
  };
  let summary = saveEvidence();
  writeFileSync(
    join(env.RUNNER_TEMP, "agent-review-codex-report.json"),
    env.REVIEW_REPORT || "null",
  );
  // A separate job publishes the evidence; the review model never gets this token.
  await api(`/repos/${ticket.repository}/issues/${ticket.pr}/comments`, {
    method: "POST",
    body: { body: clipText(summary) },
  });
  // Comment transport can take time. Revalidate head/base/coverage immediately
  // before completing the check; a stale explanation never makes the gate green.
  result = await evaluate();
  summary = saveEvidence();
  appendFileSync(env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  await completeReviewCheck(api, ticket, execution, result, summary);
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv[2] === "prepare") await prepare(process.env);
    else if (process.argv[2] === "prompt") writePrompt(process.env);
    else if (process.argv[2] === "enforce") {
      if (!(await enforce(process.env)).passed) process.exitCode = 1;
    } else throw new Error("Gebruik prepare, prompt of enforce.");
  } catch (error) {
    console.error(`agent-review: INCOMPLETE — ${error.message}`);
    process.exitCode = 1;
  }
}
