import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildHourlyRateTrend, type HourlyRateRow } from "./hourly-rate-trend";

const findMany = vi.fn();
vi.mock("@/lib/db", () => ({ prisma: { performance: { findMany: (a: unknown) => findMany(a) } } }));

// Vast referentiemoment (Europe/Amsterdam ≈ UTC+2 in augustus). Anker ligt op de 15e.
const NOW = new Date("2026-08-15T12:00:00Z");

function row(iso: string, hours: number, rateCents: number): HourlyRateRow {
  return { occurredAt: new Date(iso), hours, rateCents };
}

describe("buildHourlyRateTrend", () => {
  it("bouwt een venster van `months` maanden, oud → nieuw, eindigend op de maand van now", () => {
    const t = buildHourlyRateTrend([], NOW, 6);
    expect(t.series).toHaveLength(6);
    expect(t.series.at(-1)?.key).toBe("2026-08");
    expect(t.series[0]?.key).toBe("2026-03");
    expect(t.months).toBe(6);
    expect(t.hasData).toBe(false);
    expect(t.currentRateCents).toBeNull();
    expect(t.averageRateCents).toBeNull();
  });

  it("berekent een NAAR UREN GEWOGEN gemiddelde, niet het rekenkundig gemiddelde", () => {
    // 100 u à €80 + 4 u à €40 → (100×8000 + 4×4000) / 104 = 816000/104 ≈ €78,46/u, niet €60/u.
    const t = buildHourlyRateTrend(
      [row("2026-08-03T09:00:00Z", 100, 8000), row("2026-08-10T09:00:00Z", 4, 4000)],
      NOW,
      6,
    );
    const aug = t.series.find((m) => m.key === "2026-08");
    expect(aug?.hours).toBe(104);
    expect(aug?.rateCents).toBe(7846); // Math.round(816000*100 / 10400)
    expect(t.currentRateCents).toBe(7846);
    expect(t.hasData).toBe(true);
  });

  it("groepeert per kalendermaand (Europe/Amsterdam) met een eigen tarief per maand", () => {
    const t = buildHourlyRateTrend(
      [
        row("2026-08-03T09:00:00Z", 10, 9000), // aug: 10 u à €90
        row("2026-07-10T09:00:00Z", 20, 6000), // jul: 20 u à €60
      ],
      NOW,
      6,
    );
    expect(t.series.find((m) => m.key === "2026-08")?.rateCents).toBe(9000);
    expect(t.series.find((m) => m.key === "2026-07")?.rateCents).toBe(6000);
    // Venstergemiddelde is óók naar uren gewogen: (10×9000 + 20×6000)/30 = 210000/30 = €70/u.
    expect(t.averageRateCents).toBe(7000);
  });

  it("laat een maand zonder uren op null staan (geen misleidende €0/u)", () => {
    const t = buildHourlyRateTrend([row("2026-07-05T09:00:00Z", 8, 7500)], NOW, 6);
    expect(t.series.find((m) => m.key === "2026-08")?.rateCents).toBeNull();
    expect(t.series.find((m) => m.key === "2026-07")?.rateCents).toBe(7500);
  });

  it("bewaart kwartier-precisie in de weging (geen float-drift)", () => {
    // 7,25 u à €80 + 0,75 u à €80 = 8 u à €80 → €80/u.
    const t = buildHourlyRateTrend(
      [row("2026-08-01T09:00:00Z", 7.25, 8000), row("2026-08-02T09:00:00Z", 0.75, 8000)],
      NOW,
      6,
    );
    expect(t.series.find((m) => m.key === "2026-08")?.rateCents).toBe(8000);
  });

  it("laat werk buiten het venster vallen", () => {
    const t = buildHourlyRateTrend([row("2025-12-31T12:00:00Z", 40, 8000)], NOW, 6);
    expect(t.averageRateCents).toBeNull();
    expect(t.hasData).toBe(false);
  });

  it("berekent de maand-op-maand-delta alleen bij een vergelijkbare basis", () => {
    // Vorige maand (juli) €60/u, lopende maand (augustus) €75/u → +25%.
    const up = buildHourlyRateTrend(
      [row("2026-07-05T09:00:00Z", 10, 6000), row("2026-08-05T09:00:00Z", 10, 7500)],
      NOW,
      6,
    );
    expect(up.deltaPct).toBe(25);

    // Lopende maand nog geen uren → null i.p.v. een misleidende -100%.
    const empty = buildHourlyRateTrend([row("2026-07-05T09:00:00Z", 10, 6000)], NOW, 6);
    expect(empty.deltaPct).toBeNull();
  });

  it("respecteert een niet-standaard venstergrootte", () => {
    const t = buildHourlyRateTrend([], NOW, 3);
    expect(t.series).toHaveLength(3);
    expect(t.series[0]?.key).toBe("2026-06");
    expect(t.series.at(-1)?.key).toBe("2026-08");
  });
});

describe("getClientHourlyRateTrend", () => {
  beforeEach(() => findMany.mockReset());

  it("scoopt op de samenwerkingen van het bedrijf (company.userId) met de juiste status/type/venster", async () => {
    const { getClientHourlyRateTrend } = await import("./hourly-rate-trend");
    findMany.mockResolvedValue([]);
    await getClientHourlyRateTrend("client-1", NOW, 6);

    expect(findMany).toHaveBeenCalledTimes(1);
    const where = findMany.mock.calls[0][0].where;
    expect(where.status).toBe("APPROVED");
    expect(where.type).toBe("HOURS");
    expect(where.collaboration).toEqual({ company: { userId: "client-1" } });
    // Venstervloer = eerste dag van de vroegste maand (mrt 2026 bij 6 mnd vanaf aug).
    expect(where.OR[0].periodEnd.gte.toISOString()).toBe("2026-03-01T00:00:00.000Z");
  });

  it("aggregeert de gescoopte prestaties als een gewogen gemiddelde en filtert nul-uren/nul-tarief eruit", async () => {
    const { getClientHourlyRateTrend } = await import("./hourly-rate-trend");
    findMany.mockResolvedValue([
      {
        hours: 10,
        rateCents: 9000,
        periodEnd: new Date("2026-08-03T09:00:00Z"),
        periodStart: null,
        approvedAt: null,
      },
      {
        hours: 0,
        rateCents: 8000,
        periodEnd: new Date("2026-08-04T09:00:00Z"),
        periodStart: null,
        approvedAt: null,
      },
      {
        hours: 5,
        rateCents: 0,
        periodEnd: new Date("2026-08-05T09:00:00Z"),
        periodStart: null,
        approvedAt: null,
      },
    ]);
    const t = await getClientHourlyRateTrend("client-1", NOW, 6);
    // Alleen de eerste rij telt: 10 u à €90 → €90/u.
    expect(t.series.find((m) => m.key === "2026-08")?.rateCents).toBe(9000);
    expect(t.averageRateCents).toBe(9000);
  });

  it("valt terug op periode-begin en goedkeuringsdatum als het periode-einde ontbreekt", async () => {
    const { getClientHourlyRateTrend } = await import("./hourly-rate-trend");
    findMany.mockResolvedValue([
      {
        hours: 4,
        rateCents: 5000,
        periodEnd: null,
        periodStart: new Date("2026-07-10T09:00:00Z"),
        approvedAt: null,
      },
      {
        hours: 4,
        rateCents: 7000,
        periodEnd: null,
        periodStart: null,
        approvedAt: new Date("2026-08-10T09:00:00Z"),
      },
    ]);
    const t = await getClientHourlyRateTrend("client-1", NOW, 6);
    expect(t.series.find((m) => m.key === "2026-07")?.rateCents).toBe(5000);
    expect(t.series.find((m) => m.key === "2026-08")?.rateCents).toBe(7000);
  });
});
