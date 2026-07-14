// Unit-tests voor de pure auditlog-retentie-logica + de config-parser (opt-in + veilige vloer).

import { describe, it, expect } from "vitest";
import { auditRetentionCutoff } from "@/lib/audit-retention";
import { parseAuditRetentionDays, AUDIT_LOG_RETENTION_MIN_DAYS } from "@/lib/config";

const NOW = new Date("2026-07-14T12:00:00.000Z");

describe("parseAuditRetentionDays", () => {
  it("is standaard UIT (leeg/undefined = 0)", () => {
    expect(parseAuditRetentionDays(undefined)).toBe(0);
    expect(parseAuditRetentionDays("")).toBe(0);
    expect(parseAuditRetentionDays("   ")).toBe(0);
  });

  it("behandelt 0/negatief/onzin als uit", () => {
    expect(parseAuditRetentionDays("0")).toBe(0);
    expect(parseAuditRetentionDays("-5")).toBe(0);
    expect(parseAuditRetentionDays("abc")).toBe(0);
    expect(parseAuditRetentionDays("NaN")).toBe(0);
  });

  it("neemt een geldig venster over en kapt op hele dagen af", () => {
    expect(parseAuditRetentionDays("365")).toBe(365);
    expect(parseAuditRetentionDays("90.9")).toBe(90);
  });

  it("klemt een te lage waarde naar de minimumvloer (typefout-bescherming)", () => {
    expect(parseAuditRetentionDays("3")).toBe(AUDIT_LOG_RETENTION_MIN_DAYS);
    expect(parseAuditRetentionDays("29")).toBe(AUDIT_LOG_RETENTION_MIN_DAYS);
    expect(parseAuditRetentionDays("30")).toBe(30);
  });
});

describe("auditRetentionCutoff", () => {
  it("geeft null als retentie uit staat", () => {
    expect(auditRetentionCutoff(0, NOW)).toBeNull();
    expect(auditRetentionCutoff(-1, NOW)).toBeNull();
    expect(auditRetentionCutoff(Number.NaN, NOW)).toBeNull();
  });

  it("berekent de afkapdatum als now minus het venster", () => {
    const cutoff = auditRetentionCutoff(365, NOW);
    expect(cutoff).toEqual(new Date("2025-07-14T12:00:00.000Z"));
  });

  it("een regel op de cutoff-grens valt niet buiten het venster (strikt kleiner-dan wist)", () => {
    // 30 dagen terug vanaf NOW
    const cutoff = auditRetentionCutoff(30, NOW)!;
    expect(cutoff).toEqual(new Date("2026-06-14T12:00:00.000Z"));
  });
});
