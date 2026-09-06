import { describe, expect, it } from "vitest";
import {
  CLIENT_CHURN_RISK_DAYS,
  CLIENT_IDLE_DAYS,
  buildClientActivityInputs,
  classifyClientHealth,
  clientAttentionChip,
  clientChurnRisk,
  clientHealthHeadline,
  clientHealthLabel,
  clientIdleDays,
  clientOutreachRank,
  summarizeClientHealth,
  type ClientActivityInput,
} from "@/lib/franchise/client-health";

/** Bouwt een klant die exact `days` dagen stil is (nooit geplaatst → valt terug op createdAt). */
function idleFor(days: number): ClientActivityInput {
  return client({ createdAt: new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000) });
}

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
    // oldDate = 60 dagen → attention én hoog churn-risico (≥ CLIENT_CHURN_RISK_DAYS).
    expect(summary).toEqual({ total: 5, active: 2, attention: 1, quiet: 2, attentionHigh: 1 });
    expect(summary.active + summary.attention + summary.quiet).toBe(summary.total);
    expect(summary.attentionHigh).toBeLessThanOrEqual(summary.attention);
  });

  it("telt attentionHigh alleen voor stilgevallen ≥ churn-drempel", () => {
    const summary = summarizeClientHealth(
      [idleFor(CLIENT_CHURN_RISK_DAYS), idleFor(CLIENT_CHURN_RISK_DAYS - 1), idleFor(2)],
      NOW,
    );
    expect(summary).toEqual({ total: 3, active: 0, attention: 2, quiet: 1, attentionHigh: 1 });
  });

  it("geeft een lege samenvatting bij geen klanten", () => {
    expect(summarizeClientHealth([], NOW)).toEqual({
      total: 0,
      active: 0,
      attention: 0,
      quiet: 0,
      attentionHigh: 0,
    });
  });
});

describe("clientHealthHeadline", () => {
  it("is null bij een lege lijst", () => {
    expect(
      clientHealthHeadline({ total: 0, active: 0, attention: 0, quiet: 0, attentionHigh: 0 }),
    ).toBeNull();
  });

  it("prioriteert de stilgevallen klanten (enkelvoud)", () => {
    const line = clientHealthHeadline({
      total: 3,
      active: 2,
      attention: 1,
      quiet: 0,
      attentionHigh: 0,
    });
    expect(line).toContain("1 klant is stilgevallen");
    expect(line).not.toContain("bel die eerst");
  });

  it("prioriteert de stilgevallen klanten (meervoud)", () => {
    const line = clientHealthHeadline({
      total: 4,
      active: 1,
      attention: 2,
      quiet: 1,
      attentionHigh: 0,
    });
    expect(line).toContain("2 klanten zijn stilgevallen");
  });

  it("licht de hoog-risico stilgevallen klanten eruit — bel die eerst", () => {
    const line = clientHealthHeadline({
      total: 5,
      active: 1,
      attention: 3,
      quiet: 1,
      attentionHigh: 2,
    });
    expect(line).toContain("3 klanten zijn stilgevallen");
    expect(line).toContain(`2 al langer dan ${CLIENT_CHURN_RISK_DAYS} dagen`);
    expect(line).toContain("bel die eerst");
  });

  it("meldt actieve plaatsingen als niets stil is", () => {
    const line = clientHealthHeadline({
      total: 2,
      active: 2,
      attention: 0,
      quiet: 0,
      attentionHigh: 0,
    });
    expect(line).toContain("2 klanten plaatsen nu werk");
  });

  it("valt terug op de rustige melding zonder actieve of stille klanten", () => {
    const line = clientHealthHeadline({
      total: 1,
      active: 0,
      attention: 0,
      quiet: 1,
      attentionHigh: 0,
    });
    expect(line).toContain("Nog geen lopende plaatsingen");
  });
});

describe("clientChurnRisk", () => {
  it("is none voor een klant die nu werk plaatst", () => {
    expect(clientChurnRisk(client({ publishedJobCount: 1 }), NOW)).toBe("none");
  });

  it("is none voor een recente, rustige klant", () => {
    expect(clientChurnRisk(idleFor(2), NOW)).toBe("none");
  });

  it("is watch net boven de aandachtsdrempel, onder de churn-drempel", () => {
    expect(clientChurnRisk(idleFor(CLIENT_IDLE_DAYS), NOW)).toBe("watch");
    expect(clientChurnRisk(idleFor(CLIENT_CHURN_RISK_DAYS - 1), NOW)).toBe("watch");
  });

  it("is high vanaf de churn-drempel", () => {
    expect(clientChurnRisk(idleFor(CLIENT_CHURN_RISK_DAYS), NOW)).toBe("high");
    expect(clientChurnRisk(idleFor(200), NOW)).toBe("high");
  });
});

describe("clientOutreachRank", () => {
  it("zet stilgevallen boven plaatsende boven rustige klanten", () => {
    const attention = clientOutreachRank(idleFor(40), NOW);
    const active = clientOutreachRank(client({ publishedJobCount: 1 }), NOW);
    const quiet = clientOutreachRank(idleFor(2), NOW);
    expect(attention).toBeGreaterThan(active);
    expect(active).toBeGreaterThan(quiet);
  });

  it("rangschikt de koudste stilgevallen klant het hoogst", () => {
    expect(clientOutreachRank(idleFor(90), NOW)).toBeGreaterThan(
      clientOutreachRank(idleFor(35), NOW),
    );
  });

  it("sorteert een lijst determinist naar de koudste-eerst-volgorde", () => {
    const items = [client({ publishedJobCount: 1 }), idleFor(35), idleFor(2), idleFor(90)];
    const order = items
      .map((c, i) => ({ i, rank: clientOutreachRank(c, NOW) }))
      .sort((a, b) => b.rank - a.rank)
      .map((x) => x.i);
    expect(order).toEqual([3, 1, 0, 2]); // idle90, idle35, active, quiet
  });
});

describe("clientAttentionChip", () => {
  it("is null voor een niet-stilgevallen klant", () => {
    expect(clientAttentionChip(client({ publishedJobCount: 1 }), NOW)).toBeNull();
    expect(clientAttentionChip(idleFor(2), NOW)).toBeNull();
  });

  it("toont de koude-duur met warning-toon onder de churn-drempel", () => {
    const chip = clientAttentionChip(idleFor(34), NOW);
    expect(chip).toEqual({ label: "Stilgevallen · 34 dagen", tone: "warning" });
  });

  it("escaleert naar 'Lang stil' met danger-toon vanaf de churn-drempel", () => {
    const chip = clientAttentionChip(idleFor(72), NOW);
    expect(chip).toEqual({ label: "Lang stil · 72 dagen", tone: "danger" });
  });

  it("gebruikt het meervoud op de aandachtsdrempel", () => {
    const chip = clientAttentionChip(idleFor(CLIENT_IDLE_DAYS), NOW);
    expect(chip?.label).toBe(`Stilgevallen · ${CLIENT_IDLE_DAYS} dagen`);
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
