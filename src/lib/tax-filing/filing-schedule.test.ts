import { describe, it, expect } from "vitest";
import { buildFilingSchedule, type FilingRequestRef } from "@/lib/tax-filing/filing-schedule";

describe("buildFilingSchedule — BTW-tijdvak & urgentie", () => {
  it("agendeert het net afgesloten kwartaal met de NL-deadline (einde maand ná het kwartaal)", () => {
    // 5 juli 2026 (Q3) → aan de beurt: Q2 2026, deadline 31 juli 2026.
    const { btw } = buildFilingSchedule([], new Date("2026-07-05"));
    expect(btw.kind).toBe("BTW");
    expect(btw.taxYear).toBe(2026);
    expect(btw.quarter).toBe(2);
    expect(btw.deadline.toISOString().slice(0, 10)).toBe("2026-07-31");
    expect(btw.daysUntil).toBe(26);
    expect(btw.urgency).toBe("upcoming");
  });

  it("markeert 'due-soon' binnen 14 dagen vóór de deadline", () => {
    // 20 juli 2026 → Q2-deadline 31 juli, nog 11 dagen.
    const { btw } = buildFilingSchedule([], new Date("2026-07-20"));
    expect(btw.daysUntil).toBe(11);
    expect(btw.urgency).toBe("due-soon");
  });

  it("markeert 'overdue' zodra de deadline verstreken is", () => {
    // 10 aug 2026 → Q2-deadline 31 juli is 10 dagen verstreken.
    const { btw } = buildFilingSchedule([], new Date("2026-08-10"));
    expect(btw.daysUntil).toBe(-10);
    expect(btw.urgency).toBe("overdue");
  });

  it("rolt in Q1 terug naar Q4 van het vorige jaar", () => {
    // 10 jan 2026 (Q1) → aan de beurt: Q4 2025, deadline 31 jan 2026.
    const { btw } = buildFilingSchedule([], new Date("2026-01-10"));
    expect(btw.taxYear).toBe(2025);
    expect(btw.quarter).toBe(4);
    expect(btw.deadline.toISOString().slice(0, 10)).toBe("2026-01-31");
  });
});

describe("buildFilingSchedule — IB-tijdvak (forward-looking)", () => {
  it("kiest de eerstvolgende nog-niet-verstreken jaardeadline (1 mei)", () => {
    // 5 juli 2026 → deadline over 2025 (1 mei 2026) is verstreken → belastingjaar 2026, 1 mei 2027.
    const { ib } = buildFilingSchedule([], new Date("2026-07-05"));
    expect(ib.kind).toBe("IB");
    expect(ib.quarter).toBeNull();
    expect(ib.taxYear).toBe(2026);
    expect(ib.deadline.toISOString().slice(0, 10)).toBe("2027-05-01");
    expect(ib.urgency).toBe("upcoming");
  });

  it("markeert 'due-soon' binnen 30 dagen vóór 1 mei, nooit 'overdue'", () => {
    // 15 april 2026 → deadline over 2025 (1 mei 2026) nog 16 dagen weg → due-soon.
    const { ib } = buildFilingSchedule([], new Date("2026-04-15"));
    expect(ib.taxYear).toBe(2025);
    expect(ib.daysUntil).toBe(16);
    expect(ib.urgency).toBe("due-soon");
  });
});

describe("buildFilingSchedule — koppeling met lopende aangiftes", () => {
  const overdueNow = new Date("2026-08-10"); // BTW Q2 2026 verstreken

  it("toont een lopende aangifte voor het tijdvak en onderdrukt needsStart", () => {
    const requests: FilingRequestRef[] = [
      { kind: "BTW", taxYear: 2026, quarter: 2, status: "CONCEPT_KLAAR" },
    ];
    const { btw } = buildFilingSchedule(requests, overdueNow);
    expect(btw.existingStatus).toBe("CONCEPT_KLAAR");
    expect(btw.needsStart).toBe(false);
  });

  it("vraagt om starten zodra de deadline nabij/verstreken is en er niets loopt", () => {
    const { btw } = buildFilingSchedule([], overdueNow);
    expect(btw.existingStatus).toBeNull();
    expect(btw.needsStart).toBe(true);
  });

  it("negeert een INGETROKKEN aangifte — het tijdvak is dan weer open", () => {
    const requests: FilingRequestRef[] = [
      { kind: "BTW", taxYear: 2026, quarter: 2, status: "INGETROKKEN" },
    ];
    const { btw } = buildFilingSchedule(requests, overdueNow);
    expect(btw.existingStatus).toBeNull();
    expect(btw.needsStart).toBe(true);
  });

  it("kiest de nieuwste, niet-ingetrokken aangifte (input is createdAt-desc)", () => {
    const requests: FilingRequestRef[] = [
      { kind: "BTW", taxYear: 2026, quarter: 2, status: "IN_BEHANDELING" },
      { kind: "BTW", taxYear: 2026, quarter: 2, status: "INGETROKKEN" },
    ];
    const { btw } = buildFilingSchedule(requests, overdueNow);
    expect(btw.existingStatus).toBe("IN_BEHANDELING");
    expect(btw.needsStart).toBe(false);
  });

  it("matcht een aangifte van een ánder tijdvak niet", () => {
    const requests: FilingRequestRef[] = [
      { kind: "BTW", taxYear: 2026, quarter: 1, status: "INGEDIEND" },
    ];
    const { btw } = buildFilingSchedule(requests, overdueNow);
    expect(btw.existingStatus).toBeNull();
  });

  it("matcht de IB-aangifte op belastingjaar (quarter null), los van BTW", () => {
    const now = new Date("2026-04-15"); // IB 2025 due-soon
    const requests: FilingRequestRef[] = [
      { kind: "IB", taxYear: 2025, quarter: null, status: "AKKOORD" },
    ];
    const { ib } = buildFilingSchedule(requests, now);
    expect(ib.existingStatus).toBe("AKKOORD");
    expect(ib.needsStart).toBe(false);
  });

  it("houdt needsStart uit bij een verre (upcoming) deadline zonder aangifte", () => {
    const { btw, ib } = buildFilingSchedule([], new Date("2026-07-05"));
    expect(btw.urgency).toBe("upcoming");
    expect(btw.needsStart).toBe(false);
    expect(ib.urgency).toBe("upcoming");
    expect(ib.needsStart).toBe(false);
  });
});
