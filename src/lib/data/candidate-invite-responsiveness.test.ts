import { describe, it, expect, vi, beforeEach } from "vitest";

// Data-laag-test voor het reactiesnelheid-signaal op uitnodigingen. Kern van deze test: de
// teller/noemer die de badge-tooltip toont ("reageerde op X van de Y uitnodigingen") mag UITSLUITEND
// uitnodigingen van de *kijkende* opdrachtgever (`companyId`) meetellen. Zonder die scoping lekte het
// signaal platform-brede tellingen — óók van concurrerende opdrachtgevers en andere tenants — aan één
// opdrachtgever (OWASP A01 / AVG art. 5(1)(c)). Prisma is gemockt.

const NOW = new Date("2026-08-20T12:00:00.000Z");
const minsAgo = (m: number) => new Date(NOW.getTime() - m * 60_000);

interface JobRow {
  id: string;
  companyId: string;
}
interface InviteRow {
  freelancerId: string;
  jobId: string;
  invitedAt: Date;
}
interface AppRow {
  freelancerId: string;
  jobId: string;
  createdAt: Date;
  status?: string;
}

const state = vi.hoisted(() => ({
  jobs: [] as JobRow[],
  invites: [] as InviteRow[],
  apps: [] as AppRow[],
}));

// auditLog.findMany → serialiseer de invites als JOB_INVITED-records (freelancerId in JSON-metadata).
const auditFindMany = vi.fn(
  async (args: { where?: { OR?: { metadata?: { contains?: string } }[] } }) => {
    const wanted = (args?.where?.OR ?? []).map((c) => c.metadata?.contains ?? "").filter(Boolean);
    return state.invites
      .filter((inv) => wanted.some((w) => w.includes(`"${inv.freelancerId}"`)))
      .map((inv) => ({
        entityId: inv.jobId,
        metadata: JSON.stringify({ freelancerId: inv.freelancerId }),
        createdAt: inv.invitedAt,
      }));
  },
);

// job.findMany → scope op companyId + id-in (dit is de fix-poort: alleen opdrachten van de kijker).
const jobFindMany = vi.fn(
  async (args: { where?: { id?: { in?: string[] }; companyId?: string } }) => {
    const ids = args?.where?.id?.in ?? [];
    const companyId = args?.where?.companyId;
    return state.jobs
      .filter((j) => ids.includes(j.id) && (companyId == null || j.companyId === companyId))
      .map((j) => ({ id: j.id }));
  },
);

const appFindMany = vi.fn(
  async (args: { where?: { jobId?: { in?: string[] }; freelancerId?: { in?: string[] } } }) => {
    const jobIds = args?.where?.jobId?.in ?? [];
    const freelancerIds = args?.where?.freelancerId?.in ?? [];
    return state.apps
      .filter(
        (a) =>
          jobIds.includes(a.jobId) &&
          freelancerIds.includes(a.freelancerId) &&
          a.status !== "WITHDRAWN",
      )
      .map((a) => ({ freelancerId: a.freelancerId, jobId: a.jobId, createdAt: a.createdAt }));
  },
);

vi.mock("@/lib/db", () => ({
  prisma: {
    auditLog: { findMany: (a: unknown) => auditFindMany(a as never) },
    job: { findMany: (a: unknown) => jobFindMany(a as never) },
    application: { findMany: (a: unknown) => appFindMany(a as never) },
  },
}));

import { getCandidateInviteResponsiveness } from "./candidate-invite-responsiveness";

beforeEach(() => {
  state.jobs = [];
  state.invites = [];
  state.apps = [];
  auditFindMany.mockClear();
  jobFindMany.mockClear();
  appFindMany.mockClear();
});

describe("getCandidateInviteResponsiveness — scoping op de kijkende opdrachtgever", () => {
  it("telt alleen uitnodigingen van de kijkende opdrachtgever, niet die van andere opdrachtgevers/tenants", async () => {
    // C1 (kijker) nodigde F1 3× uit op eigen opdrachten; concurrent C2 nodigde F1 5× uit.
    state.jobs = [
      { id: "c1-a", companyId: "C1" },
      { id: "c1-b", companyId: "C1" },
      { id: "c1-c", companyId: "C1" },
      { id: "c2-a", companyId: "C2" },
      { id: "c2-b", companyId: "C2" },
      { id: "c2-c", companyId: "C2" },
      { id: "c2-d", companyId: "C2" },
      { id: "c2-e", companyId: "C2" },
    ];
    for (const j of state.jobs) {
      state.invites.push({ freelancerId: "F1", jobId: j.id, invitedAt: minsAgo(120) });
      // F1 reageert snel (30 min ná de uitnodiging) op élke uitnodiging.
      state.apps.push({ freelancerId: "F1", jobId: j.id, createdAt: minsAgo(90) });
    }

    const result = await getCandidateInviteResponsiveness(["F1"], "C1", NOW);
    const r = result.get("F1");

    expect(r).toBeDefined();
    // Noemer = 3 (alleen C1), NIET 8 (platform-breed). Dit faalt zonder de company-scoping.
    expect(r?.invited).toBe(3);
    expect(r?.responded).toBe(3);
    expect(r?.detail).toContain("3 van de 3");
    // De cross-partij-telling van C2 lekt niet in de tooltip.
    expect(r?.detail).not.toContain("8");
  });

  it("geeft geen badge als de kijker zelf te weinig uitnodigde, ook al is de ZZP'er platform-breed veel uitgenodigd", async () => {
    // C1 nodigde F1 slechts 1× uit (< MIN_INVITES); C2 nodigde 5× uit. Zonder scoping zou de
    // platform-brede telling (6) de "reageert snel"-drempel halen en een badge tonen.
    state.jobs = [
      { id: "c1-only", companyId: "C1" },
      { id: "c2-1", companyId: "C2" },
      { id: "c2-2", companyId: "C2" },
      { id: "c2-3", companyId: "C2" },
      { id: "c2-4", companyId: "C2" },
      { id: "c2-5", companyId: "C2" },
    ];
    for (const j of state.jobs) {
      state.invites.push({ freelancerId: "F1", jobId: j.id, invitedAt: minsAgo(120) });
      state.apps.push({ freelancerId: "F1", jobId: j.id, createdAt: minsAgo(90) });
    }

    const result = await getCandidateInviteResponsiveness(["F1"], "C1", NOW);
    const r = result.get("F1");

    // Eén C1-uitnodiging → onder MIN_INVITES → geen positieve badge (geen misleidend signaal uit
    // andermans uitnodigingen).
    expect(r?.invited).toBe(1);
    expect(r?.fast).toBe(false);
    expect(r?.label).toBeNull();
  });

  it("geeft een lege map zonder companyId (fail-closed: geen ongescoopte aggregatie)", async () => {
    state.jobs = [{ id: "c1-a", companyId: "C1" }];
    state.invites.push({ freelancerId: "F1", jobId: "c1-a", invitedAt: minsAgo(120) });
    state.apps.push({ freelancerId: "F1", jobId: "c1-a", createdAt: minsAgo(90) });

    const result = await getCandidateInviteResponsiveness(["F1"], "", NOW);
    expect(result.size).toBe(0);
    // Geen enkele query mag lopen zonder scope.
    expect(auditFindMany).not.toHaveBeenCalled();
  });
});
