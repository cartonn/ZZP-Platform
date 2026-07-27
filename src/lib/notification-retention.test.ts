// Unit-tests voor de pure notificatie-retentie-afleiding (geen DB): afkapdatum bij een geldig venster,
// null bij uit/ongeldig, en de deterministische grens.

import { describe, it, expect } from "vitest";
import { notificationRetentionCutoff } from "@/lib/notification-retention";

const NOW = new Date("2026-07-27T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

describe("notificationRetentionCutoff", () => {
  it("berekent de afkapdatum als now - retentionDays", () => {
    const cutoff = notificationRetentionCutoff(180, NOW);
    expect(cutoff).toEqual(new Date(NOW.getTime() - 180 * DAY));
  });

  it("geeft null als retentie uit staat (0)", () => {
    expect(notificationRetentionCutoff(0, NOW)).toBeNull();
  });

  it("geeft null bij een negatief venster", () => {
    expect(notificationRetentionCutoff(-5, NOW)).toBeNull();
  });

  it("geeft null bij een niet-eindig venster (NaN)", () => {
    expect(notificationRetentionCutoff(Number.NaN, NOW)).toBeNull();
  });

  it("kapt een fractioneel venster af naar hele dagen", () => {
    const cutoff = notificationRetentionCutoff(30.9, NOW);
    expect(cutoff).toEqual(new Date(NOW.getTime() - 30 * DAY));
  });
});
