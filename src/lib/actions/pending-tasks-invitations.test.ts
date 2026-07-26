// Wiring-regressietest: een directe uitnodiging (`JOB_INVITED`) waarop de ZZP'er nog niet reageerde
// hoort als next-action op /acties (en dus in de zijbalk-badge + dashboard-rail) te verschijnen — niet
// alléén als band op /opdrachten. Mockt de bestaande, begrensde `getReceivedInvitations`-datalaag zodat
// de test puur de item-engine-wiring (freelancerTasks → invitationTasks → respondInvitationTask) toetst.

import { describe, it, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({
  invitations: [] as {
    jobId: string;
    jobTitle: string;
    companyName: string;
    invitedAt: Date;
  }[],
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(async () => ({ identityVerifiedAt: new Date() })) },
    credential: { findMany: vi.fn(async () => []) },
    availabilityWindow: { findMany: vi.fn(async () => []) },
    collaboration: { findMany: vi.fn(async () => []) },
    conversationParticipant: { findMany: vi.fn(async () => []) },
    message: { groupBy: vi.fn(async () => []) },
    conversation: { findMany: vi.fn(async () => []) },
    noShowReport: { findFirst: vi.fn(async () => null), count: vi.fn(async () => 0) },
    auditLog: { findMany: vi.fn(async () => []) },
    job: { findMany: vi.fn(async () => []) },
    application: { findMany: vi.fn(async () => []) },
  },
}));

// Volledig, vindbaar profiel (score 100, PRIVATE → geen completeness-/agenda-taken): isoleert de
// uitnodigingen-tak. `id` is de freelancerProfileId die invitationTasks doorgeeft.
vi.mock("@/lib/data/freelancer-profile", () => ({
  getCompletenessProfile: vi.fn(async () => ({
    id: "prof-1",
    visibility: "PRIVATE",
    headline: "Verpleegkundige",
    bio: "Ervaren verpleegkundige met tien jaar ervaring in de zorg.",
    hourlyRate: 65,
    location: "Amsterdam",
    availability: "AVAILABLE",
    languages: JSON.stringify(["nl", "en"]),
    monthlyIncomeGoalCents: 500000,
    skills: [{ skillId: "s1" }],
    industries: [{ industryId: "i1" }],
  })),
}));

vi.mock("@/lib/signals", () => ({
  overdueInvoiceCount: vi.fn(async () => 0),
  overdueInvoiceBreakdown: vi.fn(async () => ({ legacy: 0, cascade: 0 })),
  paymentDueSoonCount: vi.fn(async () => 0),
  startOfUtcDay: (d: Date) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())),
}));

vi.mock("@/lib/data/vat-deadline", () => ({
  getVatDeadlinesForActor: vi.fn(async () => []),
}));

vi.mock("@/lib/data/received-invitations", () => ({
  getReceivedInvitations: vi.fn(async () => state.invitations),
}));

import { pendingTasks } from "@/lib/actions/pending-tasks";
import { getReceivedInvitations } from "@/lib/data/received-invitations";
import { MAX_RECEIVED_INVITATIONS } from "@/lib/received-invitations";

const ACTOR = { id: "user-zzp", role: "FREELANCER", status: "ACTIVE" } as const;

beforeEach(() => {
  state.invitations = [];
});

describe("uitnodiging-respons als next-action (wiring)", () => {
  it("geen open uitnodigingen → geen respond-invitation-taak", async () => {
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.some((t) => t.kind === "respond-invitation")).toBe(false);
  });

  it("een open uitnodiging verschijnt als link-taak naar de opdracht", async () => {
    state.invitations = [
      {
        jobId: "job-7",
        jobTitle: "Nachtdienst verpleegkundige",
        companyName: "Zorggroep Noord",
        invitedAt: new Date(Date.now() - 2 * 86_400_000), // 2 dagen geleden → rustig (info)
      },
    ];
    const tasks = await pendingTasks(ACTOR);
    const invite = tasks.find((t) => t.kind === "respond-invitation");
    expect(invite).toBeDefined();
    expect(invite).toMatchObject({
      id: "respond-invitation:job-7",
      resolver: "link",
      href: "/opdrachten/job-7",
      tone: "info",
    });
    expect(invite?.title).toBe("Reageer op de uitnodiging van Zorggroep Noord");
  });

  it("meer dan MAX_RECEIVED_INVITATIONS open uitnodigingen → geen stille afkap op 6", async () => {
    // De band op /opdrachten toont er hooguit MAX_RECEIVED_INVITATIONS (=6); de action-engine mag
    // níét op datzelfde getal afkappen (anders is de zijbalk-badge lager dan de echte telling).
    const count = MAX_RECEIVED_INVITATIONS + 2; // 8
    state.invitations = Array.from({ length: count }, (_, i) => ({
      jobId: `job-${i}`,
      jobTitle: `Opdracht ${i}`,
      companyName: `Zorggroep ${i}`,
      invitedAt: new Date(Date.now() - 2 * 86_400_000),
    }));

    const tasks = await pendingTasks(ACTOR);
    const invites = tasks.filter((t) => t.kind === "respond-invitation");
    expect(invites).toHaveLength(count);

    // De datalaag krijgt een ruimere bovengrens mee dan de band-cap — niet 6.
    const capArg = vi.mocked(getReceivedInvitations).mock.calls.at(-1)?.[2];
    expect(typeof capArg).toBe("number");
    expect(capArg).toBeGreaterThan(MAX_RECEIVED_INVITATIONS);
  });

  it("een lang stille uitnodiging (≥5 dagen) wordt attention", async () => {
    state.invitations = [
      {
        jobId: "job-9",
        jobTitle: "Weekenddienst",
        companyName: "Thuiszorg West",
        invitedAt: new Date(Date.now() - 6 * 86_400_000),
      },
    ];
    const tasks = await pendingTasks(ACTOR);
    const invite = tasks.find((t) => t.kind === "respond-invitation");
    expect(invite?.tone).toBe("attention");
  });
});
