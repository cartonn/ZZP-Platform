import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildWorkedHoursTrend, type WorkedHoursRow } from "./worked-hours-trend";

const findMany = vi.fn();
vi.mock("@/lib/db", () => ({ prisma: { performance: { findMany: (a: unknown) => findMany(a) } } }));

// Vast referentiemoment (Europe/Amsterdam ≈ UTC+2 in augustus). Anker ligt op de 15e.
const NOW = new Date("2026-08-15T12:00:00Z");

function row(iso: string, hours: number): WorkedHoursRow {
  return { occurredAt: new Date(iso), hours };
}

describe("buildWorkedHoursTrend", () => {
  it("bouwt een venster van `months` maanden, oud → nieuw, eindigend op de maand van now", () => {
    const t = buildWorkedHoursTrend([], NOW, 6);
    expect(t.series).toHaveLength(6);
    expect(t.series.at(-1)?.key).toBe("2026-08");
    expect(t.series[0]?.key).toBe("2026-03");
    expect(t.months).toBe(6);
    expect(t.hasData).toBe(false);
  });

  it("sommeert uren per kalendermaand (Europe/Amsterdam)", () => {
    const t = buildWorkedHoursTrend(
      [
        row("2026-08-03T09:00:00Z", 8),
        row("2026-08-20T09:00:00Z", 6),
        row("2026-07-10T09:00:00Z", 4),
      ],
      NOW,
      6,
    );
    const aug = t.series.find((m) => m.key === "2026-08");
    const jul = t.series.find((m) => m.key === "2026-07");
    expect(aug?.hours).toBe(14);
    expect(jul?.hours).toBe(4);
    expect(t.totalHours).toBe(18);
    expect(t.currentHours).toBe(14);
    expect(t.hasData).toBe(true);
  });

  it("bewaart kwartier-precisie exact (geen float-drift)", () => {
    const t = buildWorkedHoursTrend(
      [row("2026-08-01T09:00:00Z", 7.25), row("2026-08-02T09:00:00Z", 0.1)],
      NOW,
      6,
    );
    expect(t.series.find((m) => m.key === "2026-08")?.hours).toBe(7.35);
  });

  it("laat uren buiten het venster vallen", () => {
    const t = buildWorkedHoursTrend([row("2025-12-31T12:00:00Z", 40)], NOW, 6);
    expect(t.totalHours).toBe(0);
    expect(t.hasData).toBe(false);
  });

  it("berekent de maand-op-maand-delta alleen bij een vergelijkbare basis", () => {
    // Vorige maand (juli) 10 u, lopende maand (augustus) 15 u → +50%.
    const up = buildWorkedHoursTrend(
      [row("2026-07-05T09:00:00Z", 10), row("2026-08-05T09:00:00Z", 15)],
      NOW,
      6,
    );
    expect(up.deltaPct).toBe(50);

    // Lopende maand nog leeg → null i.p.v. een misleidende -100%.
    const empty = buildWorkedHoursTrend([row("2026-07-05T09:00:00Z", 10)], NOW, 6);
    expect(empty.deltaPct).toBeNull();
  });

  it("respecteert een niet-standaard venstergrootte", () => {
    const t = buildWorkedHoursTrend([], NOW, 3);
    expect(t.series).toHaveLength(3);
    expect(t.series[0]?.key).toBe("2026-06");
    expect(t.series.at(-1)?.key).toBe("2026-08");
  });
});

describe("getFreelancerWorkedHoursTrend", () => {
  beforeEach(() => findMany.mockReset());

  it("scoopt op de eigen samenwerkingen (freelancer.userId) met de juiste status/type/venster", async () => {
    const { getFreelancerWorkedHoursTrend } = await import("./worked-hours-trend");
    findMany.mockResolvedValue([]);
    await getFreelancerWorkedHoursTrend("zzp-1", NOW, 6);

    expect(findMany).toHaveBeenCalledTimes(1);
    const where = (
      findMany.mock.calls[0]?.[0] as {
        where: {
          status: string;
          type: string;
          collaboration: unknown;
          OR: Array<{ periodEnd: { gte: Date } }>;
        };
      }
    ).where;
    expect(where.status).toBe("APPROVED");
    expect(where.type).toBe("HOURS");
    expect(where.collaboration).toEqual({ freelancer: { userId: "zzp-1" } });
    expect(where.OR[0]?.periodEnd.gte.toISOString()).toBe("2026-03-01T00:00:00.000Z");
  });
});

describe("getClientWorkedHoursTrend", () => {
  beforeEach(() => findMany.mockReset());

  it("scoopt op de samenwerkingen van het bedrijf (company.userId) met de juiste status/type/venster", async () => {
    const { getClientWorkedHoursTrend } = await import("./worked-hours-trend");
    findMany.mockResolvedValue([]);
    await getClientWorkedHoursTrend("client-1", NOW, 6);

    expect(findMany).toHaveBeenCalledTimes(1);
    const where = (
      findMany.mock.calls[0]?.[0] as {
        where: {
          status: string;
          type: string;
          collaboration: unknown;
          OR: Array<{ periodEnd: { gte: Date } }>;
        };
      }
    ).where;
    expect(where.status).toBe("APPROVED");
    expect(where.type).toBe("HOURS");
    expect(where.collaboration).toEqual({ company: { userId: "client-1" } });
    // Venstervloer = eerste dag van de vroegste maand (mrt 2026 bij 6 mnd vanaf aug).
    expect(where.OR[0]?.periodEnd.gte.toISOString()).toBe("2026-03-01T00:00:00.000Z");
  });

  it("aggregeert de afgenomen uren per maand uit de gescoopte prestaties", async () => {
    const { getClientWorkedHoursTrend } = await import("./worked-hours-trend");
    findMany.mockResolvedValue([
      {
        hours: 8,
        periodEnd: new Date("2026-08-03T09:00:00Z"),
        periodStart: null,
        approvedAt: null,
      },
      {
        hours: 6,
        periodEnd: new Date("2026-08-20T09:00:00Z"),
        periodStart: null,
        approvedAt: null,
      },
      {
        hours: 4,
        periodEnd: new Date("2026-07-10T09:00:00Z"),
        periodStart: null,
        approvedAt: null,
      },
    ]);
    const t = await getClientWorkedHoursTrend("client-1", NOW, 6);
    expect(t.series.find((m) => m.key === "2026-08")?.hours).toBe(14);
    expect(t.series.find((m) => m.key === "2026-07")?.hours).toBe(4);
    expect(t.totalHours).toBe(18);
    expect(t.hasData).toBe(true);
  });

  it("valt terug op periode-begin en goedkeuringsdatum als het periode-einde ontbreekt", async () => {
    const { getClientWorkedHoursTrend } = await import("./worked-hours-trend");
    findMany.mockResolvedValue([
      {
        hours: 3,
        periodEnd: null,
        periodStart: new Date("2026-08-02T09:00:00Z"),
        approvedAt: null,
      },
      {
        hours: 2,
        periodEnd: null,
        periodStart: null,
        approvedAt: new Date("2026-07-02T09:00:00Z"),
      },
    ]);
    const t = await getClientWorkedHoursTrend("client-1", NOW, 6);
    expect(t.series.find((m) => m.key === "2026-08")?.hours).toBe(3);
    expect(t.series.find((m) => m.key === "2026-07")?.hours).toBe(2);
  });

  it("kiest het periode-einde boven periode-begin én goedkeuringsdatum als alle drie aanwezig zijn", async () => {
    const { getClientWorkedHoursTrend } = await import("./worked-hours-trend");
    // Periode-begin (juli) en goedkeuring (juni) liggen in andere maanden dan het periode-einde
    // (augustus). De uren horen in augustus te vallen — periode-einde wint de bucketkeuze.
    findMany.mockResolvedValue([
      {
        hours: 5,
        periodEnd: new Date("2026-08-28T09:00:00Z"),
        periodStart: new Date("2026-07-01T09:00:00Z"),
        approvedAt: new Date("2026-06-15T09:00:00Z"),
      },
    ]);
    const t = await getClientWorkedHoursTrend("client-1", NOW, 6);
    expect(t.series.find((m) => m.key === "2026-08")?.hours).toBe(5);
    expect(t.series.find((m) => m.key === "2026-07")?.hours).toBe(0);
    expect(t.series.find((m) => m.key === "2026-06")?.hours).toBe(0);
  });

  it("behandelt null-uren als nul", async () => {
    const { getClientWorkedHoursTrend } = await import("./worked-hours-trend");
    findMany.mockResolvedValue([
      {
        hours: null,
        periodEnd: new Date("2026-08-03T09:00:00Z"),
        periodStart: null,
        approvedAt: null,
      },
    ]);
    const t = await getClientWorkedHoursTrend("client-1", NOW, 6);
    expect(t.totalHours).toBe(0);
    expect(t.hasData).toBe(false);
  });
});
