import { describe, it, expect } from "vitest";
import { buildReminderEligibilityMap, type ReminderCandidate } from "./openstaand-reminders";
import { MANUAL_REMINDER_COOLDOWN_DAYS } from "@/lib/manual-payment-reminder";
import { DAY_MS } from "@/lib/date-boundary";

const NOW = new Date("2026-03-10T12:00:00.000Z");

function candidate(over: Partial<ReminderCandidate> = {}): ReminderCandidate {
  return {
    id: "inv1",
    status: "SENT",
    lifecycleStatus: null,
    issuedAt: new Date("2026-02-01T00:00:00.000Z"),
    dueAt: new Date("2026-02-15T00:00:00.000Z"),
    ...over,
  };
}

describe("buildReminderEligibilityMap", () => {
  it("markeert een openstaande cascade-factuur (APPROVED) als herinnerbaar", () => {
    const map = buildReminderEligibilityMap(
      [candidate({ id: "a", status: "OPEN", lifecycleStatus: "APPROVED" })],
      new Map(),
      NOW,
    );
    expect(map.get("a")?.eligible).toBe(true);
  });

  it("markeert een te late factuur als herinnerbaar met dagen te laat", () => {
    const map = buildReminderEligibilityMap(
      [candidate({ id: "a", status: "OVERDUE", lifecycleStatus: "OVERDUE" })],
      new Map(),
      NOW,
    );
    const e = map.get("a");
    expect(e?.eligible).toBe(true);
    expect(e?.daysOverdue).toBeGreaterThan(0);
  });

  it("weigert een nog niet goedgekeurde cascade-factuur (SUBMITTED)", () => {
    const map = buildReminderEligibilityMap(
      [candidate({ id: "a", status: "OPEN", lifecycleStatus: "SUBMITTED" })],
      new Map(),
      NOW,
    );
    expect(map.get("a")?.eligible).toBe(false);
    expect(map.get("a")?.reason).toBe("not-awaiting-payment");
  });

  it("weigert een nog niet uitgereikte factuur (geen issuedAt)", () => {
    const map = buildReminderEligibilityMap(
      [candidate({ id: "a", issuedAt: null })],
      new Map(),
      NOW,
    );
    expect(map.get("a")?.reason).toBe("not-issued");
  });

  it("respecteert de afkoelperiode uit de laatste-herinnering-map", () => {
    const justNow = new Date(NOW.getTime() - 1 * DAY_MS); // 1 dag geleden < cooldown (2)
    const map = buildReminderEligibilityMap(
      [candidate({ id: "a", status: "OVERDUE" })],
      new Map([["a", justNow]]),
      NOW,
    );
    expect(map.get("a")?.eligible).toBe(false);
    expect(map.get("a")?.reason).toBe("cooldown");
    expect(map.get("a")?.nextAllowedAt).toBeInstanceOf(Date);
  });

  it("staat opnieuw herinneren toe zodra de afkoelperiode is verstreken", () => {
    const past = new Date(NOW.getTime() - (MANUAL_REMINDER_COOLDOWN_DAYS + 1) * DAY_MS);
    const map = buildReminderEligibilityMap(
      [candidate({ id: "a", status: "OVERDUE" })],
      new Map([["a", past]]),
      NOW,
    );
    expect(map.get("a")?.eligible).toBe(true);
  });

  it("beoordeelt elke factuur onafhankelijk en dekt de hele set", () => {
    const map = buildReminderEligibilityMap(
      [
        candidate({ id: "a", status: "OVERDUE" }),
        candidate({ id: "b", lifecycleStatus: "SUBMITTED", status: "OPEN" }),
      ],
      new Map(),
      NOW,
    );
    expect(map.size).toBe(2);
    expect(map.get("a")?.eligible).toBe(true);
    expect(map.get("b")?.eligible).toBe(false);
  });
});
