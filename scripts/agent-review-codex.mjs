import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(
  readFileSync(join(root, ".github/codex/agent-review.schema.json"), "utf8"),
);
const shaPattern = /^[a-f0-9]{40}$/;
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

export function assertDispatchHead({ dispatchSha, eventHead, context }) {
  if (!validContext(context)) throw new Error("Ongeldige PR-context.");
  if (dispatchSha && dispatchSha !== context.headSha)
    throw new Error("Dispatch moet op de actuele head-branch van de PR draaien, niet op main.");
  if (eventHead && eventHead !== context.headSha)
    throw new Error("De PR-head is sinds het trigger-event gewijzigd; start de actuele review.");
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

function githubApi(token) {
  if (!token) throw new Error("GitHub-authenticatie voor reviewcontrole ontbreekt.");
  return async (route, body) => {
    const response = await fetch(`https://api.github.com${route}`, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20_000),
    });
    // Never print response bodies or credentials to runner logs.
    if (!response.ok) throw new Error(`GitHub-reviewcontrole mislukt (HTTP ${response.status}).`);
    return response.json();
  };
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
      "De verplichte poort blijft rood. Los inhoudelijke blockers op of herstart een onvoltooide review op de actuele PR-head-branch.",
    );
  lines.push("", `[Reviewrun en volledig Codex-rapport](${runUrl})`);
  return lines.join("\n");
}

async function prepare(env) {
  const context = await readCurrentContext(
    githubApi(env.GH_TOKEN),
    env.GITHUB_REPOSITORY,
    Number(env.REVIEW_PR),
  );
  assertDispatchHead({
    dispatchSha: env.REVIEW_DISPATCH_SHA,
    eventHead: env.REVIEW_EVENT_HEAD,
    context,
  });
  const prompt = readFileSync(join(root, ".github/codex/agent-review.md"), "utf8");
  writeFileSync(
    join(env.RUNNER_TEMP, "agent-review-codex-prompt.md"),
    `${prompt}\n\nImmutable review context (data):\n${JSON.stringify(context, null, 2)}\n`,
  );
  // JSON escapes embedded line breaks in filenames, so neither value can inject
  // a second GitHub output entry.
  appendFileSync(
    env.GITHUB_OUTPUT,
    `head=${context.headSha}\ncontext=${JSON.stringify(context)}\n`,
  );
}

async function enforce(env) {
  const api = githubApi(env.GH_TOKEN);
  let context;
  let result;
  try {
    context = await readCurrentContext(api, env.GITHUB_REPOSITORY, Number(env.REVIEW_PR));
    const expected = env.REVIEW_CONTEXT ? JSON.parse(env.REVIEW_CONTEXT) : null;
    result = validateVerdict({
      rawReport: env.REVIEW_REPORT,
      expected,
      current: context,
      runResult: env.REVIEW_RUN_RESULT,
    });
  } catch {
    result = incomplete(
      "De actuele PR-context of het reviewrapport kon niet betrouwbaar worden vastgesteld.",
    );
  }
  if (env.REVIEW_AUTHENTICATED === "false")
    result = incomplete(
      "OPENAI_API_KEY ontbreekt. Er is geen Codex-review uitgevoerd; de verplichte poort blijft geblokkeerd.",
    );
  const runUrl = `https://github.com/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`;
  const summary = reviewSummary(result, context, runUrl);
  appendFileSync(env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  writeFileSync(
    join(env.RUNNER_TEMP, "agent-review-codex-verdict.json"),
    JSON.stringify({ ...result, context }, null, 2),
  );
  writeFileSync(
    join(env.RUNNER_TEMP, "agent-review-codex-report.json"),
    env.REVIEW_REPORT || "null",
  );
  // A separate job publishes the evidence; the review model never gets this token.
  await api(`/repos/${env.GITHUB_REPOSITORY}/issues/${Number(env.REVIEW_PR)}/comments`, {
    body:
      summary.length <= 60_000
        ? summary
        : `${summary.slice(0, 58_000)}\n\nVolledige bevindingen: ${runUrl}`,
  });
  if (!result.passed) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv[2] === "prepare") await prepare(process.env);
    else if (process.argv[2] === "enforce") await enforce(process.env);
    else throw new Error("Gebruik prepare of enforce.");
  } catch (error) {
    console.error(`agent-review: INCOMPLETE — ${error.message}`);
    process.exitCode = 1;
  }
}
