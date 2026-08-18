import { describe, expect, it } from "vitest";
import {
  CLIENT_IDLE_DAYS,
  buildClientActivityInputs,
  classifyClientHealth,
  clientHealthHeadline,
  clientHealthLabel,
  clientIdleDays,
  summarizeClientHealth,
  type ClientActivityInput,
} from "@/lib/franchise/client-health";

const NOW = new Date("2026-07-10T12:00:00Z");

function client(overrides: Partial<ClientActivityInput> = {}): ClientActivityInput {
  return {
    createdAt: new Date("2026-01-01T00:00:00Z"),
    publishedJobCount: 0,
    activeCollaborationCount: 0,
    lastActivityAt: null,
    ...overrides,
  };
}

describe("classifyClientHealth", () => {
  it("is active met een gepubliceerde opdracht", () => {
    expect(classifyClientHealth(client({ publishedJobCount: 2 }), NOW)).toBe("active");
  });

  it("is active met een lopende samenwerking (ook zonder open opdracht)", () => {
    expect(classifyClientHealth(client({ activeCollaborationCount: 1 }), NOW)).toBe("active");
  });

  it("is attention als de laatste activiteit ouder is dan de drempel", () => {
    const lastActivityAt = new Date(NOW.getTime() - (CLIENT_IDLE_DAYS + 5) * 24 * 60 * 60 * 1000);
    expect(classifyClientHealth(client({ lastActivityAt }), NOW)).toBe("attention");
  });

  it("is quiet als de laatste activiteit recent is", () => {
    const lastActivityAt = new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000);
    expect(classifyClientHealth(client({ lastActivityAt }), NOW)).toBe("quiet");
  });

  it("valt terug op createdAt als er nooit activiteit was — nieuw = quiet", () => {
    const createdAt = new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000);
    expect(classifyClientHealth(client({ createdAt, lastActivityAt: null }), NOW)).toBe("quiet");
  });

  it("valt terug op createdAt als er nooit activiteit was — lang stil = attention", () => {
    const createdAt = new Date(NOW.getTime() - (CLIENT_IDLE_DAYS + 1) * 24 * 60 * 60 * 1000);
    expect(classifyClientHealth(client({ createdAt, lastActivityAt: null }), NOW)).toBe(
      "attention",
    );
  });

  it("laat plaatsen winnen van een oude laatste-activiteit", () => {
    const lastActivityAt = new Date(NOW.getTime() - 100 * 24 * 60 * 60 * 1000);
    expect(classifyClientHealth(client({ publishedJobCount: 1, lastActivityAt }), NOW)).toBe(
      "active",
    );
  });

  it("is precies op de drempel al attention", () => {
    const lastActivityAt = new Date(NOW.getTime() - CLIENT_IDLE_DAYS * 24 * 60 * 60 * 1000);
    expect(classifyClientHealth(client({ lastActivityAt }), NOW)).toBe("attention");
  });
});

describe("summarizeClientHealth", () => {
  it("partitioneert in buckets die samen total vormen", () => {
    const oldDate = new Date(NOW.getTime() - 60 * 24 * 60 * 60 * 1000);
    const recentDate = new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000);
    const summary = summarizeClientHealth(
      [
        client({ publishedJobCount: 1 }),
        client({ activeCollaborationCount: 3 }),
        client({ lastActivityAt: oldDate }),
        client({ lastActivityAt: recentDate }),
        client({ createdAt: recentDate, lastActivityAt: null }),
      ],
      NOW,
    );
    expect(summary).toEqual({ total: 5, active: 2, attention: 1, quiet: 2 });
    expect(summary.active + summary.attention + summary.quiet).toBe(summary.total);
  });

  it("geeft een lege samenvatting bij geen klanten", () => {
    expect(summarizeClientHealth([], NOW)).toEqual({
      total: 0,
      active: 0,
      attention: 0,
      quiet: 0,
    });
  });
});

describe("clientHealthHeadline", () => {
  it("is null bij een lege lijst", () => {
    expect(clientHealthHeadline({ total: 0, active: 0, attention: 0, quiet: 0 })).toBeNull();
  });

  it("prioriteert de stilgevallen klanten (enkelvoud)", () => {
    const line = clientHealthHeadline({ total: 3, active: 2, attention: 1, quiet: 0 });
    expect(line).toContain("1 klant is stilgevallen");
  });

  it("prioriteert de stilgevallen klanten (meervoud)", () => {
    const line = clientHealthHeadline({ total: 4, active: 1, attention: 2, quiet: 1 });
    expect(line).toContain("2 klanten zijn stilgevallen");
  });

  it("meldt actieve plaatsingen als niets stil is", () => {
    const line = clientHealthHeadline({ total: 2, active: 2, attention: 0, quiet: 0 });
    expect(line).toContain("2 klanten plaatsen nu werk");
  });

  it("valt terug op de rustige melding zonder actieve of stille klanten", () => {
    const line = clientHealthHeadline({ total: 1, active: 0, attention: 0, quiet: 1 });
    expect(line).toContain("Nog geen lopende plaatsingen");
  });
});

describe("clientHealthLabel", () => {
  it("geeft label + toon per status", () => {
    expect(clientHealthLabel("active")).toEqual({ label: "Plaatst nu", tone: "success" });
    expect(clientHealthLabel("attention")).toEqual({ label: "Stilgevallen", tone: "warning" });
    expect(clientHealthLabel("quiet")).toEqual({ label: "Rustig", tone: "muted" });
  });
});

describe("clientIdleDays", () => {
  it("telt vanaf de laatste activiteit als die er is", () => {
    const lastActivityAt = new Date(NOW.getTime() - 12 * 24 * 60 * 60 * 1000);
    expect(clientIdleDays(client({ lastActivityAt }), NOW)).toBe(12);
  });

  it("valt terug op de aanmelddatum als er nooit activiteit was", () => {
    const createdAt = new Date(NOW.getTime() - 40 * 24 * 60 * 60 * 1000);
    expect(clientIdleDays(client({ createdAt, lastActivityAt: null }), NOW)).toBe(40);
  });
});

describe("buildClientActivityInputs", () => {
  const createdAt = new Date("2026-01-01T00:00:00Z");
  const olderJob = new Date("2026-05-01T00:00:00Z");
  const newerCollab = new Date("2026-06-01T00:00:00Z");

  it("kiest het recentste activiteitsmoment (open-opdracht vs. laatste samenwerking)", () => {
    const map = buildClientActivityInputs(
      [{ id: "c1", createdAt, activeCollaborationCount: 0 }],
      [{ companyId: "c1", _count: { _all: 3 }, _max: { createdAt: olderJob } }],
      [{ companyId: "c1", _max: { updatedAt: newerCollab } }],
    );
    const input = map.get("c1")!;
    expect(input.publishedJobCount).toBe(3);
    expect(input.lastActivityAt).toEqual(newerCollab);
  });

  it("laat lastActivityAt null als er geen enkele activiteit is (valt terug op aanmelddatum in de classificatie)", () => {
    const map = buildClientActivityInputs(
      [{ id: "c2", createdAt, activeCollaborationCount: 0 }],
      [],
      [],
    );
    const input = map.get("c2")!;
    expect(input.publishedJobCount).toBe(0);
    expect(input.lastActivityAt).toBeNull();
    expect(classifyClientHealth(input, NOW)).toBe("attention");
  });

  it("neemt de actieve-samenwerkingstelling over uit de bedrijf-rij", () => {
    const map = buildClientActivityInputs(
      [{ id: "c3", createdAt, activeCollaborationCount: 2 }],
      [],
      [],
    );
    expect(map.get("c3")!.activeCollaborationCount).toBe(2);
    expect(classifyClientHealth(map.get("c3")!, NOW)).toBe("active");
  });
});
