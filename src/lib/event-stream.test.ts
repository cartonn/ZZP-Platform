import { describe, expect, it } from "vitest";
import { type StoredEvent } from "@/lib/events";
import {
  EVENT_TYPE_OPTIONS,
  actorRoleLabel,
  eventCategory,
  eventTypeLabel,
  groupByCorrelation,
  summarizeEventStream,
} from "@/lib/event-stream";

function evt(over: Partial<StoredEvent> & Pick<StoredEvent, "id">): StoredEvent {
  return {
    type: "CONTRACT_SIGNED",
    actorRole: "SYSTEM",
    actorId: null,
    subjectType: "Contract",
    subjectId: "subj-1",
    payload: {},
    correlationId: null,
    dedupeKey: null,
    occurredAt: new Date("2026-06-16T10:00:00Z"),
    ...over,
  };
}

describe("eventTypeLabel", () => {
  it("vertaalt bekende typen naar NL", () => {
    expect(eventTypeLabel("CONTRACT_SIGNED")).toBe("Contract getekend");
    expect(eventTypeLabel("PAYMENT_CONFIRMED")).toBe("Ontvangst bevestigd");
  });

  it("valt voor onbekende typen terug op een leesbare vorm", () => {
    expect(eventTypeLabel("SOME_UNKNOWN_EVENT")).toBe("Some unknown event");
  });
});

describe("actorRoleLabel", () => {
  it("vertaalt rollen incl. SYSTEM", () => {
    expect(actorRoleLabel("FREELANCER")).toBe("ZZP'er");
    expect(actorRoleLabel("CLIENT")).toBe("Opdrachtgever");
    expect(actorRoleLabel("SYSTEM")).toBe("Systeem");
  });

  it("valt terug op de ruwe waarde bij onbekend", () => {
    expect(actorRoleLabel("ROBOT")).toBe("ROBOT");
  });
});

describe("eventCategory", () => {
  it("kern voor de hoofdcascade A-E", () => {
    expect(eventCategory("CONTRACT_SIGNED")).toBe("core");
    expect(eventCategory("INVOICE_APPROVED")).toBe("core");
    expect(eventCategory("PAYMENT_CONFIRMED")).toBe("core");
  });

  it("zijpad voor afkeuren/credit/dispuut/herinnering/fee", () => {
    expect(eventCategory("INVOICE_REJECTED")).toBe("side");
    expect(eventCategory("PAYMENT_OVERDUE")).toBe("side");
    expect(eventCategory("DISPUTE_OPENED")).toBe("side");
    expect(eventCategory("PLATFORM_FEE_INVOICED")).toBe("side");
  });

  it("monitoring voor het DBA-signaal", () => {
    expect(eventCategory("DBA_SIGNAL_RAISED")).toBe("monitoring");
  });
});

describe("groupByCorrelation", () => {
  it("groepeert per correlatie en sorteert binnen de keten oplopend op tijd", () => {
    const events = [
      evt({ id: "b", correlationId: "c1", occurredAt: new Date("2026-06-16T12:00:00Z") }),
      evt({ id: "a", correlationId: "c1", occurredAt: new Date("2026-06-16T10:00:00Z") }),
    ];
    const chains = groupByCorrelation(events);
    expect(chains).toHaveLength(1);
    const [chain] = chains;
    expect(chain?.correlationId).toBe("c1");
    expect(chain?.events.map((e) => e.id)).toEqual(["a", "b"]);
    expect(chain?.firstAt).toEqual(new Date("2026-06-16T10:00:00Z"));
    expect(chain?.latestAt).toEqual(new Date("2026-06-16T12:00:00Z"));
  });

  it("zet de nieuwste keten bovenaan", () => {
    const events = [
      evt({ id: "old", correlationId: "c1", occurredAt: new Date("2026-06-16T09:00:00Z") }),
      evt({ id: "new", correlationId: "c2", occurredAt: new Date("2026-06-16T15:00:00Z") }),
    ];
    const chains = groupByCorrelation(events);
    expect(chains.map((c) => c.correlationId)).toEqual(["c2", "c1"]);
  });

  it("maakt van elk event zonder correlatie een eigen losse keten", () => {
    const events = [
      evt({ id: "x", occurredAt: new Date("2026-06-16T10:00:00Z") }),
      evt({ id: "y", occurredAt: new Date("2026-06-16T11:00:00Z") }),
    ];
    const chains = groupByCorrelation(events);
    expect(chains).toHaveLength(2);
    expect(chains.every((c) => c.correlationId === null)).toBe(true);
    expect(chains.map((c) => c.events[0]?.id)).toEqual(["y", "x"]);
  });

  it("muteert de invoer niet", () => {
    const events = [
      evt({ id: "b", correlationId: "c1", occurredAt: new Date("2026-06-16T12:00:00Z") }),
      evt({ id: "a", correlationId: "c1", occurredAt: new Date("2026-06-16T10:00:00Z") }),
    ];
    const snapshot = events.map((e) => e.id);
    groupByCorrelation(events);
    expect(events.map((e) => e.id)).toEqual(snapshot);
  });

  it("is deterministisch bij gelijke tijdstippen (stabiel op id)", () => {
    const t = new Date("2026-06-16T10:00:00Z");
    const events = [
      evt({ id: "z", correlationId: "c1", occurredAt: t }),
      evt({ id: "a", correlationId: "c1", occurredAt: t }),
    ];
    expect(groupByCorrelation(events)[0]?.events.map((e) => e.id)).toEqual(["a", "z"]);
  });
});

describe("summarizeEventStream", () => {
  it("telt totaal, per categorie en onderscheiden cascades", () => {
    const events = [
      evt({ id: "1", type: "CONTRACT_SIGNED", correlationId: "c1" }),
      evt({ id: "2", type: "INVOICE_APPROVED", correlationId: "c1" }),
      evt({ id: "3", type: "DISPUTE_OPENED", correlationId: "c2" }),
      evt({ id: "4", type: "DBA_SIGNAL_RAISED" }), // los event
    ];
    const summary = summarizeEventStream(events);
    expect(summary.total).toBe(4);
    expect(summary.byCategory).toEqual({ core: 2, side: 1, monitoring: 1 });
    // c1 + c2 + 1 los event = 3 cascades
    expect(summary.cascades).toBe(3);
  });

  it("geeft nullen voor een lege selectie", () => {
    expect(summarizeEventStream([])).toEqual({
      total: 0,
      cascades: 0,
      byCategory: { core: 0, side: 0, monitoring: 0 },
    });
  });
});

describe("EVENT_TYPE_OPTIONS", () => {
  it("dekt elk domein-event-type met een label", () => {
    expect(EVENT_TYPE_OPTIONS.length).toBeGreaterThan(0);
    for (const { type, label } of EVENT_TYPE_OPTIONS) {
      expect(label).toBe(eventTypeLabel(type));
      expect(label).not.toBe(type);
    }
  });
});
