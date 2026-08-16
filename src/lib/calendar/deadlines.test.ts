import { describe, it, expect } from "vitest";
import {
  administrativeDeadlineEvents,
  type AdministrativeDeadlines,
} from "@/lib/calendar/deadlines";

const empty: AdministrativeDeadlines = {
  credentials: [],
  invoices: [],
  vat: [],
  incomeTax: null,
  collaborations: [],
};

describe("administrativeDeadlineEvents", () => {
  it("geeft geen events bij lege invoer", () => {
    expect(administrativeDeadlineEvents(empty)).toEqual([]);
  });

  it("mapt een certificaat-verloop naar een gehele-dag-event met stabiele UID", () => {
    const expiresAt = new Date("2026-09-01T00:00:00Z");
    const [event] = administrativeDeadlineEvents({
      ...empty,
      credentials: [{ id: "cred-1", title: "VOG zorg", expiresAt }],
    });
    expect(event!.uid).toBe("cred-expiry-cred-1@zzp-platform");
    expect(event!.summary).toBe("Certificaat verloopt: VOG zorg");
    expect(event!.allDay).toBe(true);
    expect(event!.start).toBe(expiresAt);
    // Geen herhaling: een deadline is een enkel event.
    expect(event!.recurrenceDays).toBeUndefined();
  });

  it("onderscheidt betalen (opdrachtgever) van vervallen (ZZP'er) op een factuur — zonder bedrag", () => {
    const dueAt = new Date("2026-08-15T00:00:00Z");
    const events = administrativeDeadlineEvents({
      ...empty,
      invoices: [
        { id: "inv-a", number: "F-2026-004", dueAt, payable: true },
        { id: "inv-b", number: "F-2026-005", dueAt, payable: false },
      ],
    });
    expect(events[0]!.summary).toBe("Factuur F-2026-004 betalen");
    expect(events[1]!.summary).toBe("Factuur F-2026-005 vervalt");
    expect(events[0]!.uid).toBe("invoice-due-inv-a@zzp-platform");
    // Privacy: geen euro-bedrag in de tekst van de publieke feed (het factuurnummer mag cijfers
    // bevatten; een euro-teken/bedrag mag er niet in staan).
    expect(events[0]!.summary).not.toContain("€");
    expect(events[0]!.description).not.toContain("€");
  });

  it("mapt een BTW-deadline naar een event met kwartaal + jaar", () => {
    const deadline = new Date("2026-04-30T00:00:00Z");
    const [event] = administrativeDeadlineEvents({
      ...empty,
      vat: [{ year: 2026, quarter: 1, deadline }],
    });
    expect(event!.uid).toBe("vat-return-2026-Q1@zzp-platform");
    expect(event!.summary).toBe("BTW-aangifte Q1 2026");
    expect(event!.start).toBe(deadline);
  });

  it("mapt een IB-aangifte-deadline naar een gehele-dag-event met stabiele UID — zonder bedrag", () => {
    const deadline = new Date("2027-05-01T00:00:00Z");
    const [event] = administrativeDeadlineEvents({
      ...empty,
      incomeTax: { taxYear: 2026, deadline },
    });
    expect(event!.uid).toBe("income-tax-2026@zzp-platform");
    expect(event!.summary).toBe("Aangifte inkomstenbelasting 2026");
    expect(event!.allDay).toBe(true);
    expect(event!.start).toBe(deadline);
    expect(event!.recurrenceDays).toBeUndefined();
    // Privacy: geen euro-bedrag in de publieke feed.
    expect(event!.summary).not.toContain("€");
    expect(event!.description).not.toContain("€");
  });

  it("laat de IB-deadline weg als incomeTax null is", () => {
    expect(administrativeDeadlineEvents({ ...empty, incomeTax: null })).toEqual([]);
  });

  it("mapt een plaatsing-einddatum naar een gehele-dag-event met stabiele UID — perspectief ZZP'er", () => {
    const endDate = new Date("2026-10-01T00:00:00Z");
    const [event] = administrativeDeadlineEvents({
      ...empty,
      collaborations: [
        { id: "col-1", endDate, counterpartyName: "Zorggroep De Linde", asClient: false },
      ],
    });
    expect(event!.uid).toBe("collab-end-col-1@zzp-platform");
    expect(event!.summary).toBe("Einde plaatsing: Zorggroep De Linde");
    expect(event!.allDay).toBe(true);
    expect(event!.start).toBe(endDate);
    expect(event!.recurrenceDays).toBeUndefined();
    // ZZP'er-perspectief: vervolg/nieuwe opdracht.
    expect(event!.description).toContain("vervolg");
  });

  it("onderscheidt het opdrachtgever-perspectief op een plaatsing-einddatum (verlenging/vervanger)", () => {
    const endDate = new Date("2026-10-01T00:00:00Z");
    const [event] = administrativeDeadlineEvents({
      ...empty,
      collaborations: [
        { id: "col-2", endDate, counterpartyName: "Sanne de Vries", asClient: true },
      ],
    });
    expect(event!.summary).toBe("Einde plaatsing: Sanne de Vries");
    expect(event!.description).toContain("verlenging");
  });

  it("bewaart de categorievolgorde: certificaten, facturen, BTW, IB, dan plaatsingen", () => {
    const d = new Date("2026-06-01T00:00:00Z");
    const ibDeadline = new Date("2027-05-01T00:00:00Z");
    const events = administrativeDeadlineEvents({
      credentials: [{ id: "c1", title: "Diploma", expiresAt: d }],
      invoices: [{ id: "i1", number: "F-1", dueAt: d, payable: true }],
      vat: [{ year: 2026, quarter: 2, deadline: d }],
      incomeTax: { taxYear: 2026, deadline: ibDeadline },
      collaborations: [{ id: "col-1", endDate: d, counterpartyName: "De Linde", asClient: false }],
    });
    expect(events.map((e) => e.uid)).toEqual([
      "cred-expiry-c1@zzp-platform",
      "invoice-due-i1@zzp-platform",
      "vat-return-2026-Q2@zzp-platform",
      "income-tax-2026@zzp-platform",
      "collab-end-col-1@zzp-platform",
    ]);
  });
});
