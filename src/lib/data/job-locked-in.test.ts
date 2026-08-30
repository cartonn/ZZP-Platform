import { describe, it, expect, vi, beforeEach } from "vitest";

// Test voor de gedeelde lockedIn-poort: welke opdrachten zijn al 'vergeven' (ACCEPTED-reactie of
// niet-geannuleerde samenwerking)? De selectie gebeurt in het DB-filter — we verifiëren dat het exacte
// predicaat wordt meegegeven (spiegelt getClientColdJobs/getClientOverdueJobs, geen drift), dat lege
// invoer geen query doet, en dat de teruggegeven set exact de DB-rijen bevat.

const state = vi.hoisted(() => ({
  rows: [] as { id: string }[],
  lastWhere: undefined as unknown,
}));

const jobFindMany = vi.fn(async (args: { where?: unknown }) => {
  state.lastWhere = args?.where;
  return state.rows;
});

vi.mock("@/lib/db", () => ({
  prisma: { job: { findMany: (a: unknown) => jobFindMany(a as never) } },
}));

import { lockedInJobIds } from "./job-locked-in";

describe("lockedInJobIds", () => {
  beforeEach(() => {
    state.rows = [];
    state.lastWhere = undefined;
    jobFindMany.mockClear();
  });

  it("doet geen query bij lege invoer en levert een lege set", async () => {
    const res = await lockedInJobIds([]);
    expect(res.size).toBe(0);
    expect(jobFindMany).not.toHaveBeenCalled();
  });

  it("geeft exact de door de DB teruggegeven job-ids als set terug", async () => {
    state.rows = [{ id: "job-a" }, { id: "job-c" }];
    const res = await lockedInJobIds(["job-a", "job-b", "job-c"]);
    expect([...res].sort()).toEqual(["job-a", "job-c"]);
  });

  it("hanteert het lockedIn-predicaat: id in set én (ACCEPTED-reactie óf niet-geannuleerde samenwerking)", async () => {
    await lockedInJobIds(["job-a", "job-b"]);
    expect(state.lastWhere).toEqual({
      id: { in: ["job-a", "job-b"] },
      OR: [
        { applications: { some: { status: "ACCEPTED" } } },
        { collaborations: { some: { status: { not: "CANCELLED" } } } },
      ],
    });
  });
});
