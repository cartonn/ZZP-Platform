// Unit-tests voor de publiceer-tak van het opdracht-formulier. Bewijst dat de "Opslaan &
// publiceren"-knop de BESTAANDE statusovergang hergebruikt (changeJobStatus): een geldige overgang
// (DRAFT → PUBLISHED) publiceert en redirect; een ongeldige overgang (PUBLISHED → PUBLISHED) wordt
// geweigerd met de JobTransitionError-melding, zonder de opdracht te wijzigen.
//
// De pure regels (@/lib/jobs, @/lib/applications) draaien echt; alleen IO (prisma, authz, audit,
// next/cache, next/navigation) is gemockt.

import { describe, it, expect, vi, beforeEach } from "vitest";

const store = {
  actor: { id: "client-1", role: "CLIENT", status: "ACTIVE", tenantId: null } as {
    id: string;
    role: string;
    status: string;
    tenantId: string | null;
  },
  job: null as Record<string, unknown> | null,
  updated: [] as Array<Record<string, unknown>>,
  freelancer: null as Record<string, unknown> | null,
  invitedAuditCount: 0,
  notifications: [] as Array<Record<string, unknown>>,
  bulkNotifications: [] as Array<Record<string, unknown>>,
  openApplications: [] as Array<Record<string, unknown>>,
};

const auditMock = vi.hoisted(() => vi.fn(async () => {}));

class RedirectError extends Error {
  constructor(public url: string) {
    super(`NEXT_REDIRECT:${url}`);
    this.name = "RedirectError";
  }
}

vi.mock("@/lib/authz", () => ({
  requireRole: vi.fn(async () => store.actor),
  assertOwnership: vi.fn(() => {}),
  owns: vi.fn(() => true),
  AuthorizationError: class extends Error {},
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
}));
vi.mock("@/lib/audit", () => ({ audit: auditMock }));
vi.mock("@/lib/db", () => ({
  prisma: {
    job: {
      findUnique: vi.fn(async () => store.job),
      count: vi.fn(async () => 0),
      update: vi.fn(async (args: { data: Record<string, unknown> }) => {
        store.updated.push(args.data);
        return { id: "job-1", ...args.data };
      }),
    },
    subscription: { findUnique: vi.fn(async () => null) },
    plan: { findUnique: vi.fn(async () => ({ maxJobs: 1 })) },
    company: { findUnique: vi.fn(async () => ({ id: "co-1", name: "Testbedrijf" })) },
    favoriteFreelancer: { findMany: vi.fn(async () => []) },
    freelancerProfile: {
      // Respecteert de tenant-grens in de where: de discoverable-pool is per-tenant gescopet
      // (`tenantId: job.tenantId`). Een profiel uit een andere tenant is "niet gevonden" (null),
      // net als de echte DB-query. `undefined` in de where = geen tenant-constraint (matcht alles).
      findFirst: vi.fn(async (args: { where?: { tenantId?: string | null } }) => {
        if (!store.freelancer) return null;
        const wantTenant = args?.where?.tenantId;
        if (wantTenant !== undefined && store.freelancer.tenantId !== wantTenant) return null;
        return store.freelancer;
      }),
    },
    auditLog: { count: vi.fn(async () => store.invitedAuditCount) },
    application: {
      findMany: vi.fn(async () => store.openApplications),
    },
    notification: {
      createMany: vi.fn(async (args: { data: Array<Record<string, unknown>> }) => {
        store.bulkNotifications.push(...args.data);
        return { count: args.data.length };
      }),
      create: vi.fn(async (args: { data: Record<string, unknown> }) => {
        store.notifications.push(args.data);
        return { id: "notif-1", ...args.data };
      }),
    },
  },
}));

import { changeJobStatus, inviteFreelancerToJob } from "./actions";

function draftJob(overrides: Record<string, unknown> = {}) {
  return {
    id: "job-1",
    title: "Frontend Developer",
    description: "Bouw een strak dashboard.",
    status: "DRAFT",
    publishedAt: null,
    tenantId: null,
    company: { userId: "client-1" },
    tenant: { openOverflow: false },
    ...overrides,
  };
}

describe("changeJobStatus — publiceer-pad (hergebruikt door 'Opslaan & publiceren')", () => {
  beforeEach(() => {
    store.updated = [];
    auditMock.mockClear();
  });

  it("publiceert een concept (DRAFT → PUBLISHED) en redirect naar de detailpagina", async () => {
    store.job = draftJob();
    await expect(changeJobStatus("job-1", "PUBLISHED")).rejects.toMatchObject({
      url: "/opdrachten/job-1",
    });
    expect(store.updated.at(-1)).toMatchObject({ status: "PUBLISHED" });
    expect(store.updated.at(-1)?.publishedAt).toBeInstanceOf(Date);
  });

  it("weigert een ongeldige overgang (PUBLISHED → PUBLISHED) en wijzigt de opdracht niet", async () => {
    store.job = draftJob({ status: "PUBLISHED", publishedAt: new Date() });
    const result = await changeJobStatus("job-1", "PUBLISHED");
    expect(result?.error).toMatch(/Ongeldige opdracht-statusovergang/);
    expect(store.updated).toHaveLength(0);
  });
});

describe("changeJobStatus — sluiten informeert open reacties", () => {
  beforeEach(() => {
    store.updated = [];
    store.bulkNotifications = [];
    store.openApplications = [];
    auditMock.mockClear();
  });

  it("notificeert open reacties (NEW/VIEWED/SHORTLIST) bij PUBLISHED → CLOSED + audit", async () => {
    store.job = draftJob({
      status: "PUBLISHED",
      publishedAt: new Date(),
      title: "Wijkverpleegkundige",
    });
    store.openApplications = [
      { status: "NEW", freelancer: { userId: "zzp-a" } },
      { status: "SHORTLIST", freelancer: { userId: "zzp-b" } },
    ];
    await expect(changeJobStatus("job-1", "CLOSED")).rejects.toMatchObject({
      url: "/opdrachten/job-1",
    });
    expect(store.bulkNotifications.map((n) => n.userId).sort()).toEqual(["zzp-a", "zzp-b"]);
    for (const n of store.bulkNotifications) {
      expect(n.type).toBe("JOB_CLOSED");
      expect(n.link).toBe("/opdrachten");
      expect(String(n.body)).toContain("Wijkverpleegkundige");
    }
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "JOB_CLOSED_NOTIFIED", metadata: { count: 2 } }),
    );
  });

  it("stuurt geen notificatie en geen audit als er geen open reacties zijn", async () => {
    store.job = draftJob({ status: "PUBLISHED", publishedAt: new Date() });
    store.openApplications = [];
    await expect(changeJobStatus("job-1", "CLOSED")).rejects.toMatchObject({
      url: "/opdrachten/job-1",
    });
    expect(store.bulkNotifications).toHaveLength(0);
    expect(auditMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: "JOB_CLOSED_NOTIFIED" }),
    );
  });

  it("informeert niet bij het sluiten van een concept (DRAFT → CLOSED had geen reacties)", async () => {
    store.job = draftJob({ status: "DRAFT" });
    store.openApplications = [{ status: "NEW", freelancer: { userId: "zzp-a" } }];
    await expect(changeJobStatus("job-1", "CLOSED")).rejects.toMatchObject({
      url: "/opdrachten/job-1",
    });
    expect(store.bulkNotifications).toHaveLength(0);
    expect(auditMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: "JOB_CLOSED_NOTIFIED" }),
    );
  });
});

function publishedJobForInvite(overrides: Record<string, unknown> = {}) {
  return {
    id: "job-1",
    title: "Wijkverpleegkundige",
    status: "PUBLISHED",
    tenantId: null,
    company: { userId: "client-1", name: "Thuiszorg Noord" },
    ...overrides,
  };
}

describe("inviteFreelancerToJob — directe uitnodiging", () => {
  beforeEach(() => {
    store.notifications = [];
    store.invitedAuditCount = 0;
    store.freelancer = { id: "fp-1", tenantId: null, user: { id: "user-9" }, applications: [] };
    auditMock.mockClear();
  });

  it("nodigt een vindbare ZZP'er uit: notificatie naar de ZZP'er + JOB_INVITED-audit", async () => {
    store.job = publishedJobForInvite();
    await inviteFreelancerToJob("job-1", "fp-1");
    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0]).toMatchObject({
      userId: "user-9",
      type: "JOB_INVITE",
      link: "/opdrachten/job-1",
    });
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "JOB_INVITED",
        entityType: "Job",
        entityId: "job-1",
        metadata: { freelancerId: "fp-1" },
      }),
    );
  });

  it("is een stille no-op op een niet-gepubliceerde opdracht", async () => {
    store.job = publishedJobForInvite({ status: "CLOSED" });
    await inviteFreelancerToJob("job-1", "fp-1");
    expect(store.notifications).toHaveLength(0);
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("is een stille no-op wanneer de ZZP'er niet (meer) vindbaar is", async () => {
    store.job = publishedJobForInvite();
    store.freelancer = null;
    await inviteFreelancerToJob("job-1", "fp-1");
    expect(store.notifications).toHaveLength(0);
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("nodigt niet nogmaals uit als er al een JOB_INVITED-audit is (idempotent)", async () => {
    store.job = publishedJobForInvite();
    store.invitedAuditCount = 1;
    await inviteFreelancerToJob("job-1", "fp-1");
    expect(store.notifications).toHaveLength(0);
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("nodigt niet uit als de ZZP'er al reageerde", async () => {
    store.job = publishedJobForInvite();
    store.freelancer = {
      id: "fp-1",
      tenantId: null,
      user: { id: "user-9" },
      applications: [{ id: "app-1" }],
    };
    await inviteFreelancerToJob("job-1", "fp-1");
    expect(store.notifications).toHaveLength(0);
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("weigert cross-tenant: een ZZP'er uit een andere franchise-roster wordt niet uitgenodigd (A01)", async () => {
    // Regressie voor de cross-tenant-IDOR: de uitnodiging scopet de discoverable-pool op
    // `tenantId: job.tenantId`. Een opdrachtgever in franchise-A (of direct, tenantId null) mag geen
    // ZZP'er uit de private roster van franchise-B kunnen bereiken — ook al staat dat profiel op
    // PUBLIC. Zonder de tenant-grens vindt de query het profiel en verstuurt notificatie + audit.
    store.actor = { id: "client-1", role: "CLIENT", status: "ACTIVE", tenantId: "franchise-A" };
    store.job = publishedJobForInvite({ tenantId: "franchise-A" });
    store.freelancer = {
      id: "fp-1",
      tenantId: "franchise-B",
      user: { id: "user-9" },
      applications: [],
    };
    await inviteFreelancerToJob("job-1", "fp-1");
    expect(store.notifications).toHaveLength(0);
    expect(auditMock).not.toHaveBeenCalled();
    // Herstel de default direct-client-actor voor eventuele volgende tests.
    store.actor = { id: "client-1", role: "CLIENT", status: "ACTIVE", tenantId: null };
  });

  it("is een stille no-op als de opdracht niet bestaat", async () => {
    store.job = null;
    await inviteFreelancerToJob("job-x", "fp-1");
    expect(store.notifications).toHaveLength(0);
    expect(auditMock).not.toHaveBeenCalled();
  });
});
