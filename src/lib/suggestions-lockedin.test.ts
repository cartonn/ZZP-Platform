import { describe, it, expect, vi, beforeEach } from "vitest";

// Poort-test: de opdrachtgever-suggesties ("Voorgestelde/Geschikte ZZP'ers") en de daarop steunende
// "Nodig alle uit"-actie mogen géén kandidaten werven voor een reeds-vergeven opdracht — een opdracht
// met een ACCEPTED-reactie (propose-limbo) óf een niet-geannuleerde samenwerking. De opdracht blijft
// PUBLISHED zolang de hire loopt, dus de status-poort alleen volstaat niet; `lockedInJobIds` is de
// canonieke bron (zelfde predikaat als `getClientColdJobs`). Prisma is gemockt.

interface JobRow {
  id: string;
  status: string;
  tenantId: string | null;
  locked: boolean;
}

const state = vi.hoisted(() => ({
  jobs: [] as JobRow[],
  companyId: "company-1" as string | null,
  profileScans: 0,
}));

// `lockedInJobIds` gebruikt `job.findMany` met `where.id.in` + de OR-poort; de client-aggregatie
// gebruikt `job.findMany` met `where.companyId`. We routeren op de vorm van de where-clause.
const jobFindMany = vi.fn(
  async (args: { where?: { id?: { in?: string[] }; companyId?: string; OR?: unknown } }) => {
    const where = args?.where ?? {};
    if (where.OR && where.id?.in) {
      // lockedInJobIds: geef alleen de vergeven ids terug.
      const ids = where.id.in;
      return state.jobs.filter((j) => j.locked && ids.includes(j.id)).map((j) => ({ id: j.id }));
    }
    // Client-aggregatie: gepubliceerde opdrachten van dit bedrijf.
    return state.jobs
      .filter((j) => j.status === "PUBLISHED")
      .map((j) => ({
        id: j.id,
        title: `Opdracht ${j.id}`,
        description: null,
        industryId: null,
        rateMin: null,
        rateMax: null,
        workMode: "ONSITE",
        location: null,
        tenantId: j.tenantId,
        status: j.status,
        skills: [],
        credentialRequirements: [],
        applications: [],
      }));
  },
);

const jobFindUnique = vi.fn(async (args: { where: { id: string } }) => {
  const j = state.jobs.find((x) => x.id === args.where.id);
  if (!j) return null;
  return {
    id: j.id,
    title: `Opdracht ${j.id}`,
    description: null,
    industryId: null,
    rateMin: null,
    rateMax: null,
    workMode: "ONSITE",
    location: null,
    tenantId: j.tenantId,
    status: j.status,
    skills: [],
    credentialRequirements: [],
    applications: [],
  };
});

const profileFindMany = vi.fn(async () => {
  state.profileScans += 1;
  return [];
});

const companyFindUnique = vi.fn(async () => (state.companyId ? { id: state.companyId } : null));

vi.mock("@/lib/db", () => ({
  prisma: {
    job: {
      findMany: (a: unknown) => jobFindMany(a as never),
      findUnique: (a: unknown) => jobFindUnique(a as never),
    },
    freelancerProfile: { findMany: () => profileFindMany() },
    company: { findUnique: () => companyFindUnique() },
  },
}));

import { suggestedFreelancersForJob, suggestedFreelancersForClient } from "./suggestions";

beforeEach(() => {
  state.jobs = [];
  state.companyId = "company-1";
  state.profileScans = 0;
  jobFindMany.mockClear();
  jobFindUnique.mockClear();
  profileFindMany.mockClear();
  companyFindUnique.mockClear();
});

describe("suggestedFreelancersForJob — reeds-vergeven poort", () => {
  it("geeft geen suggesties voor een vergeven opdracht en scant de profiel-pool niet", async () => {
    state.jobs = [{ id: "job-locked", status: "PUBLISHED", tenantId: "t1", locked: true }];
    const out = await suggestedFreelancersForJob("job-locked");
    expect(out).toEqual([]);
    // De poort staat vóór de zware findMany: een vergeven opdracht draait die niet eens.
    expect(state.profileScans).toBe(0);
  });

  it("scant de profiel-pool wel voor een nog-onvergeven gepubliceerde opdracht", async () => {
    state.jobs = [{ id: "job-open", status: "PUBLISHED", tenantId: "t1", locked: false }];
    const out = await suggestedFreelancersForJob("job-open");
    expect(out).toEqual([]); // lege pool → geen suggesties, maar de scan draaide
    expect(state.profileScans).toBe(1);
  });

  it("geeft niets voor een niet-gepubliceerde opdracht (bestaande poort blijft)", async () => {
    state.jobs = [{ id: "job-draft", status: "DRAFT", tenantId: "t1", locked: false }];
    const out = await suggestedFreelancersForJob("job-draft");
    expect(out).toEqual([]);
    expect(state.profileScans).toBe(0);
  });
});

describe("suggestedFreelancersForClient — reeds-vergeven poort", () => {
  it("sluit vergeven opdrachten uit de aggregatie uit (geen profiel-scan voor die tenant)", async () => {
    // Eén enkele opdracht, vergeven → geen enkele tenant hoeft gescand.
    state.jobs = [{ id: "job-locked", status: "PUBLISHED", tenantId: "t1", locked: true }];
    const out = await suggestedFreelancersForClient("user-1");
    expect(out).toEqual([]);
    expect(state.profileScans).toBe(0);
  });

  it("aggregeert wel over een onvergeven gepubliceerde opdracht", async () => {
    state.jobs = [{ id: "job-open", status: "PUBLISHED", tenantId: "t1", locked: false }];
    const out = await suggestedFreelancersForClient("user-1");
    expect(out).toEqual([]); // lege pool
    // De pool voor de enige tenant is éénmaal gescand.
    expect(state.profileScans).toBe(1);
  });
});
