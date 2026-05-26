// Env-documentatiecheck: elke `process.env.X` die de code gebruikt moet in .env.example staan
// (zodat nieuwe medewerkers/CI weten wat ze moeten zetten). Next-interne vars zijn uitgesloten.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const example = readFileSync(join(root, ".env.example"), "utf8");
const IGNORE = new Set(["NEXT_RUNTIME", "NODE_ENV", "CI", "PW_CHANNEL", "AUTH_URL"]);

const used = new Set();
function collect(text) {
  for (const m of text.matchAll(/process\.env\.([A-Z0-9_]+)/g)) used.add(m[1]);
}
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx|mjs|js)$/.test(entry)) collect(readFileSync(p, "utf8"));
  }
}
walk(join(root, "src"));
collect(readFileSync(join(root, "next.config.mjs"), "utf8"));

const missing = [...used].filter((v) => !IGNORE.has(v) && !example.includes(v));
if (missing.length) {
  console.error("[check:env] FOUT — niet gedocumenteerd in .env.example:\n" + missing.map((v) => "  - " + v).join("\n"));
  process.exit(1);
}
console.log(`[check:env] OK — ${used.size} env-var(s) gebruikt, alle gedocumenteerd of uitgesloten.`);
