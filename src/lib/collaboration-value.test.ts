import { describe, it, expect } from "vitest";
import {
  summarizeCollaborationValue,
  type PerformanceValueInput,
  type InvoiceValueInput,
} from "./collaboration-value";

const perf = (o: Partial<PerformanceValueInput>): PerformanceValueInput => ({
  type: "HOURS",
  status: "APPROVED",
  hours: null,
  ...o,
});

const inv = (o: Partial<InvoiceValueInput>): InvoiceValueInput => ({
  lifecycleStatus: null,
  status: "DRAFT",
  totalCents: 0,
  ...o,
});

describe("summarizeCollaborationValue", () => {
  it("geeft null wanneer er geen goedgekeurd/ingediend werk én geen factuurwaarde is", () => {
    expect(summarizeCollaborationValue([], [])).toBeNull();
    // Een enkele afgekeurde prestatie + een gecrediteerde factuur telt als 'geen activiteit'.
    expect(
      summarizeCollaborationValue(
        [perf({ status: "REJECTED", hours: 8 })],
        [inv({ lifecycleStatus: "CREDITED", totalCents: 12100 })],
      ),
    ).toBeNull();
  });

  it("telt goedgekeurde uren op en rondt kwartieren-float af", () => {
    const s = summarizeCollaborationValue(
      [
        perf({ type: "HOURS", status: "APPROVED", hours: 0.25 }),
        perf({ type: "HOURS", status: "APPROVED", hours: 0.1 }),
        perf({ type: "HOURS", status: "SUBMITTED", hours: 4 }), // wacht op goedkeuring, telt niet in uren
      ],
      [],
    );
    expect(s).not.toBeNull();
    expect(s!.approvedHours).toBe(0.35);
    expect(s!.pendingPerformances).toBe(1);
    expect(s!.approvedDeliverables).toBe(0);
  });

  it("telt goedgekeurde opleveringen apart van uren", () => {
    const s = summarizeCollaborationValue(
      [
        perf({ type: "MILESTONE", status: "APPROVED", hours: null }),
        perf({ type: "MILESTONE", status: "APPROVED", hours: null }),
        perf({ type: "MILESTONE", status: "REJECTED", hours: null }),
      ],
      [],
    );
    expect(s!.approvedDeliverables).toBe(2);
    expect(s!.approvedHours).toBe(0);
  });

  it("splitst facturen onderling-exclusief in betaald/openstaand/concept", () => {
    const s = summarizeCollaborationValue(
      [],
      [
        inv({ lifecycleStatus: "PAID", totalCents: 10000 }),
        inv({ lifecycleStatus: "PROCESSED", totalCents: 5000 }), // ook betaald (verwerkt)
        inv({ lifecycleStatus: "SUBMITTED", totalCents: 2000 }), // openstaand
        inv({ lifecycleStatus: "OVERDUE", totalCents: 3000 }), // openstaand + te laat
        inv({ lifecycleStatus: "DRAFT", totalCents: 900 }), // concept
        inv({ lifecycleStatus: "CREDITED", totalCents: 7777 }), // geen enkele emmer
      ],
    );
    expect(s!.paidCents).toBe(15000);
    expect(s!.outstandingCents).toBe(5000);
    expect(s!.overdueCents).toBe(3000);
    expect(s!.draftCents).toBe(900);
  });

  it("behandelt legacy-facturen (geen lifecycleStatus) via de live status", () => {
    const s = summarizeCollaborationValue(
      [],
      [
        inv({ lifecycleStatus: null, status: "PAID", totalCents: 4000 }),
        inv({ lifecycleStatus: null, status: "SENT", totalCents: 1000 }),
        inv({ lifecycleStatus: null, status: "OVERDUE", totalCents: 2500 }),
      ],
    );
    expect(s!.paidCents).toBe(4000);
    expect(s!.outstandingCents).toBe(3500);
    // Legacy OVERDUE loopt via de live status, niet via lifecycleStatus → telt niet in overdueCents.
    expect(s!.overdueCents).toBe(0);
  });

  it("negeert niet-eindige uren-waarden", () => {
    const s = summarizeCollaborationValue(
      [perf({ type: "HOURS", status: "APPROVED", hours: Number.NaN })],
      [inv({ lifecycleStatus: "PAID", totalCents: 100 })],
    );
    expect(s!.approvedHours).toBe(0);
    expect(s!.paidCents).toBe(100);
  });
});
