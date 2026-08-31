// Tests voor de freelancer-gescoopte idle-capacity-loader. Borgt (1) de eigenaar-scoping van beide
// queries, (2) de lege-uitkomst zonder profiel, en (3+4) dat de loader dezelfde open/geboekte-logica
// oplevert als `findIdleCapacity` op de reeds bestaande `/beschikbaarheid`-kaart (geen drift).

import { beforeEach, describe, expect, it, vi } from "vitest";

type FindManyArgs = { where?: Record<string, unknown>; select?: unknown; orderBy?: unknown };

let profileRow: { id: string } | null = null;
let windowRows: Array<{ startDate: Date; endDate: Date; type: string }> = [];
let collabRows: Array<{ status: string; startDate: Date | null; endDate: Date | null }> = [];
let windowFindManyArgs: FindManyArgs | null = null;
let collabFindManyArgs: FindManyArgs | null = null;
let profileFindUniqueArgs: unknown = null;

vi.mock("@/lib/db", () => ({
  prisma: {
    freelancerProfile: {
      findUnique: vi.fn(async (args: unknown) => {
        profileFindUniqueArgs = args;
        return profileRow;
      }),
    },
    availabilityWindow: {
      findMany: vi.fn(async (args: FindManyArgs) => {
        windowFindManyArgs = args;
        return windowRows;
      }),
    },
    collaboration: {
      findMany: vi.fn(async (args: FindManyArgs) => {
        collabFindManyArgs = args;
        return collabRows;
      }),
    },
  },
}));

import { getFreelancerIdleCapacity } from "./freelancer-idle-capacity";

const NOW = new Date("2026-08-31T12:00:00.000Z");
const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

beforeEach(() => {
  profileRow = { id: "fp-1" };
  windowRows = [];
  collabRows = [];
  windowFindManyArgs = null;
  collabFindManyArgs = null;
  profileFindUniqueArgs = null;
});

describe("getFreelancerIdleCapacity", () => {
  it("geeft een lege idle-capacity terug zonder profiel en bevraagt geen vensters/collabs", async () => {
    profileRow = null;
    const result = await getFreelancerIdleCapacity("u-1", NOW);
    expect(result).toEqual({ openRanges: [], totalOpenDays: 0, hasAny: false });
    expect(windowFindManyArgs).toBeNull();
    expect(collabFindManyArgs).toBeNull();
    expect(profileFindUniqueArgs).toEqual({ where: { userId: "u-1" }, select: { id: true } });
  });

  it("scoopt beide queries op de eigenaar (freelancerProfileId + freelancerId/status)", async () => {
    profileRow = { id: "fp-42" };
    await getFreelancerIdleCapacity("u-42", NOW);
    expect(windowFindManyArgs?.where).toEqual({ freelancerProfileId: "fp-42" });
    expect(collabFindManyArgs?.where).toEqual({
      freelancerId: "fp-42",
      status: { in: ["PROPOSED", "ACTIVE"] },
    });
  });

  it("markeert open dagen als een AVAILABLE-venster niet geboekt is", async () => {
    windowRows = [{ startDate: day("2026-09-01"), endDate: day("2026-09-14"), type: "AVAILABLE" }];
    collabRows = [];
    const result = await getFreelancerIdleCapacity("u-1", NOW);
    expect(result.hasAny).toBe(true);
    expect(result.totalOpenDays).toBeGreaterThan(0);
  });

  it("geeft geen open dagen als een ACTIVE-samenwerking het venster volledig dekt", async () => {
    windowRows = [{ startDate: day("2026-09-01"), endDate: day("2026-09-14"), type: "AVAILABLE" }];
    collabRows = [{ status: "ACTIVE", startDate: day("2026-09-01"), endDate: day("2026-09-14") }];
    const result = await getFreelancerIdleCapacity("u-1", NOW);
    expect(result.hasAny).toBe(false);
    expect(result.totalOpenDays).toBe(0);
  });
});
