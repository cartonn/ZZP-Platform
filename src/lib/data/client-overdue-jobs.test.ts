import { describe, it, expect, vi, beforeEach } from "vitest";

// Test voor de overdue-onbezette-opdrachten-helper: gepubliceerde opdrachten met een verstreken
// startdatum en niemand vastgelegd — de bron voor de /acties-taak. De DB-poort (PUBLISHED, startdatum
// vóór vandaag, geen ACCEPTED-reactie/niet-geannuleerde samenwerking) wordt in de query afgedwongen;
// hier verifiëren we de canonieke fase-poort (`summarizeStaffingRisk` → "overdue"), de aanbevolen-actie-
// afleiding uit de reactiestand en de meest-verstreken-eerst-ordening. Prisma is gemockt; de fase- en
// actie-logica komt uit de echte pure functie.

const NOW = new Date("2026-08-12T12:00:00.000Z");
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000);
const daysAhead = (d: number) => new Date(NOW.getTime() + d * 86_400_000);

interface JobRow {
  id: string;
  title: string;
  startDate: Date | null;
}

const state = vi.hoisted(() => ({
  jobs: [] as JobRow[],
  apps: [] as { jobId: string; status: string }[],
}));

const jobFindMany = vi.fn(async () =>
  state.jobs.map((j) => ({ id: j.id, title: j.title, startDate: j.startDate })),
);
const appFindMany = vi.fn(async (args: { where?: { jobId?: { in?: string[] } } }) => {
  const ids = args?.where?.jobId?.in ?? [];
  return state.apps.filter((a) => ids.includes(a.jobId));
});

vi.mock("@/lib/db", () => ({
  prisma: {
    job: { findMany: (...a: unknown[]) => jobFindMany(...(a as [])) },
    application: { findMany: (a: unknown) => appFindMany(a as never) },
  },
}));

import { getClientOverdueJobs } from "./client-overdue-jobs";

beforeEach(() => {
  state.jobs = [];
  state.apps = [];
  jobFindMany.mockClear();
  appFindMany.mockClear();
});

describe("getClientOverdueJobs", () => {
  it("markeert een verstreken opdracht met een shortlist → actie 'review_shortlist'", async () => {
    state.jobs = [{ id: "job-1", title: "Nachtdienst VVT", startDate: daysAgo(3) }];
    state.apps = [
      { jobId: "job-1", status: "SHORTLIST" },
      { jobId: "job-1", status: "NEW" },
    ];
    const overdue = await getClientOverdueJobs("u-1", NOW);
    expect(overdue).toEqual([
      { jobId: "job-1", title: "Nachtdienst VVT", daysUntilStart: -3, action: "review_shortlist" },
    ]);
  });

  it("leidt 'review_applicants' af bij losse reacties zonder shortlist", async () => {
    state.jobs = [{ id: "job-2", title: "Dagdienst", startDate: daysAgo(1) }];
    state.apps = [{ jobId: "job-2", status: "VIEWED" }];
    const overdue = await getClientOverdueJobs("u-1", NOW);
    expect(overdue).toEqual([
      { jobId: "job-2", title: "Dagdienst", daysUntilStart: -1, action: "review_applicants" },
    ]);
  });

  it("leidt 'widen_reach' af zonder enige actieve reactie", async () => {
    state.jobs = [{ id: "job-3", title: "Weekend", startDate: daysAgo(5) }];
    const overdue = await getClientOverdueJobs("u-1", NOW);
    expect(overdue).toEqual([
      { jobId: "job-3", title: "Weekend", daysUntilStart: -5, action: "widen_reach" },
    ]);
    // Reactie-query wordt altijd één keer gedaan zolang er kandidaat-opdrachten zijn.
    expect(appFindMany).toHaveBeenCalledTimes(1);
  });

  it("negeert reeds-ingetrokken reacties bij de actie-afleiding", async () => {
    state.jobs = [{ id: "job-4", title: "Vroege dienst", startDate: daysAgo(2) }];
    // Alleen een WITHDRAWN-reactie zou de query niet teruggeven (DB-filter status != WITHDRAWN);
    // de mock filtert daar niet op, dus we voeden alleen niet-ingetrokken rijen.
    state.apps = [{ jobId: "job-4", status: "NEW" }];
    const overdue = await getClientOverdueJobs("u-1", NOW);
    expect(overdue[0]?.action).toBe("review_applicants");
  });

  it("valt terug op de canonieke fase-poort: een opdracht die niet 'overdue' is wordt gedropt", async () => {
    // Belt-and-suspenders: mocht de DB-poort ooit een niet-verstreken opdracht teruggeven, dan houdt
    // `summarizeStaffingRisk` (phase !== "overdue") 'm alsnog buiten de next-action.
    state.jobs = [
      { id: "job-future", title: "Toekomst", startDate: daysAhead(4) },
      { id: "job-nodate", title: "Zonder datum", startDate: null },
      { id: "job-overdue", title: "Verstreken", startDate: daysAgo(2) },
    ];
    const overdue = await getClientOverdueJobs("u-1", NOW);
    expect(overdue.map((o) => o.jobId)).toEqual(["job-overdue"]);
  });

  it("behoudt de meest-verstreken-eerst-ordening uit de query", async () => {
    state.jobs = [
      { id: "job-oldest", title: "Oudste", startDate: daysAgo(10) },
      { id: "job-mid", title: "Midden", startDate: daysAgo(4) },
      { id: "job-recent", title: "Recent", startDate: daysAgo(1) },
    ];
    const overdue = await getClientOverdueJobs("u-1", NOW);
    expect(overdue.map((o) => o.jobId)).toEqual(["job-oldest", "job-mid", "job-recent"]);
  });

  it("doet geen reactie-query zonder kandidaat-opdrachten", async () => {
    const overdue = await getClientOverdueJobs("u-1", NOW);
    expect(overdue).toEqual([]);
    expect(appFindMany).not.toHaveBeenCalled();
  });
});
