import { describe, expect, it } from "vitest";
import { evaluateCronFreshness, cronFreshnessStatusItem } from "./cron-freshness";

const NOW = new Date("2026-07-17T12:00:00.000Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 60 * 60 * 1000);

describe("evaluateCronFreshness", () => {
  it("meldt 'never' zonder heartbeat", () => {
    const f = evaluateCronFreshness(null, null, NOW, 36);
    expect(f.status).toBe("never");
    expect(f.lastRunAt).toBeNull();
    expect(f.lastOk).toBeNull();
    expect(f.ageHours).toBeNull();
    expect(f.maxAgeHours).toBe(36);
  });

  it("meldt 'fresh' binnen het venster met een geslaagde run", () => {
    const f = evaluateCronFreshness(hoursAgo(3), true, NOW, 36);
    expect(f.status).toBe("fresh");
    expect(f.ageHours).toBe(3);
    expect(f.lastOk).toBe(true);
  });

  it("meldt 'warning' binnen het venster maar met een gefaalde taak", () => {
    const f = evaluateCronFreshness(hoursAgo(2), false, NOW, 36);
    expect(f.status).toBe("warning");
    expect(f.ageHours).toBe(2);
  });

  it("meldt 'stale' zodra de run ouder is dan het venster (ook bij lastOk true)", () => {
    const f = evaluateCronFreshness(hoursAgo(48), true, NOW, 36);
    expect(f.status).toBe("stale");
    expect(f.ageHours).toBe(48);
  });

  it("stale wint van warning: een oude gefaalde run is stale, niet warning", () => {
    const f = evaluateCronFreshness(hoursAgo(72), false, NOW, 36);
    expect(f.status).toBe("stale");
  });

  it("is inclusief op de grens (precies maxAge = nog fresh)", () => {
    const f = evaluateCronFreshness(hoursAgo(36), true, NOW, 36);
    expect(f.status).toBe("fresh");
    // net erover → stale
    const over = evaluateCronFreshness(new Date(hoursAgo(36).getTime() - 1), true, NOW, 36);
    expect(over.status).toBe("stale");
  });

  it("behandelt een klok-scheefstand (run in de toekomst) als leeftijd 0, niet stale", () => {
    const f = evaluateCronFreshness(hoursAgo(-5), true, NOW, 36);
    expect(f.status).toBe("fresh");
    expect(f.ageHours).toBe(0);
  });
});

describe("cronFreshnessStatusItem", () => {
  it("'never' → aandacht met stabiele sleutel", () => {
    const item = cronFreshnessStatusItem(evaluateCronFreshness(null, null, NOW, 36));
    expect(item.key).toBe("cron-heartbeat");
    expect(item.level).toBe("attention");
    expect(item.mode).toBe("nooit gedraaid");
  });

  it("'fresh' → ok en toont de leeftijd", () => {
    const item = cronFreshnessStatusItem(evaluateCronFreshness(hoursAgo(4), true, NOW, 36));
    expect(item.level).toBe("ok");
    expect(item.mode).toBe("4 uur geleden");
  });

  it("'fresh' onder één uur toont '< 1 uur'", () => {
    const item = cronFreshnessStatusItem(evaluateCronFreshness(hoursAgo(0), true, NOW, 36));
    expect(item.mode).toBe("< 1 uur geleden");
  });

  it("'warning' → aandacht met een fout-toelichting", () => {
    const item = cronFreshnessStatusItem(evaluateCronFreshness(hoursAgo(2), false, NOW, 36));
    expect(item.level).toBe("attention");
    expect(item.detail).toContain("faalde");
  });

  it("'stale' → aandacht en noemt het venster", () => {
    const item = cronFreshnessStatusItem(evaluateCronFreshness(hoursAgo(50), true, NOW, 36));
    expect(item.level).toBe("attention");
    expect(item.detail).toContain("36 uur");
  });

  it("lekt geen sleutelwaarden (alleen env-namen + tijd, nooit een waarde)", () => {
    // Mag env-VARIABELENAMEN noemen (zoals de rest van de systeemstatus), maar nooit een waarde:
    // geen "NAAM=waarde", geen "Bearer <token>".
    const item = cronFreshnessStatusItem(evaluateCronFreshness(hoursAgo(50), true, NOW, 36));
    expect(item.detail).not.toMatch(/[A-Z_]+=\S/);
    expect(item.detail).not.toMatch(/Bearer\s+\S/i);
  });
});
