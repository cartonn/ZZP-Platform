import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

const fullSha = /^[a-f0-9]{40}$/;
const command = (binary, args) =>
  execFileSync(binary, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

// Resolve the complete object ID, rejecting ambiguous prefixes (including blob/tag collisions).
function resolveCommit(value) {
  if (typeof value !== "string" || !/^[a-fA-F0-9]{7,40}$/.test(value)) {
    throw new Error("Ontbrekende of ongeldige productiecommit.");
  }
  const prefix = value.toLowerCase();
  const matches = command("git", ["rev-parse", `--disambiguate=${prefix}`]).split("\n");
  if (
    matches.length !== 1 ||
    !fullSha.test(matches[0]) ||
    !matches[0].startsWith(prefix) ||
    command("git", ["cat-file", "-t", matches[0]]) !== "commit"
  ) {
    throw new Error("Productiecommit is onbekend of niet eenduidig als commit te herleiden.");
  }
  return matches[0];
}

function compare() {
  let result = { lag: "unknown" };
  try {
    const main = command("git", ["rev-parse", "--verify", "origin/main^{commit}"]);
    const epoch = Number(command("git", ["log", "-1", "--format=%ct", "origin/main"]));
    const age = Math.floor(Date.now() / 1000) - epoch;
    if (!fullSha.test(main) || !Number.isSafeInteger(epoch) || epoch <= 0 || age < 0) {
      throw new Error("Main-commit of committijd ontbreekt of is ongeldig.");
    }
    const health = JSON.parse(
      command("curl", [
        "--fail",
        "--silent",
        "--show-error",
        "--max-time",
        "15",
        process.env.HEALTH_URL,
      ]),
    );
    if (health?.status !== "ok" || health?.db !== true) {
      throw new Error("Health bevestigt geen gezonde productiebuild.");
    }
    const production = resolveCommit(health.commit);
    result = {
      main_sha: main,
      prod_sha: production,
      age_hours: String(Math.floor(age / 3600)),
      lag: main === production ? "false" : age >= 10800 ? "true" : "pending",
    };
    console.log(`main=${main} · productie=${production} · status=${result.lag}`);
  } catch {
    // Unknown must not become a green run or close a previous incident.
    console.error(
      "Geen betrouwbaar deploy-oordeel: controleer health, commitresolutie en Git-historie.",
    );
    process.exitCode = 1;
  }
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    Object.entries(result)
      .map(([key, value]) => `${key}=${value}\n`)
      .join(""),
  );
}

function incident() {
  const {
    REPO: repo,
    LAG: lag,
    MAIN_SHA: main,
    PROD_SHA: production,
    AGE_HOURS: age,
  } = process.env;
  if (
    !repo ||
    !fullSha.test(main ?? "") ||
    !fullSha.test(production ?? "") ||
    !/^\d+$/.test(age ?? "") ||
    !["true", "false", "pending"].includes(lag) ||
    (lag === "false" ? main !== production : main === production) ||
    (lag === "true" && Number(age) < 3)
  ) {
    throw new Error("Geen geldige, bevestigde vergelijkingsuitkomst voor incidentafhandeling.");
  }
  if (lag === "pending") {
    console.log("Deploy binnen de respijtperiode; een bestaand incident blijft open.");
    return;
  }

  const gh = (...args) => command("gh", [...args, "--repo", repo]);
  const hasLabel = () => {
    const output = gh(
      "label",
      "list",
      "--search",
      "deploy-lag",
      "--limit",
      "100",
      "--json",
      "name",
    );
    // A successful gh label search with no matches returns empty stdout, even with --json.
    // Keep this exception local: command failures and malformed nonempty JSON must still fail.
    const labels = output === "" ? [] : JSON.parse(output);
    return labels.some((label) => label.name.toLowerCase() === "deploy-lag");
  };
  if (!hasLabel()) {
    try {
      gh(
        "label",
        "create",
        "deploy-lag",
        "--color",
        "D93F0B",
        "--description",
        "Productie wijkt af van main",
      );
    } catch (error) {
      // Another run/operator may have created it; verify existence, never mask auth/network failures.
      if (!hasLabel()) throw error;
    }
  }
  const existing = JSON.parse(
    gh("issue", "list", "--label", "deploy-lag", "--state", "open", "--json", "number"),
  )[0]?.number;
  if (existing !== undefined && (!Number.isSafeInteger(existing) || existing <= 0)) {
    throw new Error("Ongeldig incidentnummer.");
  }
  if (lag === "true") {
    const body = `Productie draait commit \`${production}\`, terwijl \`origin/main\` bij \`${main}\` staat. De laatste main-commit is ${age} uur oud. Controleer de Railway-deploylogs en docs/RUNBOOK.md; dit meet de leeftijd van main, niet hoe lang het verschil al bestaat.`;
    if (existing) gh("issue", "comment", String(existing), "--body", body);
    else
      gh(
        "issue",
        "create",
        "--title",
        "Productie loopt achter op main",
        "--label",
        "deploy-lag",
        "--body",
        body,
      );
  } else if (existing) {
    gh(
      "issue",
      "comment",
      String(existing),
      "--body",
      `Productie loopt weer gelijk met main (commit \`${production}\`) — automatisch gesloten.`,
    );
    gh("issue", "close", String(existing));
  }
}

try {
  if (process.argv[2] === "check") compare();
  else if (process.argv[2] === "incident") incident();
  else throw new Error("Gebruik: deploy-lag-watchdog.mjs check|incident");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
