// Unit-tests voor changeJobStatus — robuustheid van de doelstatus-invoer (DOEL-2). Een geknutselde
// POST met een `target` buiten de JobStatus-enum mag geen ongevangen ZodError → generieke 500 geven.
// Deze actie retourneert een JobStatusState-object (throwt niet), dus een ongeldige waarde levert een
// nette fout op en raakt de DB niet. Een geldige doelstatus passeert de safeParse-poort en bereikt de
// ownership-lookup. Prisma, authz, audit, next-cache/navigation en de overige libs gemockt; @/lib/enums
// is bewust ECHT (de bron van de enum die we testen).

import { describe, it, expect, vi, beforeEach } from "vitest";

const store = {
  actor: { id: "client-1", role: "CLIENT", status: "ACTIVE", tenantId: null } as {
    id: string;
    role: string;
    status: string;
    tenantId: string | null;
  },
};

const findUniqueMock = vi.hoisted(() =>
  vi.fn(async (): Promise<Record<string, unknown> | null> => null),
);
const updateMock = vi.hoisted(() => vi.fn(async () => ({})));
const auditMock = vi.hoisted(() => vi.fn(async () => {}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/authz", () => ({
  requireRole: vi.fn(async () => store.actor),
  assertOwnership: vi.fn(),
  AuthorizationError: class extends Error {},
}));
vi.mock("@/lib/audit", () => ({ audit: auditMock, auditData: vi.fn((d) => d) }));
vi.mock("@/lib/db", () => ({
  prisma: {
    job: { findUnique: findUniqueMock, update: updateMock },
  },
}));
vi.mock("@/lib/applications", () => ({ canApply: vi.fn(() => true) }));
vi.mock("@/lib/applications-create", () => ({ createApplicationForJob: vi.fn() }));
vi.mock("@/lib/dba", () => ({ assessDbaRisk: vi.fn(() => ({ level: "LOW", reasons: [] })) }));
vi.mock("@/lib/jobs", () => ({
  assertJobTransition: vi.fn(),
  canPublish: vi.fn(() => true),
  JobTransitionError: class extends Error {},
}));
vi.mock("@/lib/pool-routing", () => ({ planPoolInvites: vi.fn(() => []) }));
vi.mock("@/lib/job-closure", () => ({
  OPEN_APPLICATION_STATUSES: [],
  planClosureNotifications: vi.fn(() => []),
}));
vi.mock("@/lib/validation", () => ({ jobSchema: { safeParse: vi.fn() } }));
vi.mock("@/lib/tenancy", () => ({ visibleJobsWhere: vi.fn(() => ({})) }));
vi.mock("@/lib/freelancer-visibility", () => ({ discoverableFreelancerWhere: {} }));
vi.mock("@/lib/job-invite", () => ({
  assessInviteEligibility: vi.fn(() => ({ ok: true })),
  buildJobInviteNotification: vi.fn(() => ({})),
  JOB_INVITED_AUDIT_ACTION: "JOB_INVITED",
  parseInvitedFreelancerIds: vi.fn(() => new Set()),
  planBulkJobInvites: vi.fn(() => []),
}));
vi.mock("@/lib/suggestions", () => ({ suggestedFreelancersForJob: vi.fn(async () => []) }));
vi.mock("@/lib/rate-limit", () => ({
  inviteRateLimiter: { check: vi.fn(async () => ({ allowed: true })) },
}));

import { changeJobStatus } from "./actions";

beforeEach(() => {
  findUniqueMock.mockReset();
  findUniqueMock.mockResolvedValue(null);
  updateMock.mockClear();
  auditMock.mockClear();
});

describe("changeJobStatus — doelstatus-validatie", () => {
  it("weigert een doelstatus buiten de enum met een nette fout, zónder de DB te raken", async () => {
    const result = await changeJobStatus("job-1", "HACKED");
    // Nette domeinfout i.p.v. een ongevangen ZodError → 500.
    expect(result).toEqual({ error: "Ongeldige doelstatus." });
    // Cruciaal: de afwijzing gebeurt vóór elke DB-I/O.
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("laat een geldige doelstatus door tot de DB-lookup (hier: niet gevonden)", async () => {
    // "PUBLISHED" is een geldige JobStatus; hij passeert de safeParse-poort en bereikt de lookup.
    const result = await changeJobStatus("job-1", "PUBLISHED");
    expect(result).toEqual({ error: "Opdracht niet gevonden." });
    expect(findUniqueMock).toHaveBeenCalledTimes(1);
  });
});
