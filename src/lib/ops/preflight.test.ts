import { describe, expect, it } from "vitest";
import type { StatusGroup, SystemStatus } from "@/lib/system-status";
import { buildPreflightReport, decideVerdict, invalidReport, statusTag } from "@/lib/ops/preflight";

function makeStatus(overrides: Partial<SystemStatus> = {}): SystemStatus {
  const groups: StatusGroup[] = overrides.groups ?? [
    {
      title: "Opslag & data",
      items: [
        {
          key: "database",
          label: "Database",
          mode: "PostgreSQL",
          level: "ok",
          detail: "Managed PostgreSQL — geschikt voor productie.",
        },
      ],
    },
  ];
  const counts = overrides.counts ?? countLevels(groups);
  return {
    production: overrides.production ?? true,
    groups,
    warnings: overrides.warnings ?? [],
    counts,
  };
}

function countLevels(groups: StatusGroup[]): SystemStatus["counts"] {
  const counts = { ok: 0, fallback: 0, attention: 0 };
  for (const g of groups) for (const i of g.items) counts[i.level] += 1;
  return counts;
}

describe("statusTag", () => {
  it("mapt elk niveau op een vaste-breedte ASCII-tag", () => {
    expect(statusTag("ok")).toBe("[ ok ]");
    expect(statusTag("attention")).toBe("[ !! ]");
    expect(statusTag("fallback")).toBe("[info]");
    // Alle tags even lang → uitlijning in het rapport.
    expect(statusTag("ok").length).toBe(statusTag("attention").length);
    expect(statusTag("ok").length).toBe(statusTag("fallback").length);
  });
});

describe("decideVerdict", () => {
  it("GO (exit 0) zonder aandacht en zonder waarschuwingen", () => {
    const status = makeStatus({ counts: { ok: 3, fallback: 2, attention: 0 }, warnings: [] });
    expect(decideVerdict(status, { strict: false })).toEqual({ verdict: "go", exitCode: 0 });
    expect(decideVerdict(status, { strict: true })).toEqual({ verdict: "go", exitCode: 0 });
  });

  it("attention-item: adviserend zonder strict (exit 0), blokkeert met strict (exit 1)", () => {
    const status = makeStatus({ counts: { ok: 1, fallback: 0, attention: 1 }, warnings: [] });
    expect(decideVerdict(status, { strict: false })).toEqual({
      verdict: "attention",
      exitCode: 0,
    });
    expect(decideVerdict(status, { strict: true })).toEqual({ verdict: "attention", exitCode: 1 });
  });

  it("boot-waarschuwing telt óók als aandachtspunt (ook zonder attention-item)", () => {
    const status = makeStatus({
      counts: { ok: 2, fallback: 1, attention: 0 },
      warnings: ["STORAGE_DRIVER staat op local"],
    });
    expect(decideVerdict(status, { strict: false })).toEqual({
      verdict: "attention",
      exitCode: 0,
    });
    expect(decideVerdict(status, { strict: true })).toEqual({ verdict: "attention", exitCode: 1 });
  });
});

describe("buildPreflightReport", () => {
  it("rendert kop, groepen, samenvatting en een GO-oordeel", () => {
    const report = buildPreflightReport(makeStatus(), { strict: false });
    expect(report.verdict).toBe("go");
    expect(report.exitCode).toBe(0);
    const text = report.lines.join("\n");
    expect(text).toContain("go-live preflight");
    expect(text).toContain("Opslag & data");
    expect(text).toContain("[ ok ] Database: PostgreSQL");
    expect(text).toContain("Samenvatting:");
    expect(text).toContain("GO —");
  });

  it("toont de toelichting alleen bij attention-items (rustig rapport)", () => {
    const groups: StatusGroup[] = [
      {
        title: "Test",
        items: [
          { key: "a", label: "A", mode: "s3", level: "ok", detail: "ok-detail-verborgen" },
          { key: "b", label: "B", mode: "local", level: "attention", detail: "doe-dit-detail" },
        ],
      },
    ];
    const report = buildPreflightReport(makeStatus({ groups }), { strict: false });
    const text = report.lines.join("\n");
    expect(text).toContain("→ doe-dit-detail");
    expect(text).not.toContain("ok-detail-verborgen");
    expect(report.verdict).toBe("attention");
  });

  it("somt boot-waarschuwingen op en meldt het aantal in de samenvatting", () => {
    const report = buildPreflightReport(
      makeStatus({ warnings: ["AUTH_URL ontbreekt", "SENTRY_DSN ontbreekt"] }),
      { strict: true },
    );
    const text = report.lines.join("\n");
    expect(text).toContain("Boot-waarschuwingen (2):");
    expect(text).toContain("- AUTH_URL ontbreekt");
    expect(text).toContain("2 waarschuwing(en)");
    expect(report.exitCode).toBe(1); // strict + waarschuwing → NO-GO-poort
  });

  it("markeert een niet-productie-omgeving in de kop", () => {
    const report = buildPreflightReport(makeStatus({ production: false }), { strict: false });
    expect(report.lines.join("\n")).toContain("niet-productie");
  });

  it("lekt nooit een sleutelwaarde: het rapport bevat alleen de meegegeven modi/labels", () => {
    // Het rapport wordt volledig uit de SystemStatus opgebouwd (driver-modi + labels), nooit uit
    // ruwe env-waarden. Een secret dat toevallig in process.env staat, kan hier niet in belanden.
    const groups: StatusGroup[] = [
      {
        title: "Beveiliging",
        items: [
          {
            key: "share-token-secret",
            label: "Deel-token-sleutel",
            mode: "eigen sleutel",
            level: "ok",
            detail: "Eigen SHARE_TOKEN_SECRET.",
          },
        ],
      },
    ];
    const report = buildPreflightReport(makeStatus({ groups }), { strict: false });
    const text = report.lines.join("\n");
    expect(text).toContain("Deel-token-sleutel: eigen sleutel");
    // Geen enkele lange, op een secret lijkende token-string.
    expect(text).not.toMatch(/[A-Za-z0-9+/]{32,}={0,2}/);
  });
});

describe("invalidReport", () => {
  it("geeft NO-GO + exit 2 en neemt de foutboodschap mee", () => {
    const report = invalidReport("  - AUTH_SECRET: minimaal 32 tekens");
    expect(report.verdict).toBe("invalid");
    expect(report.exitCode).toBe(2);
    const text = report.lines.join("\n");
    expect(text).toContain("NO-GO —");
    expect(text).toContain("AUTH_SECRET: minimaal 32 tekens");
  });
});
