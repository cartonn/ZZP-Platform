import { describe, it, expect } from "vitest";
import {
  applicationLimitMessage,
  applicationPeriodEnd,
  applicationPeriodStart,
  applicationQuota,
} from "@/lib/application-quota";

const FREE = { maxApplicationsPerMonth: 5 };
const UNLIMITED = { maxApplicationsPerMonth: -1 };

describe("applicationPeriodStart / applicationPeriodEnd", () => {
  it("begrenst de wintermaand op middernacht NL (= 23:00 UTC de dag ervoor)", () => {
    const now = new Date("2026-01-15T12:00:00Z");
    expect(applicationPeriodStart(now).toISOString()).toBe("2025-12-31T23:00:00.000Z");
    expect(applicationPeriodEnd(now).toISOString()).toBe("2026-01-31T23:00:00.000Z");
  });

  it("begrenst de zomermaand op middernacht NL (= 22:00 UTC de dag ervoor)", () => {
    const now = new Date("2026-07-15T12:00:00Z");
    expect(applicationPeriodStart(now).toISOString()).toBe("2026-06-30T22:00:00.000Z");
    expect(applicationPeriodEnd(now).toISOString()).toBe("2026-07-31T22:00:00.000Z");
  });

  it("overbrugt de zomertijd-omschakeling: maart start in wintertijd, eindigt in zomertijd", () => {
    const now = new Date("2026-03-10T12:00:00Z"); // DST gaat in op 29 maart 2026
    expect(applicationPeriodStart(now).toISOString()).toBe("2026-02-28T23:00:00.000Z");
    expect(applicationPeriodEnd(now).toISOString()).toBe("2026-03-31T22:00:00.000Z");
  });

  it("rolt over het jaar heen in december", () => {
    const now = new Date("2026-12-20T12:00:00Z");
    expect(applicationPeriodStart(now).toISOString()).toBe("2026-11-30T23:00:00.000Z");
    expect(applicationPeriodEnd(now).toISOString()).toBe("2026-12-31T23:00:00.000Z");
  });

  it("telt een instant net ná middernacht NL al bij de nieuwe maand (UTC-server-val)", () => {
    // 1 jan 00:30 Amsterdam = 31 dec 23:30 UTC — burgerlijk januari, niet december.
    const now = new Date("2025-12-31T23:30:00Z");
    expect(applicationPeriodStart(now).toISOString()).toBe("2025-12-31T23:00:00.000Z");
    expect(applicationPeriodEnd(now).toISOString()).toBe("2026-01-31T23:00:00.000Z");
  });
});

describe("applicationQuota", () => {
  const now = new Date("2026-07-15T12:00:00Z");

  it("rekent het restant binnen de maand", () => {
    const q = applicationQuota({ plan: FREE, usedThisMonth: 2, now });
    expect(q).toMatchObject({ limit: 5, used: 2, remaining: 3, reached: false });
    expect(q.resetsAt.toISOString()).toBe("2026-07-31T22:00:00.000Z");
  });

  it("is precies op de grens bereikt", () => {
    expect(applicationQuota({ plan: FREE, usedThisMonth: 4, now }).reached).toBe(false);
    const q = applicationQuota({ plan: FREE, usedThisMonth: 5, now });
    expect(q.reached).toBe(true);
    expect(q.remaining).toBe(0);
  });

  it("klemt het restant op nul bij een overschrijding uit het verleden", () => {
    const q = applicationQuota({ plan: FREE, usedThisMonth: 9, now });
    expect(q.remaining).toBe(0);
    expect(q.reached).toBe(true);
  });

  it("is nooit bereikt bij een onbeperkt plan", () => {
    const q = applicationQuota({ plan: UNLIMITED, usedThisMonth: 999, now });
    expect(q.limit).toBe(-1);
    expect(q.remaining).toBeNull();
    expect(q.reached).toBe(false);
  });

  it("weigert een plan met maximum 0 meteen", () => {
    const q = applicationQuota({ plan: { maxApplicationsPerMonth: 0 }, usedThisMonth: 0, now });
    expect(q.reached).toBe(true);
  });
});

describe("applicationLimitMessage", () => {
  it("noemt het maximum en de datum waarop de nieuwe periode begint", () => {
    const msg = applicationLimitMessage(5, new Date("2026-07-31T22:00:00.000Z"));
    expect(msg).toContain("deze maand het maximum van 5 reacties bereikt");
    expect(msg).toContain("1 aug 2026");
  });
});
