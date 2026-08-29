import { describe, it, expect, vi, beforeEach } from "vitest";

// Test voor de gedeelde koud-lopende-opdrachten-helper: gepubliceerde, ongevulde opdrachten die om
// bijsturen vragen (`summarizeVacancyPerformance.attention`) — de ÉNE bron voor de /acties-taak én de
// /opdrachten-badge. Verifieert de pre-filter op de reactie-telling, de attentie-classificatie en de
// deterministische ordering. Prisma is gemockt; de koud-drempels komen uit de echte pure functie.

const NOW = new Date("2026-08-12T12:00:00.000Z");
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000);

interface JobRow {
  id: string;
  title: string;
  publishedAt: Date | null;
  createdAt: Date;
  applicationCount: number;
}

const state = vi.hoisted(() => ({
  jobs: [] as JobRow[],
  apps: [] as { jobId: string; createdAt: Date }[],
}));

const jobFindMany = vi.fn(async (_args?: { where?: Record<string, unknown> }) =>
  state.jobs.map((j) => ({
    id: j.id,
    title: j.title,
    publishedAt: j.publishedAt,
    createdAt: j.createdAt,
    _count: { applications: j.applicationCount },
  })),
);
const appFindMany = vi.fn(async (args: { where?: { jobId?: { in?: string[] } } }) => {
  const ids = args?.where?.jobId?.in ?? [];
  return state.apps.filter((a) => ids.includes(a.jobId));
});

vi.mock("@/lib/db", () => ({
  prisma: {
    job: { findMany: (a: unknown) => jobFindMany(a as never) },
    application: { findMany: (a: unknown) => appFindMany(a as never) },
  },
}));

import { getClientColdJobs } from "./client-cold-jobs";

beforeEach(() => {
  state.jobs = [];
  state.apps = [];
  jobFindMany.mockClear();
  appFindMany.mockClear();
});

describe("getClientColdJobs", () => {
  it("markeert een lang-open opdracht zonder reacties als koud (attention)", async () => {
    state.jobs = [
      {
        id: "job-cold",
        title: "Nachtdienst VVT",
        publishedAt: daysAgo(14),
        createdAt: daysAgo(14),
        applicationCount: 0,
      },
    ];
    const cold = await getClientColdJobs("u-1", NOW);
    expect(cold).toEqual([
      { jobId: "job-cold", title: "Nachtdienst VVT", headline: "Weinig respons" },
    ]);
  });

  it("sluit een opdracht met genoeg reacties uit via de pre-filter (geen reactie-fetch nodig)", async () => {
    state.jobs = [
      {
        id: "job-busy",
        title: "Populair",
        publishedAt: daysAgo(14),
        createdAt: daysAgo(14),
        applicationCount: 5,
      },
    ];
    const cold = await getClientColdJobs("u-1", NOW);
    expect(cold).toEqual([]);
    // De kandidaat-set is leeg → er wordt geen reactie-query gedaan.
    expect(appFindMany).not.toHaveBeenCalled();
  });

  it("sluit een verse opdracht zonder reacties uit (net geplaatst, nog niet koud)", async () => {
    state.jobs = [
      {
        id: "job-fresh",
        title: "Vers",
        publishedAt: daysAgo(1),
        createdAt: daysAgo(1),
        applicationCount: 0,
      },
    ];
    const cold = await getClientColdJobs("u-1", NOW);
    expect(cold).toEqual([]);
  });

  it("gebruikt de echte reactie-tijdstempels voor de attentie-beslissing", async () => {
    // 2 reacties, beide oud (>momentum-venster) → stil gevallen, count < 3 → attention.
    state.jobs = [
      {
        id: "job-quiet",
        title: "Stil",
        publishedAt: daysAgo(20),
        createdAt: daysAgo(20),
        applicationCount: 2,
      },
    ];
    state.apps = [
      { jobId: "job-quiet", createdAt: daysAgo(18) },
      { jobId: "job-quiet", createdAt: daysAgo(17) },
    ];
    const cold = await getClientColdJobs("u-1", NOW);
    expect(cold.map((c) => c.jobId)).toEqual(["job-quiet"]);
    expect(appFindMany).toHaveBeenCalledTimes(1);
  });

  it("geeft niets terug wanneer er geen gepubliceerde ongevulde opdrachten zijn", async () => {
    const cold = await getClientColdJobs("u-1", NOW);
    expect(cold).toEqual([]);
    expect(appFindMany).not.toHaveBeenCalled();
  });

  it("sluit een vastgelegde opdracht DB-side uit: geen ACCEPTED-reactie én geen niet-geannuleerde samenwerking (lockedIn-poort)", async () => {
    // Regressie: een reeds-geaccepteerde kandidaat (ACCEPTED-reactie, propose-limbo) of een PROPOSED-
    // samenwerking betekent "iemand vastgelegd" → de opdracht mag níét als "weinig respons" verschijnen
    // (dat sprak de gelijktijdige "rond de hire af"/"onderteken het contract"-actie tegen). De poort
    // moet de lockedIn-uitsluiting van getClientOverdueJobs spiegelen, niet alleen ACTIVE uitsluiten.
    state.jobs = [
      {
        id: "job-x",
        title: "X",
        publishedAt: daysAgo(14),
        createdAt: daysAgo(14),
        applicationCount: 0,
      },
    ];
    await getClientColdJobs("u-1", NOW);
    const where = (jobFindMany.mock.calls[0]?.[0]?.where ?? {}) as Record<
      string,
      Record<string, unknown>
    >;
    expect(where.applications).toEqual({ none: { status: "ACCEPTED" } });
    expect(where.collaborations).toEqual({ none: { status: { not: "CANCELLED" } } });
    // De oude, te smalle poort (alleen ACTIVE) mag niet terugkeren.
    expect(where.collaborations).not.toEqual({ none: { status: "ACTIVE" } });
  });
});
