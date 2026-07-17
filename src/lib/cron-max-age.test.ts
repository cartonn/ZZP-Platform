import { describe, expect, it } from "vitest";
import {
  parseCronMaxAgeHours,
  CRON_MAX_AGE_HOURS_DEFAULT,
  CRON_MAX_AGE_HOURS_MIN,
  CRON_MAX_AGE_HOURS_MAX,
} from "./config";

describe("parseCronMaxAgeHours", () => {
  it("valt terug op de default zonder waarde", () => {
    expect(parseCronMaxAgeHours(undefined)).toBe(CRON_MAX_AGE_HOURS_DEFAULT);
    expect(parseCronMaxAgeHours("")).toBe(CRON_MAX_AGE_HOURS_DEFAULT);
    expect(parseCronMaxAgeHours("   ")).toBe(CRON_MAX_AGE_HOURS_DEFAULT);
  });

  it("valt terug op de default bij onzin/negatief/nul", () => {
    expect(parseCronMaxAgeHours("abc")).toBe(CRON_MAX_AGE_HOURS_DEFAULT);
    expect(parseCronMaxAgeHours("0")).toBe(CRON_MAX_AGE_HOURS_DEFAULT);
    expect(parseCronMaxAgeHours("-5")).toBe(CRON_MAX_AGE_HOURS_DEFAULT);
  });

  it("neemt een geldige waarde over (afgekapt naar heel getal)", () => {
    expect(parseCronMaxAgeHours("48")).toBe(48);
    expect(parseCronMaxAgeHours("12.9")).toBe(12);
  });

  it("klemt binnen de veilige bandbreedte", () => {
    expect(parseCronMaxAgeHours("0.5")).toBe(CRON_MAX_AGE_HOURS_MIN);
    expect(parseCronMaxAgeHours("100000")).toBe(CRON_MAX_AGE_HOURS_MAX);
  });
});
