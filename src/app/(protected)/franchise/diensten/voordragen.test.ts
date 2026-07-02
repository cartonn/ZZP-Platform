// Unit-tests voor proposeFreelancer — de bemiddelaar draagt een roster-ZZP'er voor op een open dienst.
// Bewijst de kern-regels: tenant-isolatie (dienst + ZZP'er binnen eigen tenant), inzetbaarheid
// (INACTIEF geweigerd), idempotentie (dubbel voordragen = no-op zonder tweede notificatie) en de
// happy path (audit + notificatie). Prisma, authz, audit en next-cache volledig gemockt.

import { describe, it, expect, vi, beforeEach } from "vitest";

const store = {
  actor: { id: "fr-1", role: "FRANCHISER", status: "ACTIVE", tenantId: "tenant-1" } as {
    id: string;
    role: string;
    status: string;
    tenantId: string | null;
  },
  job: null as Record<string, unknown> | null,
  freelancer: null as Record<string, unknown> | null,
  existingProposal: null as Record<string, unknown> | null,
  notifications: [] as Array<Record<string, unknown>>,
};

const auditMock = vi.hoisted(() => vi.fn(async () => {}));

vi.mock("@/lib/authz", () => ({
  requireRole: vi.fn(async () => store.actor),
  AuthorizationError: class extends Error {},
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/audit", () => ({ audit: auditMock }));
vi.mock("@/lib/db", () => ({
  prisma: {
    job: { findUnique: vi.fn(async () => store.job) },
    freelancerProfile: { findFirst: vi.fn(async () => store.freelancer) },
    auditLog: { findFirst: vi.fn(async () => store.existingProposal) },
    notification: {
      create: vi.fn(async (args: { data: Record<string, unknown> }) => {
        store.notifications.push(args.data);
        return args.data;
      }),
    },
  },
}));

import { proposeFreelancer } from "./actions";

function publishedJob(overrides: Record<string, unknown> = {}) {
  return {
    id: "job-1",
    title: "Verpleegkundige",
    status: "PUBLISHED",
    tenantId: "tenant-1",
    ...overrides,
  };
}

/** Volledig inzetbare ZZP'er (verplichte docs in orde, profiel compleet, identiteit geverifieerd). */
function engageableFreelancer(overrides: Record<string, unknown> = {}) {
  return {
    id: "prof-1",
    completeness: 100,
    availability: "AVAILABLE",
    credentials: [
      { type: "VOG", status: "VERIFIED", expiresAt: null },
      { type: "INSURANCE", status: "VERIFIED", expiresAt: null },
    ],
    user: { id: "zzp-user-1", identityVerifiedAt: new Date(), lastLoginAt: new Date() },
    ...overrides,
  };
}

function form(jobId: string, freelancerId: string): FormData {
  const fd = new FormData();
  fd.set("jobId", jobId);
  fd.set("freelancerId", freelancerId);
  return fd;
}

beforeEach(() => {
  store.actor = { id: "fr-1", role: "FRANCHISER", status: "ACTIVE", tenantId: "tenant-1" };
  store.job = publishedJob();
  store.freelancer = engageableFreelancer();
  store.existingProposal = null;
  store.notifications = [];
  auditMock.mockClear();
});

describe("proposeFreelancer", () => {
  it("draagt een inzetbare roster-ZZP'er voor: audit + notificatie", async () => {
    const res = await proposeFreelancer(undefined, form("job-1", "prof-1"));
    expect(res).toEqual({ ok: true, already: false });
    expect(auditMock).toHaveBeenCalledTimes(1);
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "FRANCHISE_FREELANCER_PROPOSED", entityId: "job-1" }),
    );
    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0]).toMatchObject({ userId: "zzp-user-1", type: "JOB_PROPOSAL" });
  });

  it("weigert een dienst buiten de eigen tenant (isolatie)", async () => {
    store.job = publishedJob({ tenantId: "other-tenant" });
    const res = await proposeFreelancer(undefined, form("job-1", "prof-1"));
    expect(res).toEqual({ error: "Dienst niet gevonden." });
    expect(auditMock).not.toHaveBeenCalled();
    expect(store.notifications).toHaveLength(0);
  });

  it("weigert een ZZP'er die niet in het eigen roster zit", async () => {
    store.freelancer = null; // findFirst met tenant-scope geeft niets terug
    const res = await proposeFreelancer(undefined, form("job-1", "prof-x"));
    expect(res).toEqual({ error: "ZZP'er niet in je roster." });
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("weigert een niet-inzetbare (INACTIEF) ZZP'er met reden", async () => {
    store.freelancer = engageableFreelancer({ credentials: [] }); // VOG/INSURANCE ontbreken
    const res = await proposeFreelancer(undefined, form("job-1", "prof-1"));
    expect(res && "error" in res).toBe(true);
    expect((res as { error: string }).error).toMatch(/Nog niet inzetbaar/);
    expect(auditMock).not.toHaveBeenCalled();
    expect(store.notifications).toHaveLength(0);
  });

  it("is idempotent: een tweede voordracht is een no-op zonder tweede notificatie", async () => {
    store.existingProposal = { id: "audit-1" };
    const res = await proposeFreelancer(undefined, form("job-1", "prof-1"));
    expect(res).toEqual({ ok: true, already: true });
    expect(auditMock).not.toHaveBeenCalled();
    expect(store.notifications).toHaveLength(0);
  });

  it("weigert voordragen op een niet-gepubliceerde dienst", async () => {
    store.job = publishedJob({ status: "CLOSED" });
    const res = await proposeFreelancer(undefined, form("job-1", "prof-1"));
    expect(res).toEqual({ error: "Je kunt alleen voordragen op een gepubliceerde dienst." });
    expect(auditMock).not.toHaveBeenCalled();
  });
});
