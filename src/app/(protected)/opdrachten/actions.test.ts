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
    freelancerProfile: { findFirst: vi.fn(async () => store.freelancer) },
    auditLog: { count: vi.fn(async () => store.invitedAuditCount) },
    notification: {
      createMany: vi.fn(async () => ({ count: 0 })),
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

function publishedJobForInvite(overrides: Record<string, unknown> = {}) {
  return {
    id: "job-1",
    title: "Wijkverpleegkundige",
    status: "PUBLISHED",
    company: { userId: "client-1", name: "Thuiszorg Noord" },
    ...overrides,
  };
}

describe("inviteFreelancerToJob — directe uitnodiging", () => {
  beforeEach(() => {
    store.notifications = [];
    store.invitedAuditCount = 0;
    store.freelancer = { id: "fp-1", user: { id: "user-9" }, applications: [] };
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
    store.freelancer = { id: "fp-1", user: { id: "user-9" }, applications: [{ id: "app-1" }] };
    await inviteFreelancerToJob("job-1", "fp-1");
    expect(store.notifications).toHaveLength(0);
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("is een stille no-op als de opdracht niet bestaat", async () => {
    store.job = null;
    await inviteFreelancerToJob("job-x", "fp-1");
    expect(store.notifications).toHaveLength(0);
    expect(auditMock).not.toHaveBeenCalled();
  });
});
