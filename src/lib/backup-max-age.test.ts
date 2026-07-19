import { describe, expect, it } from "vitest";
import {
  parseBackupMaxAgeHours,
  BACKUP_MAX_AGE_HOURS_DEFAULT,
  BACKUP_MAX_AGE_HOURS_MIN,
  BACKUP_MAX_AGE_HOURS_MAX,
} from "./config";

describe("parseBackupMaxAgeHours", () => {
  it("valt terug op de default zonder waarde", () => {
    expect(parseBackupMaxAgeHours(undefined)).toBe(BACKUP_MAX_AGE_HOURS_DEFAULT);
    expect(parseBackupMaxAgeHours("")).toBe(BACKUP_MAX_AGE_HOURS_DEFAULT);
    expect(parseBackupMaxAgeHours("   ")).toBe(BACKUP_MAX_AGE_HOURS_DEFAULT);
  });

  it("valt terug op de default bij onzin/negatief/nul", () => {
    expect(parseBackupMaxAgeHours("abc")).toBe(BACKUP_MAX_AGE_HOURS_DEFAULT);
    expect(parseBackupMaxAgeHours("0")).toBe(BACKUP_MAX_AGE_HOURS_DEFAULT);
    expect(parseBackupMaxAgeHours("-5")).toBe(BACKUP_MAX_AGE_HOURS_DEFAULT);
  });

  it("neemt een geldige waarde over (afgekapt naar heel getal)", () => {
    expect(parseBackupMaxAgeHours("72")).toBe(72);
    expect(parseBackupMaxAgeHours("24.9")).toBe(24);
  });

  it("klemt binnen de veilige bandbreedte", () => {
    expect(parseBackupMaxAgeHours("0.5")).toBe(BACKUP_MAX_AGE_HOURS_MIN);
    expect(parseBackupMaxAgeHours("100000")).toBe(BACKUP_MAX_AGE_HOURS_MAX);
  });

  it("heeft een default (48u) die ruimer is dan de cron (36u)", () => {
    expect(BACKUP_MAX_AGE_HOURS_DEFAULT).toBe(48);
  });
});
