import { describe, it, expect } from "vitest";
import { type LedgerEntry } from "@/lib/administration/overview";
import {
  previousQuarter,
  vatFilingDeadline,
  summarizeVatDeadline,
  VAT_DEADLINE_SOON_DAYS,
} from "@/lib/administration/vat-deadline";

describe("previousQuarter", () => {
  it("neemt het kwartaal direct vóór het huidige", () => {
    expect(previousQuarter(new Date("2026-07-07"))).toEqual({ year: 2026, quarter: 2 });
    expect(previousQuarter(new Date("2026-05-15"))).toEqual({ year: 2026, quarter: 1 });
    expect(previousQuarter(new Date("2026-11-30"))).toEqual({ year: 2026, quarter: 3 });
  });

  it("rolt in Q1 terug naar Q4 van het vorige jaar", () => {
    expect(previousQuarter(new Date("2026-01-10"))).toEqual({ year: 2025, quarter: 4 });
    expect(previousQuarter(new Date("2026-03-31"))).toEqual({ year: 2025, quarter: 4 });
  });
});

describe("vatFilingDeadline", () => {
  it("valt op de laatste dag van de maand ná het kwartaal (NL-regel)", () => {
    // Q1 → 30 april
    expect(vatFilingDeadline(2026, 1).toISOString().slice(0, 10)).toBe("2026-04-30");
    // Q2 → 31 juli
    expect(vatFilingDeadline(2026, 2).toISOString().slice(0, 10)).toBe("2026-07-31");
    // Q3 → 31 oktober
    expect(vatFilingDeadline(2026, 3).toISOString().slice(0, 10)).toBe("2026-10-31");
    // Q4 → 31 januari van het volgende jaar
    expect(vatFilingDeadline(2026, 4).toISOString().slice(0, 10)).toBe("2027-01-31");
  });
});

function entry(occurredAt: string, extra: Partial<LedgerEntry> = {}): LedgerEntry {
  return {
    party: "FREELANCER",
    account: "BTW_AF_TE_DRAGEN",
    debitCents: 0,
    creditCents: 21000,
    occurredAt: new Date(occurredAt),
    ...extra,
  };
}

describe("summarizeVatDeadline", () => {
  it("kiest het meest recent afgesloten kwartaal en de bijbehorende deadline", () => {
    const s = summarizeVatDeadline([], "FREELANCER", new Date("2026-07-07"));
    expect(s.year).toBe(2026);
    expect(s.quarter).toBe(2);
    expect(s.deadline.toISOString().slice(0, 10)).toBe("2026-07-31");
    expect(s.party).toBe("FREELANCER");
  });

  it("telt alleen het saldo van het aangiftekwartaal mee (BTW af te dragen → positief)", () => {
    const entries = [
      entry("2026-05-10"), // Q2 — telt mee
      entry("2026-06-20"), // Q2 — telt mee
      entry("2026-07-01"), // Q3 — telt niet mee
    ];
    const s = summarizeVatDeadline(entries, "FREELANCER", new Date("2026-07-07"));
    expect(s.balanceCents).toBe(42000);
  });

  it("markeert due-soon binnen de drempel en op de deadline zelf", () => {
    // 20 juli 2026 → deadline 31 juli, 11 dagen ⇒ due-soon
    const soon = summarizeVatDeadline([], "FREELANCER", new Date("2026-07-20"));
    expect(soon.daysUntil).toBe(11);
    expect(soon.status).toBe("due-soon");

    // Op de deadline zelf nog op tijd (0 dagen, niet overdue)
    const onDay = summarizeVatDeadline([], "FREELANCER", new Date("2026-07-31"));
    expect(onDay.daysUntil).toBe(0);
    expect(onDay.status).toBe("due-soon");
  });

  it("markeert upcoming ruim vóór de deadline", () => {
    // 5 juli 2026 → deadline 31 juli, 26 dagen ⇒ upcoming
    const s = summarizeVatDeadline([], "FREELANCER", new Date("2026-07-05"));
    expect(s.daysUntil).toBeGreaterThan(VAT_DEADLINE_SOON_DAYS);
    expect(s.status).toBe("upcoming");
  });

  it("markeert overdue zodra de deadline verstreken is", () => {
    // 2 augustus 2026 → deadline was 31 juli ⇒ overdue
    const s = summarizeVatDeadline([], "FREELANCER", new Date("2026-08-02"));
    expect(s.daysUntil).toBeLessThan(0);
    expect(s.status).toBe("overdue");
  });

  it("levert een negatief saldo bij voorbelasting (opdrachtgever krijgt terug)", () => {
    const entries: LedgerEntry[] = [
      {
        party: "CLIENT",
        account: "BTW_VOORBELASTING",
        debitCents: 15000,
        creditCents: 0,
        occurredAt: new Date("2026-06-10"),
      },
    ];
    const s = summarizeVatDeadline(entries, "CLIENT", new Date("2026-07-07"));
    expect(s.balanceCents).toBe(-15000);
    expect(s.party).toBe("CLIENT");
  });
});
