import { describe, it, expect } from "vitest";
import { mailIntakeRetentionCutoff } from "@/lib/mail-intake-retention";

const NOW = new Date("2026-08-28T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

describe("mailIntakeRetentionCutoff", () => {
  it("berekent de afkapdatum als now minus het venster (hele dagen)", () => {
    expect(mailIntakeRetentionCutoff(180, NOW)).toEqual(new Date(NOW.getTime() - 180 * DAY));
  });

  it("kapt een fractioneel venster af naar hele dagen", () => {
    expect(mailIntakeRetentionCutoff(30.9, NOW)).toEqual(new Date(NOW.getTime() - 30 * DAY));
  });

  it("geeft null als retentie uit staat (0 of negatief)", () => {
    expect(mailIntakeRetentionCutoff(0, NOW)).toBeNull();
    expect(mailIntakeRetentionCutoff(-5, NOW)).toBeNull();
  });

  it("geeft null bij een niet-eindig venster", () => {
    expect(mailIntakeRetentionCutoff(Number.NaN, NOW)).toBeNull();
    expect(mailIntakeRetentionCutoff(Number.POSITIVE_INFINITY, NOW)).toBeNull();
  });
});
