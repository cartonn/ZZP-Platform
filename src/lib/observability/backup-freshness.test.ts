import { describe, expect, it } from "vitest";
import { evaluateBackupFreshness, backupFreshnessStatusItem } from "./backup-freshness";

const NOW = new Date("2026-07-19T12:00:00.000Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 60 * 60 * 1000);

describe("evaluateBackupFreshness", () => {
  it("meldt 'never' zonder heartbeat", () => {
    const f = evaluateBackupFreshness(null, null, NOW, 48);
    expect(f.status).toBe("never");
    expect(f.ageHours).toBeNull();
    expect(f.maxAgeHours).toBe(48);
  });

  it("meldt 'fresh' binnen het venster met een geslaagde back-up", () => {
    const f = evaluateBackupFreshness(hoursAgo(6), true, NOW, 48);
    expect(f.status).toBe("fresh");
    expect(f.ageHours).toBe(6);
  });

  it("meldt 'warning' binnen het venster maar met een mislukte back-up", () => {
    const f = evaluateBackupFreshness(hoursAgo(3), false, NOW, 48);
    expect(f.status).toBe("warning");
  });

  it("meldt 'stale' zodra de laatste melding ouder is dan het venster", () => {
    const f = evaluateBackupFreshness(hoursAgo(60), true, NOW, 48);
    expect(f.status).toBe("stale");
    expect(f.ageHours).toBe(60);
  });

  it("behandelt een melding 'in de toekomst' als leeftijd 0 (klok-scheefstand)", () => {
    const f = evaluateBackupFreshness(new Date(NOW.getTime() + 3_600_000), true, NOW, 48);
    expect(f.status).toBe("fresh");
    expect(f.ageHours).toBe(0);
  });
});

describe("backupFreshnessStatusItem", () => {
  it("never → attention met configuratie-hint", () => {
    const item = backupFreshnessStatusItem(evaluateBackupFreshness(null, null, NOW, 48));
    expect(item.key).toBe("backup-heartbeat");
    expect(item.level).toBe("attention");
    expect(item.mode).toBe("nog nooit gemeld");
    expect(item.detail).toContain("/api/backups/heartbeat");
  });

  it("fresh → ok", () => {
    const item = backupFreshnessStatusItem(evaluateBackupFreshness(hoursAgo(6), true, NOW, 48));
    expect(item.level).toBe("ok");
    expect(item.mode).toBe("6 uur geleden");
  });

  it("warning → attention (gemeld maar mislukt)", () => {
    const item = backupFreshnessStatusItem(evaluateBackupFreshness(hoursAgo(3), false, NOW, 48));
    expect(item.level).toBe("attention");
    expect(item.detail).toContain("fout");
  });

  it("stale → attention (schema lijkt gestopt)", () => {
    const item = backupFreshnessStatusItem(evaluateBackupFreshness(hoursAgo(60), true, NOW, 48));
    expect(item.level).toBe("attention");
    expect(item.detail).toContain("48 uur");
  });

  it("toont '< 1 uur' voor een verse melding binnen het uur", () => {
    const item = backupFreshnessStatusItem(evaluateBackupFreshness(hoursAgo(0.5), true, NOW, 48));
    expect(item.mode).toBe("< 1 uur geleden");
  });

  it("bevat nooit geheimen — alleen tijd/oordeel", () => {
    const item = backupFreshnessStatusItem(evaluateBackupFreshness(hoursAgo(6), true, NOW, 48));
    expect(item.detail).not.toMatch(/secret|token|password|CRON_SECRET=/i);
  });
});
