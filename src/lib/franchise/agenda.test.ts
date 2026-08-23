import { describe, it, expect } from "vitest";
import { brokerAgendaEvents, type BrokerAgenda } from "@/lib/franchise/agenda";

const D = (iso: string) => new Date(iso);

/** Narrowt de verwachte enkel-event-lijst tot dat ene event (voldoet aan noUncheckedIndexedAccess). */
function single<T>(items: T[]): T {
  expect(items).toHaveLength(1);
  const [first] = items;
  if (first === undefined) throw new Error("verwachtte precies één element");
  return first;
}

describe("brokerAgendaEvents", () => {
  it("levert geen events bij een lege agenda", () => {
    const empty: BrokerAgenda = { collaborations: [], credentials: [] };
    expect(brokerAgendaEvents(empty)).toEqual([]);
  });

  it("mapt een plaatsing-einddatum naar een all-day event met een 14-dagen-alarm", () => {
    const e = single(
      brokerAgendaEvents({
        collaborations: [
          {
            id: "c1",
            endDate: D("2026-09-01T00:00:00Z"),
            freelancerName: "Sanne",
            companyName: "Zorg BV",
          },
        ],
        credentials: [],
      }),
    );
    expect(e.uid).toBe("broker-collab-end-c1@zzp-platform");
    expect(e.summary).toBe("Einde plaatsing: Sanne bij Zorg BV");
    expect(e.allDay).toBe(true);
    expect(e.start).toEqual(D("2026-09-01T00:00:00Z"));
    expect(e.recurrenceDays).toBeUndefined();
    expect(e.alarms).toEqual([
      {
        daysBefore: 14,
        description:
          "Plaatsing Sanne bij Zorg BV loopt over 14 dagen af — plan verlenging of vervanger.",
      },
    ]);
  });

  it("mapt een certificaat-verval naar een all-day event met 30- en 7-dagen-alarmen", () => {
    const e = single(
      brokerAgendaEvents({
        collaborations: [],
        credentials: [
          {
            id: "k1",
            title: "VOG",
            freelancerName: "Youssef",
            expiresAt: D("2026-10-15T00:00:00Z"),
          },
        ],
      }),
    );
    expect(e.uid).toBe("broker-cred-expiry-k1@zzp-platform");
    expect(e.summary).toBe("Certificaat verloopt: VOG — Youssef");
    expect(e.allDay).toBe(true);
    expect(e.start).toEqual(D("2026-10-15T00:00:00Z"));
    expect(e.alarms?.map((a) => a.daysBefore)).toEqual([30, 7]);
  });

  it("bewaart de volgorde: eerst plaatsingen, dan certificaten", () => {
    const events = brokerAgendaEvents({
      collaborations: [
        { id: "c1", endDate: D("2026-09-01T00:00:00Z"), freelancerName: "A", companyName: "X" },
        { id: "c2", endDate: D("2026-09-02T00:00:00Z"), freelancerName: "B", companyName: "Y" },
      ],
      credentials: [
        { id: "k1", title: "BIG", freelancerName: "A", expiresAt: D("2026-09-03T00:00:00Z") },
      ],
    });
    expect(events.map((e) => e.uid)).toEqual([
      "broker-collab-end-c1@zzp-platform",
      "broker-collab-end-c2@zzp-platform",
      "broker-cred-expiry-k1@zzp-platform",
    ]);
  });

  it("valt terug op een nette naam bij een leeg/onbekend naamveld (geen rare titel)", () => {
    const e = single(
      brokerAgendaEvents({
        collaborations: [
          { id: "c1", endDate: D("2026-09-01T00:00:00Z"), freelancerName: "  ", companyName: "" },
        ],
        credentials: [],
      }),
    );
    expect(e.summary).toBe("Einde plaatsing: een teamlid bij een teamlid");
  });

  it("draagt geen bedragen in summary of description (privacy-parity met deadlines.ts)", () => {
    const events = brokerAgendaEvents({
      collaborations: [
        {
          id: "c1",
          endDate: D("2026-09-01T00:00:00Z"),
          freelancerName: "Sanne",
          companyName: "Zorg BV",
        },
      ],
      credentials: [
        { id: "k1", title: "VOG", freelancerName: "Sanne", expiresAt: D("2026-10-01T00:00:00Z") },
      ],
    });
    for (const e of events) {
      expect(e.summary).not.toMatch(/€|\beuro\b/i);
      expect(e.description ?? "").not.toMatch(/€|\beuro\b/i);
    }
  });
});
