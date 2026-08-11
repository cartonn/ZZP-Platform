// Valideert de GitHub Actions-workflows: vooral dat de autonome bouwronde (auto-build) de
// main-flow volgt (checkout main → verse feature branch → PR naar main). Dit voorkomt het
// stille defect waardoor 24/7-bouwen niet werkte (de workflow wees naar een dode
// sessie-branch). Draaibaar via `node scripts/validate-workflows.mjs` of `npm run validate:ci`.
// Exit-code != 0 bij een probleem.

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import yaml from "js-yaml";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const wfDir = join(root, ".github", "workflows");

// Dode sessie-/verzamelbranches uit eerdere flows: mogen nergens meer voorkomen.
const DEAD_BRANCHES = ["dazzling-carson", "modest-babbage"];

const errors = [];
const ok = (msg) => console.log(`  ✓ ${msg}`);

function loadWorkflow(name) {
  const raw = readFileSync(join(wfDir, name), "utf8");
  return { raw, doc: yaml.load(raw) };
}

// 1. Alle workflows parsen zonder fouten.
const files = readdirSync(wfDir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
for (const f of files) {
  try {
    yaml.load(readFileSync(join(wfDir, f), "utf8"));
    ok(`${f} is geldige YAML`);
  } catch (e) {
    errors.push(`${f}: ongeldige YAML — ${e.message}`);
  }
}

// 2. auto-build.yml moet bestaan en de main-flow volgen.
try {
  const { raw, doc } = loadWorkflow("auto-build.yml");
  const on = doc?.on ?? doc?.true; // 'on' kan door YAML als boolean true worden geparsed
  if (!on) errors.push("auto-build.yml: geen 'on'-triggers gevonden");

  // workflow_dispatch + schedule aanwezig.
  if (on && !("workflow_dispatch" in on))
    errors.push("auto-build.yml: workflow_dispatch ontbreekt");
  else ok("workflow_dispatch aanwezig");
  if (on && !("schedule" in on)) errors.push("auto-build.yml: schedule ontbreekt");
  else ok("schedule aanwezig");

  // GELEERDE LES: claude-code-action crasht op een 'push'-event ("Unsupported event type: push").
  // Daarom mag auto-build NIET op push triggeren.
  if (on && "push" in on) {
    errors.push(
      "auto-build.yml: heeft een 'push'-trigger — die crasht de claude-code-action (Unsupported event type: push)",
    );
  } else {
    ok("geen push-trigger (voorkomt action-crash)");
  }

  // Main-flow: checkout vanaf main, en de PR gaat terug naar main.
  if (!/ref:\s*main\b/.test(raw)) {
    errors.push("auto-build.yml: checkt niet 'main' uit als bron (ref: main ontbreekt)");
  } else {
    ok("checkout vanaf main");
  }
  if (!raw.includes("--base main")) {
    errors.push("auto-build.yml: opent geen PR naar main (--base main ontbreekt)");
  } else {
    ok("PR-doel is main (--base main)");
  }

  // Mag NIET meer naar een dode sessie-branch wijzen.
  for (const dead of DEAD_BRANCHES) {
    if (raw.includes(dead)) {
      errors.push(`auto-build.yml: verwijst nog naar de dode branch '${dead}'`);
    }
  }
  ok("geen verwijzing naar dode sessie-branches");

  // De Anthropic-actie + token moeten erin zitten.
  if (!raw.includes("anthropic"))
    errors.push("auto-build.yml: geen Anthropic-actie/sleutel gevonden");
  else ok("Anthropic-bouwstap aanwezig");

  // De agent MOET files mogen wijzigen + bash draaien, anders pusht hij niets (geleerde les).
  if (!raw.includes("allowedTools") || !/Edit|Write|Bash/.test(raw)) {
    errors.push(
      "auto-build.yml: --allowedTools (Edit,Read,Write,Bash) ontbreekt — agent kan dan niets schrijven/pushen",
    );
  } else {
    ok("agent mag files wijzigen + bash draaien (--allowedTools)");
  }
} catch (e) {
  errors.push(`auto-build.yml ontbreekt of is onleesbaar — ${e.message}`);
}

// 3. De PR-poort moet de VOLLEDIGE Playwright-suite hard afdwingen. De vier geïsoleerde shards
// mogen geen continue-on-error gebruiken; de stabiele aggregatiejob `e2e` houdt de bestaande
// branch-protection-checknaam intact en wordt alleen groen als alle shards groen zijn.
try {
  const { raw, doc } = loadWorkflow("ci.yml");
  const shardJob = doc?.jobs?.["e2e-shard"];
  const gateJob = doc?.jobs?.e2e;

  if (!shardJob) {
    errors.push("ci.yml: e2e-shard-job ontbreekt");
  } else {
    ok("volledige e2e-shard-job aanwezig");
    if (shardJob["continue-on-error"] === true || /continue-on-error:\s*true/.test(raw)) {
      errors.push(
        "ci.yml: e2e mag niet continue-on-error zijn — dit zou de merge-poort verzachten",
      );
    } else {
      ok("e2e is een harde poort (geen continue-on-error)");
    }
    if (!/npx playwright test\s+--project=ci\b/.test(raw)) {
      errors.push(
        "ci.yml: draait niet de volledige Playwright-suite (--project=ci zonder specfilter)",
      );
    } else {
      ok("volledige Playwright-suite draait zonder specfilter");
    }
    if (!/--shard=\$\{\{\s*matrix\.shard\s*\}\}\/4/.test(raw)) {
      errors.push("ci.yml: volledige e2e-suite is niet over vier geïsoleerde shards verdeeld");
    } else {
      ok("e2e-suite is over vier shards verdeeld");
    }
  }

  if (!gateJob || gateJob.needs !== "e2e-shard") {
    errors.push("ci.yml: stabiele aggregatiejob 'e2e' moet afhangen van e2e-shard");
  } else {
    ok("verplichte checknaam e2e aggregeert alle shards");
  }
} catch (e) {
  errors.push(`ci.yml ontbreekt of is onleesbaar — ${e.message}`);
}

if (errors.length > 0) {
  console.error("\n✗ Workflow-validatie mislukt:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("\n✓ Workflows gevalideerd: auto-build volgt de main-flow.");
