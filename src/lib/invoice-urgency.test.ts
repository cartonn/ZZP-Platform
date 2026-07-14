import { describe, it, expect } from "vitest";
import { sortInvoicesByUrgency, outstandingOverdueCents } from "@/lib/invoice-urgency";

const NOW = new Date("2026-07-14T12:00:00Z");
const daysFromNow = (n: number) => new Date(NOW.getTime() + n * 24 * 60 * 60 * 1000);

// Openstaand = cascade APPROVED (lifecycleStatus gezet, status blijft DRAFT) of legacy SENT.
const open = (id: string, dueAt: Date | null, totalCents = 100) => ({
  id,
  dueAt,
  lifecycleStatus: "APPROVED",
  status: "DRAFT",
  totalCents,
});
// Niet openstaand = betaald.
const paid = (id: string, totalCents = 100) => ({
  id,
  dueAt: null,
  lifecycleStatus: "PAID",
  status: "DRAFT",
  totalCents,
});

const ids = (list: { id: string }[]) => list.map((x) => x.id);

describe("sortInvoicesByUrgency", () => {
  it("plaatst te-late facturen bovenaan, langst te laat eerst", () => {
    const list = [
      open("upcoming", daysFromNow(5)),
      open("overdue-2", daysFromNow(-2)),
      open("overdue-20", daysFromNow(-20)),
      paid("paid"),
    ];
    expect(ids(sortInvoicesByUrgency(list, NOW))).toEqual([
      "overdue-20",
      "overdue-2",
      "upcoming",
      "paid",
    ]);
  });

  it("ordent openstaande facturen mét vervaldatum op eerder-verschuldigd-eerst", () => {
    const list = [open("in-30", daysFromNow(30)), open("in-3", daysFromNow(3)), open("today", NOW)];
    expect(ids(sortInvoicesByUrgency(list, NOW))).toEqual(["today", "in-3", "in-30"]);
  });

  it("zet openstaand-zonder-vervaldatum vóór niet-openstaand, ná datum-dragende openstaande", () => {
    const list = [paid("paid"), open("no-due", null), open("upcoming", daysFromNow(2))];
    expect(ids(sortInvoicesByUrgency(list, NOW))).toEqual(["upcoming", "no-due", "paid"]);
  });

  it("is stabiel: gelijke urgentie behoudt de inkomende volgorde", () => {
    const list = [paid("a"), paid("b"), paid("c")];
    expect(ids(sortInvoicesByUrgency(list, NOW))).toEqual(["a", "b", "c"]);
  });

  it("muteert de invoer niet", () => {
    const list = [open("upcoming", daysFromNow(5)), open("overdue", daysFromNow(-3))];
    const before = ids(list);
    sortInvoicesByUrgency(list, NOW);
    expect(ids(list)).toEqual(before);
  });
});

describe("outstandingOverdueCents", () => {
  it("telt alleen het te-late deel van de openstaande facturen", () => {
    const list = [
      open("overdue-a", daysFromNow(-1), 500),
      open("overdue-b", daysFromNow(-10), 250),
      open("upcoming", daysFromNow(5), 999),
      open("no-due", null, 999),
      paid("paid", 999),
    ];
    expect(outstandingOverdueCents(list, NOW)).toBe(750);
  });

  it("geeft 0 wanneer niets te laat is", () => {
    expect(
      outstandingOverdueCents([open("upcoming", daysFromNow(3), 400), paid("p", 100)], NOW),
    ).toBe(0);
  });
});
