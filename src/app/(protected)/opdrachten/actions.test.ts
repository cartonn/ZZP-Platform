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
    notification: { createMany: vi.fn(async () => ({ count: 0 })) },
  },
}));

import { changeJobStatus } from "./actions";

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
