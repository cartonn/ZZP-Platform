import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";

const mainSha = "6fa3462f6f0163e66e4a5fecde20d6bdb46958c0";
const oldSha = "d22bb91600000000000000000000000000000000";
const workflow = parse(readFileSync(".github/workflows/monitor.yml", "utf8"));
const steps = workflow.jobs["deploy-lag-watchdog"].steps;

function runStep(kind: "check" | "incident", fixture: Record<string, unknown> = {}) {
  const directory = mkdtempSync(join(tmpdir(), "deploy-watchdog-"));
  const outputPath = join(directory, "output");
  const callsPath = join(directory, "calls");
  writeFileSync(outputPath, "");
  writeFileSync(callsPath, "[]");
  const statePath = join(directory, "state");
  writeFileSync(statePath, JSON.stringify({ mainSha, oldSha, ...fixture }));
  const stub = `#!${process.execPath}
const fs = require('node:fs');
const path = require('node:path');
const state = JSON.parse(fs.readFileSync(process.env.TEST_STATE, 'utf8'));
const args = process.argv.slice(2);
const command = path.basename(process.argv[1]);
const out = value => console.log(value);
const fail = () => process.exit(1);
if (command === 'date') out(args.includes('-d') ? '1789027200' : '1789099200');
else if (command === 'curl') {
  if (state.httpError) fail();
  out(state.body ?? JSON.stringify({ status: 'ok', db: true, commit: state.prodSha ?? state.mainSha.slice(0, 7) }));
} else if (command === 'git') {
  if (args.includes('--short')) out(state.mainSha.slice(0, 8));
  else if (args.includes('--verify')) out(state.mainSha);
  else if (args[0] === 'log') out(args.includes('--format=%cI') ? '2026-09-10T08:00:00Z' : Math.floor(Date.now() / 1000) - (state.ageSeconds ?? 72000));
  else if (args[0] === 'cat-file') out(state.objectType ?? 'commit');
  else if (args[0] === 'rev-parse') out((state.candidates ?? [state.mainSha, state.oldSha].filter(sha => sha.startsWith(args[1].split('=')[1]))).join('\\n'));
  else fail();
} else if (command === 'gh') {
  const calls = JSON.parse(fs.readFileSync(process.env.TEST_CALLS, 'utf8'));
  calls.push(args);
  fs.writeFileSync(process.env.TEST_CALLS, JSON.stringify(calls));
  if (args[0] === 'label' && args[1] === 'list') {
    if (state.labelReadError) fail();
    out(state.labelBody ?? (state.label ? '[{"name":"deploy-lag"}]' : state.emptyLabelResult ? '' : '[]'));
  }
  else if (args[0] === 'label' && args[1] === 'create') {
    if (state.labelFailure && !state.labelRace) fail();
    state.label = true;
    fs.writeFileSync(process.env.TEST_STATE, JSON.stringify(state));
    if (state.labelRace) fail();
  } else if (args[0] === 'issue' && args[1] === 'list') out(state.issueBody ?? (args.includes('--jq') ? (state.existing ?? '') : JSON.stringify(state.existing ? [{ number: state.existing }] : [])));
  else if (args[0] === 'issue' && args[1] === 'create' && !state.label) fail();
} else fail();
`;
  for (const command of ["date", "curl", "git", "gh"]) {
    writeFileSync(join(directory, command), stub, { mode: 0o755 });
  }
  try {
    const step = steps.find((candidate: { id?: string; name?: string }) =>
      kind === "check" ? candidate.id === "check" : candidate.name?.startsWith("Issue "),
    );
    const result = spawnSync(
      "bash",
      ["--noprofile", "--norc", "-e", "-o", "pipefail", "-c", step.run],
      {
        cwd: resolve("."),
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${directory}:${process.env.PATH}`,
          TEST_STATE: statePath,
          TEST_CALLS: callsPath,
          GITHUB_OUTPUT: outputPath,
          HEALTH_URL: "https://health.invalid/api/health",
          GH_TOKEN: "test-only-token",
          REPO: "fixture/platform",
          LAG: String(fixture.lag ?? "true"),
          MAIN_SHA: mainSha,
          PROD_SHA: String(fixture.incidentProd ?? oldSha),
          AGE_HOURS: "20",
        },
      },
    );
    return {
      ...result,
      output: readFileSync(outputPath, "utf8"),
      calls: JSON.parse(readFileSync(callsPath, "utf8")) as string[][],
    };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

describe("production watchdog workflow", () => {
  it("recognizes the incident's seven-character health commit despite Git's eight-character abbreviation", () => {
    const result = runStep("check");
    expect(result.status, result.stderr).toBe(0);
    expect(result.output).toContain("lag=false\n");
  });

  it("creates the missing incident label before opening an issue", () => {
    const result = runStep("incident");
    expect(result.status, result.stderr).toBe(0);
    const createLabel = result.calls.findIndex(
      (call) => call[0] === "label" && call[1] === "create",
    );
    const createIssue = result.calls.findIndex(
      (call) => call[0] === "issue" && call[1] === "create",
    );
    expect(createLabel).toBeGreaterThanOrEqual(0);
    expect(createIssue).toBeGreaterThan(createLabel);
  });

  it.each(["true", "false"])(
    "accepts GitHub CLI's empty successful label search for lag=%s",
    (lag) => {
      const result = runStep("incident", {
        lag,
        incidentProd: lag === "false" ? mainSha : oldSha,
        emptyLabelResult: true,
      });
      expect(result.status, result.stderr).toBe(0);
      expect(result.calls.some((call) => call[0] === "label" && call[1] === "create")).toBe(true);
      expect(result.calls.some((call) => call[0] === "issue" && call[1] === "create")).toBe(
        lag === "true",
      );
    },
  );

  it.each([
    ["failed label read", { labelReadError: true }],
    ["malformed label JSON", { labelBody: "[" }],
    ["wrong-shaped label JSON", { labelBody: "{}" }],
  ])("does not turn %s into a missing label", (_name, fixture) => {
    const result = runStep("incident", fixture);
    expect(result.status).toBe(1);
    expect(result.calls).toHaveLength(1);
  });

  it("still rejects empty issue JSON without mutating an incident", () => {
    const result = runStep("incident", { label: true, issueBody: "" });
    expect(result.status).toBe(1);
    expect(result.calls.every((call) => call[1] === "list")).toBe(true);
  });

  it.each([8, 40])(
    "resolves a %i-character production SHA to the complete main commit",
    (length) => {
      const result = runStep("check", { prodSha: mainSha.slice(0, length) });
      expect(result.status, result.stderr).toBe(0);
      expect(result.output).toContain(`prod_sha=${mainSha}\n`);
      expect(result.output).toContain("lag=false\n");
    },
  );

  it.each([
    ["missing commit", { body: '{"status":"ok","db":true}' }],
    ["malformed JSON", { body: "<html>error</html>" }],
    ["unhealthy HTTP", { httpError: true }],
    ["failed database", { body: JSON.stringify({ status: "error", db: false, commit: mainSha }) }],
    ["too-short prefix", { prodSha: "6fa346" }],
    ["newline in commit", { prodSha: "6fa3462\nlag=false" }],
    ["unknown commit", { prodSha: "fffffff" }],
    ["ambiguous prefix", { candidates: [mainSha, "6fa3462aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"] }],
    ["non-commit object", { objectType: "blob" }],
    ["different eighth character", { prodSha: "6fa3462a" }],
    ["missing main", { mainSha: "" }],
    ["future main timestamp", { ageSeconds: -3600 }],
  ])("fails closed for %s", (_name, fixture) => {
    const result = runStep("check", fixture as Record<string, unknown>);
    expect(result.status).toBe(1);
    expect(result.output).toBe("lag=unknown\n");
    expect(result.calls).toEqual([]);
  });

  it("reports a genuinely different, known production commit after the grace period", () => {
    const result = runStep("check", { prodSha: oldSha.slice(0, 8), ageSeconds: 10800 });
    expect(result.status, result.stderr).toBe(0);
    expect(result.output).toContain(`prod_sha=${oldSha}\n`);
    expect(result.output).toContain("lag=true\n");
  });

  it("does not equate two known commits sharing their first seven characters", () => {
    const different = `${mainSha.slice(0, 7)}a${mainSha.slice(8)}`;
    const result = runStep("check", {
      prodSha: different.slice(0, 8),
      candidates: [different],
    });
    expect(result.status, result.stderr).toBe(0);
    expect(result.output).toContain(`prod_sha=${different}\n`);
    expect(result.output).toContain("lag=true\n");
  });

  it("keeps a recent mismatch pending instead of claiming synchronization", () => {
    const result = runStep("check", { prodSha: oldSha, ageSeconds: 60 });
    expect(result.status, result.stderr).toBe(0);
    expect(result.output).toContain("lag=pending\n");
    const incident = runStep("incident", { lag: "pending", existing: 42 });
    expect(incident.status, incident.stderr).toBe(0);
    expect(incident.calls).toEqual([]);
  });

  it("never modifies an existing label and updates the same incident", () => {
    const result = runStep("incident", { label: true, existing: 42 });
    expect(result.status, result.stderr).toBe(0);
    expect(result.calls.some((call) => call[1] === "create")).toBe(false);
    expect(result.calls.some((call) => call[1] === "comment" && call[2] === "42")).toBe(true);
  });

  it("accepts a label creation race only after confirming the label exists", () => {
    const result = runStep("incident", { labelRace: true });
    expect(result.status, result.stderr).toBe(0);
    expect(result.calls.filter((call) => call[0] === "label" && call[1] === "list")).toHaveLength(
      2,
    );
    expect(result.calls.some((call) => call[0] === "issue" && call[1] === "create")).toBe(true);
  });

  it("does not conceal failed label creation or proceed to issue mutation", () => {
    const result = runStep("incident", { labelFailure: true });
    expect(result.status).toBe(1);
    expect(result.calls.some((call) => call[0] === "issue")).toBe(false);
  });

  it("closes an existing incident only on confirmed equality", () => {
    const result = runStep("incident", {
      lag: "false",
      incidentProd: mainSha,
      label: true,
      existing: 42,
    });
    expect(result.status, result.stderr).toBe(0);
    expect(result.calls.some((call) => call[1] === "close" && call[2] === "42")).toBe(true);
    const unknown = runStep("incident", { lag: "unknown", existing: 42 });
    expect(unknown.status).toBe(1);
    expect(unknown.calls).toEqual([]);
    const contradictory = runStep("incident", { lag: "false", existing: 42 });
    expect(contradictory.status).toBe(1);
    expect(contradictory.calls).toEqual([]);
  });
});
