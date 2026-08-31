// Unit-tests voor de pure auditlog-retentie-logica + de config-parser (opt-in + veilige vloer).

import { describe, it, expect } from "vitest";
import { auditRetentionCutoff } from "@/lib/audit-retention";
import {
  parseAuditRetentionDays,
  AUDIT_LOG_RETENTION_MIN_DAYS,
  AUDIT_LOG_RETENTION_DEFAULT_DAYS,
} from "@/lib/config";

const NOW = new Date("2026-07-14T12:00:00.000Z");

describe("parseAuditRetentionDays", () => {
  it("dwingt bij leeg/undefined fail-safe het beloofde 12-maandenvenster af (art. 5(1)(e))", () => {
    // Regressie: vóór de fix gaf een lege env 0 (onbeperkt bewaren) terug — het register belooft
    // 12 maanden, dus de default moet die bewaartermijn afdwingen, niet onbeperkt bewaren.
    expect(parseAuditRetentionDays(undefined)).toBe(AUDIT_LOG_RETENTION_DEFAULT_DAYS);
    expect(parseAuditRetentionDays("")).toBe(AUDIT_LOG_RETENTION_DEFAULT_DAYS);
    expect(parseAuditRetentionDays("   ")).toBe(AUDIT_LOG_RETENTION_DEFAULT_DAYS);
    expect(AUDIT_LOG_RETENTION_DEFAULT_DAYS).toBe(365);
  });

  it("zet retentie alleen uit bij een EXPLICIETE 0/negatieve operator-override", () => {
    expect(parseAuditRetentionDays("0")).toBe(0);
    expect(parseAuditRetentionDays("-5")).toBe(0);
  });

  it("valt bij onzin (niet-numeriek) terug op het beloofde venster i.p.v. stil uit te zetten", () => {
    // Een corrupte/typefout-waarde mag de bewaarplicht niet stil uitschakelen → fail-safe naar wissen.
    expect(parseAuditRetentionDays("abc")).toBe(AUDIT_LOG_RETENTION_DEFAULT_DAYS);
    expect(parseAuditRetentionDays("NaN")).toBe(AUDIT_LOG_RETENTION_DEFAULT_DAYS);
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
