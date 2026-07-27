import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import { INFO_ONLY_METRICS, knownMetricNames, referencedMetricNames } from "./alerts-rules";

// Drift-gate: klinkt docs/observability/alerts.yml vast aan de gauges die /api/metrics écht exposeert
// (buildMetrics). Breekt bij (a) een dode alert-referentie naar een hernoemde/verwijderde gauge en
// (b) een nieuwe gauge zonder alert of bewuste info-markering.

const RULES_PATH = join(process.cwd(), "docs", "observability", "alerts.yml");
const rulesText = readFileSync(RULES_PATH, "utf8");

interface Rule {
  alert?: string;
  expr?: string;
  for?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}
interface RuleGroup {
  name: string;
  rules: Rule[];
}
interface RulesDoc {
  groups: RuleGroup[];
}

const doc = parse(rulesText) as RulesDoc;
const allRules: Rule[] = doc.groups.flatMap((g) => g.rules);

/** `zzp_*`-namen die uitsluitend in `expr`-velden voorkomen (de daadwerkelijke alarmcondities). */
function exprReferencedNames(): Set<string> {
  const names = new Set<string>();
  for (const rule of allRules) {
    for (const token of rule.expr?.match(/zzp_[a-z0-9_]+/g) ?? []) {
      names.add(token);
    }
  }
  return names;
}

describe("alerts.yml — structuur", () => {
  it("parseert naar niet-lege regelgroepen", () => {
    expect(doc.groups.length).toBeGreaterThan(0);
    expect(allRules.length).toBeGreaterThan(0);
  });

  it("elke alert heeft naam, expr, severity-label en summary+description-annotatie", () => {
    for (const rule of allRules) {
      expect(rule.alert, `regel zonder naam: ${JSON.stringify(rule)}`).toBeTruthy();
      expect(rule.expr, `alert ${rule.alert} zonder expr`).toBeTruthy();
      expect(rule.labels?.severity, `alert ${rule.alert} zonder severity-label`).toBeTruthy();
      expect(["critical", "warning", "info"], `alert ${rule.alert} onbekende severity`).toContain(
        rule.labels?.severity,
      );
      expect(rule.annotations?.summary, `alert ${rule.alert} zonder summary`).toBeTruthy();
      expect(rule.annotations?.description, `alert ${rule.alert} zonder description`).toBeTruthy();
    }
  });

  it("elke alert heeft een `for:`-duur (dempt flap/nooit-gedraaid-transients)", () => {
    for (const rule of allRules) {
      expect(rule.for, `alert ${rule.alert} zonder for-duur`).toMatch(/^\d+[smhd]$/);
    }
  });

  it("alle alert-namen zijn uniek", () => {
    const names = allRules.map((r) => r.alert);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("alerts.yml — drift-gate tegen buildMetrics", () => {
  it("elke gerefereerde zzp_*-naam (ook in comments/annotaties) bestaat als gauge", () => {
    const known = knownMetricNames();
    const dangling = [...referencedMetricNames(rulesText)].filter((n) => !known.has(n));
    expect(dangling, `dode/hernoemde metric-referentie(s): ${dangling.join(", ")}`).toEqual([]);
  });

  it("elke geëxposeerde gauge is gedekt door een alert-expr óf staat in INFO_ONLY_METRICS", () => {
    const covered = exprReferencedNames();
    const uncovered = [...knownMetricNames()].filter(
      (name) => !covered.has(name) && !INFO_ONLY_METRICS.has(name),
    );
    expect(
      uncovered,
      `gauge(s) zonder alert en niet als info gemarkeerd: ${uncovered.join(", ")}`,
    ).toEqual([]);
  });

  it("INFO_ONLY_METRICS bevat alleen echte gauges (geen dode markering)", () => {
    const known = knownMetricNames();
    const stale = [...INFO_ONLY_METRICS].filter((n) => !known.has(n));
    expect(stale, `INFO_ONLY verwijst naar onbekende gauge(s): ${stale.join(", ")}`).toEqual([]);
  });

  it("elke alert-expr verwijst naar minstens één bekende gauge", () => {
    const known = knownMetricNames();
    for (const rule of allRules) {
      const names = [...(rule.expr?.match(/zzp_[a-z0-9_]+/g) ?? [])];
      expect(names.length, `alert ${rule.alert} verwijst naar geen enkele gauge`).toBeGreaterThan(
        0,
      );
      for (const name of names) {
        expect(known.has(name), `alert ${rule.alert} → onbekende gauge ${name}`).toBe(true);
      }
    }
  });
});
