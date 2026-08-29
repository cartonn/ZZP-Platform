import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import {
  MAINTENANCE_ALERT,
  METRICS_PATH,
  type AlertmanagerRoute,
  collectRouteReceivers,
  definedAlertNames,
  definedSeverities,
  referencedAlertNames,
  routedSeverities,
  extractMetricsPath,
  loadsRuleFile,
} from "./monitoring-bundle";

// Drift-gate: klinkt de drie bestanden van de monitoring drop-in bundle aan elkaar vast.
//   - alerts.yml       definieert de alerts.
//   - prometheus.yml   scraped /api/metrics en laadt alerts.yml via rule_files.
//   - alertmanager.yml routeert + dempt die alerts tijdens onderhoud (inhibit_rules).
// Breekt bij: een inhibit-referentie naar een niet-bestaande alert (dode demping), een nieuwe alert
// die niet in de onderhouds-inhibitie zit (paget stil tijdens een deploy), of een scrape-config die
// niet meer naar /api/metrics wijst / alerts.yml niet laadt.

const OBS_DIR = join(process.cwd(), "docs", "observability");
const alertsText = readFileSync(join(OBS_DIR, "alerts.yml"), "utf8");
const prometheusText = readFileSync(join(OBS_DIR, "prometheus.yml"), "utf8");
const alertmanagerText = readFileSync(join(OBS_DIR, "alertmanager.yml"), "utf8");

const definedAlerts = definedAlertNames(alertsText);

interface AmMatcherRule {
  source_matchers?: string[];
  target_matchers?: string[];
}
interface AlertmanagerDoc {
  route?: AlertmanagerRoute;
  receivers?: { name: string }[];
  inhibit_rules?: AmMatcherRule[];
}
const amDoc = parse(alertmanagerText) as AlertmanagerDoc;

/** Zzp*-namen uit een lijst matchers (source_matchers/target_matchers). */
function namesFromMatchers(matchers: string[] | undefined): Set<string> {
  return referencedAlertNames((matchers ?? []).join("\n"));
}

describe("alerts.yml — bron van alertnamen", () => {
  it("definieert een niet-lege, met de token-scan consistente set alerts", () => {
    expect(definedAlerts.size).toBeGreaterThan(0);
    // Elke via `alert:` gedefinieerde naam wordt ook door de generieke Zzp*-scan gevonden.
    for (const name of definedAlerts) {
      expect(referencedAlertNames(name).has(name)).toBe(true);
    }
  });

  it("bevat de onderhouds-inhibitiebron ZzpMaintenanceModeOn", () => {
    expect(definedAlerts.has(MAINTENANCE_ALERT)).toBe(true);
  });
});

describe("prometheus.yml — scrape-config", () => {
  it("scraped exact het metrics-endpoint", () => {
    expect(extractMetricsPath(prometheusText)).toBe(METRICS_PATH);
  });

  it("laadt de alerting-rules via rule_files", () => {
    expect(loadsRuleFile(prometheusText, "alerts.yml")).toBe(true);
  });

  it("gebruikt bearer-auth zonder de secret in het bestand te plakken", () => {
    expect(prometheusText).toMatch(/type:\s*Bearer/);
    // De secret hoort via credentials_file te komen, niet als kale `credentials:`-waarde in git.
    expect(prometheusText).toMatch(/credentials_file:/);
    expect(prometheusText).not.toMatch(/^\s*credentials:\s*\S/m);
  });
});

describe("alertmanager.yml — routing + inhibitie", () => {
  it("parseert naar een geldig route/receivers/inhibit_rules-skelet", () => {
    expect(amDoc.route?.receiver).toBeTruthy();
    expect(Array.isArray(amDoc.receivers)).toBe(true);
    expect(amDoc.receivers?.length).toBeGreaterThan(0);
    expect(Array.isArray(amDoc.inhibit_rules)).toBe(true);
    expect(amDoc.inhibit_rules?.length).toBeGreaterThan(0);
  });

  it("de route-receiver bestaat als gedefinieerde receiver", () => {
    const receiverNames = new Set((amDoc.receivers ?? []).map((r) => r.name));
    expect(receiverNames.has(amDoc.route?.receiver ?? "")).toBe(true);
  });

  it("ELKE receiver in de route-boom (ook geneste subroutes) is gedefinieerd", () => {
    const receiverNames = new Set((amDoc.receivers ?? []).map((r) => r.name));
    const used = collectRouteReceivers(amDoc.route);
    expect(used.size, "route-boom refereert geen enkele receiver").toBeGreaterThan(0);
    const undefinedReceivers = [...used].filter((n) => !receiverNames.has(n)).sort();
    expect(
      undefinedReceivers,
      `subroute(s) verwijzen naar niet-gedefinieerde receiver(s) → Alertmanager weigert de hele config: ${undefinedReceivers.join(", ")}`,
    ).toEqual([]);
  });

  it("kritieke alerts houden een eigen route (paging niet stil in de trage default-bucket)", () => {
    const usesCritical = /severity:\s*critical/.test(alertsText);
    expect(usesCritical, "alerts.yml definieert geen critical alert meer — pas deze gate aan").toBe(
      true,
    );
    expect(
      routedSeverities(amDoc.route).has("critical"),
      "geen dedicated route voor severity=critical → kritieke paging valt in de trage default-bucket",
    ).toBe(true);
  });

  it("elke severity waarop een route matcht bestaat als severity in alerts.yml (geen dode matcher)", () => {
    const defined = definedSeverities(alertsText);
    expect(defined.has("critical"), "alerts.yml declareert geen severity-labels meer").toBe(true);
    const routed = [...routedSeverities(amDoc.route)];
    const orphaned = routed.filter((s) => !defined.has(s)).sort();
    expect(
      orphaned,
      `route matcht op severity die geen enkele alert draagt (dode/vertypte matcher): ${orphaned.join(", ")}`,
    ).toEqual([]);
  });

  it("elke gerefereerde Zzp*-alertnaam bestaat écht in alerts.yml (geen dode demping)", () => {
    const dangling = [...referencedAlertNames(alertmanagerText)].filter(
      (n) => !definedAlerts.has(n),
    );
    expect(dangling, `dode/hernoemde alert-referentie(s): ${dangling.join(", ")}`).toEqual([]);
  });

  it("de onderhouds-inhibitie heeft ZzpMaintenanceModeOn als bron", () => {
    const maintenanceRule = (amDoc.inhibit_rules ?? []).find((r) =>
      namesFromMatchers(r.source_matchers).has(MAINTENANCE_ALERT),
    );
    expect(maintenanceRule, "geen inhibit_rule met ZzpMaintenanceModeOn als bron").toBeTruthy();
  });

  it("de onderhouds-inhibitie dempt ELKE operationele alert (op de onderhoudsalert zelf na)", () => {
    const maintenanceRule = (amDoc.inhibit_rules ?? []).find((r) =>
      namesFromMatchers(r.source_matchers).has(MAINTENANCE_ALERT),
    );
    const targets = namesFromMatchers(maintenanceRule?.target_matchers);
    // Verwacht: alle gedefinieerde alerts behalve de bron (ZzpMaintenanceModeOn) zelf.
    const expected = [...definedAlerts].filter((n) => n !== MAINTENANCE_ALERT).sort();
    const missing = expected.filter((n) => !targets.has(n));
    expect(
      missing,
      `alert(s) niet gedekt door de onderhouds-inhibitie → paget alsnog tijdens onderhoud: ${missing.join(", ")}`,
    ).toEqual([]);
    // De bron mag zichzelf niet dempen (de onderhoudsalert moet zichtbaar blijven).
    expect(targets.has(MAINTENANCE_ALERT)).toBe(false);
  });
});
