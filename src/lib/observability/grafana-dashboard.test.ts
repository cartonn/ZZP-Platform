import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildDashboard } from "../../../scripts/grafana-dashboard.mjs";
import { knownMetricNames } from "./alerts-rules";

// Drift-gate: klinkt het Grafana-dashboard (docs/observability/grafana-dashboard.json) vast aan
//   (a) de generator (scripts/grafana-dashboard.mjs) — de gecommitte JSON MOET byte-identiek zijn aan
//       de generator-uitvoer, zodat een handmatige edit die niet via de generator loopt de poort breekt;
//   (b) de gauges die /api/metrics écht exposeert (buildMetrics via knownMetricNames) — geen dood
//       paneel naar een hernoemde/verwijderde gauge, en geen nieuwe gauge zonder paneel.
// Zelfde patroon als alerts-rules.test.ts / monitoring-bundle.test.ts.

const DASHBOARD_PATH = join(process.cwd(), "docs", "observability", "grafana-dashboard.json");
const committedText = readFileSync(DASHBOARD_PATH, "utf8");
const dashboard = buildDashboard();

interface Target {
  expr?: string;
  refId?: string;
}
interface Panel {
  id: number;
  type: string;
  title?: string;
  targets?: Target[];
  panels?: Panel[];
  datasource?: unknown;
  gridPos?: { x: number; y: number; w: number; h: number };
}

/** Alle panelen (ook geneste in een rij), platgeslagen. */
function allPanels(panels: Panel[]): Panel[] {
  return panels.flatMap((p) => [p, ...(p.panels ? allPanels(p.panels) : [])]);
}

const panels = allPanels(dashboard.panels as Panel[]);
const contentPanels = panels.filter((p) => p.type !== "row");

/** `zzp_*`-namen die in een paneel-target-`expr` voorkomen (de daadwerkelijk getoonde gauges). */
function exprReferencedNames(): Set<string> {
  const names = new Set<string>();
  for (const panel of contentPanels) {
    for (const target of panel.targets ?? []) {
      for (const token of target.expr?.match(/zzp_[a-z0-9_]+/g) ?? []) {
        names.add(token);
      }
    }
  }
  return names;
}

describe("grafana-dashboard.json — generator-synchronisatie", () => {
  it("de gecommitte JSON heeft exact dezelfde inhoud als de generator-uitvoer", () => {
    // Content-gelijkheid (geparsed, formatting-onafhankelijk): faalt zodra iemand een paneel/expr/titel
    // met de hand wijzigt i.p.v. via de generator (`node scripts/grafana-dashboard.mjs --write`). Eén
    // bron van waarheid. De byte-formatting is bewust NIET hier vastgeklonken — die is van Prettier
    // (CI-poort `prettier --check .`), zodat de twee poorten elkaar niet tegenspreken.
    expect(JSON.parse(committedText)).toEqual(buildDashboard());
  });

  it("parseert naar geldig JSON met de verwachte top-level-structuur", () => {
    const parsed = JSON.parse(committedText);
    expect(parsed.title).toBeTruthy();
    expect(parsed.uid).toBeTruthy();
    expect(typeof parsed.schemaVersion).toBe("number");
    expect(Array.isArray(parsed.panels)).toBe(true);
    expect(parsed.panels.length).toBeGreaterThan(0);
  });
});

describe("grafana-dashboard.json — structuur", () => {
  it("bevat minstens één rij-paneel als sectiescheiding", () => {
    expect(panels.some((p) => p.type === "row")).toBe(true);
  });

  it("elk inhoudelijk paneel heeft een titel, een datasource en minstens één target", () => {
    for (const panel of contentPanels) {
      expect(panel.title, `paneel ${panel.id} zonder titel`).toBeTruthy();
      expect(panel.datasource, `paneel ${panel.title} zonder datasource`).toBeTruthy();
      expect((panel.targets ?? []).length, `paneel ${panel.title} zonder targets`).toBeGreaterThan(
        0,
      );
    }
  });

  it("elke target heeft een expr en een refId", () => {
    for (const panel of contentPanels) {
      for (const target of panel.targets ?? []) {
        expect(target.expr, `target in ${panel.title} zonder expr`).toBeTruthy();
        expect(target.refId, `target in ${panel.title} zonder refId`).toBeTruthy();
      }
    }
  });

  it("alle paneel-id's zijn uniek", () => {
    const ids = panels.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("grafana-dashboard.json — drift-gate tegen buildMetrics", () => {
  it("elke gerefereerde zzp_*-naam bestaat als geëxposeerde gauge (geen dood paneel)", () => {
    const known = knownMetricNames();
    const dangling = [...exprReferencedNames()].filter((n) => !known.has(n));
    expect(dangling, `dode/hernoemde gauge-referentie(s): ${dangling.join(", ")}`).toEqual([]);
  });

  it("elke geëxposeerde gauge komt in minstens één paneel voor (geen blinde vlek)", () => {
    const shown = exprReferencedNames();
    const uncovered = [...knownMetricNames()].filter((n) => !shown.has(n));
    expect(uncovered, `gauge(s) zonder paneel op het dashboard: ${uncovered.join(", ")}`).toEqual(
      [],
    );
  });
});
