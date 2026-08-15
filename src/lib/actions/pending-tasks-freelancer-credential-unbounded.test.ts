// Regressietest voor de next-action-engine (DOEL 1b — cross-surface-consistentie): de FREELANCER-
// certificaatdossierquery in `freelancerTasks` voedt de hoogste-prioriteit next-actions (afgewezen/
// verlopend/ontbrekend-verplicht cert + de compliance-gebonden certtaken van een lopende samenwerking)
// én de superseded-detectie. De /certificaten-nav-badge (signals.ts) telt ditzelfde dossier ONBEGRENSD
// en claimt gelijkheid met /acties. Een `take: MAX` zonder orderBy was (a) niet-deterministisch en
// (b) zou de badge tegenspreken zodra het dossier > MAX rijen telt (een actie-behoevend cert buiten de
// slice verschijnt wél in de badge maar niet als next-action). Deze test borgt dat de dossierquery
// onbegrensd draait (geen take) zodat /acties de onbegrensde badge exact spiegelt. Zelfde drift-klasse
// als #1022 (admin-wachtrijen), hier drift-proof gesloten door de badge te spiegelen i.p.v. te cappen.

import { describe, it, expect, vi } from "vitest";

const credentialFindMany = vi.hoisted(() =>
  vi.fn(async (_a: { where?: unknown; select?: Record<string, unknown>; take?: number }) => []),
);

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(async () => ({ identityVerifiedAt: new Date() })) },
    credential: { findMany: credentialFindMany },
    availabilityWindow: { findMany: vi.fn(async () => []) },
    collaboration: { findMany: vi.fn(async () => []) },
    performance: { findMany: vi.fn(async () => []) },
    // Ongewindowde betaal-/factuur-query (openInvoices) — leeg voor deze certificaat-gescope test.
    invoice: { findMany: vi.fn(async () => []) },
    conversationParticipant: { findMany: vi.fn(async () => []) },
    message: { groupBy: vi.fn(async () => []) },
    conversation: { findMany: vi.fn(async () => []) },
    noShowReport: { findFirst: vi.fn(async () => null), count: vi.fn(async () => 0) },
    auditLog: { findMany: vi.fn(async () => []) },
    job: { findMany: vi.fn(async () => []) },
    application: { findMany: vi.fn(async () => []) },
  },
}));

vi.mock("@/lib/data/freelancer-profile", () => ({
  getCompletenessProfile: vi.fn(async () => ({
    id: "prof-1",
    visibility: "PUBLIC",
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
}));

vi.mock("@/lib/data/income-tax-deadline", () => ({
  getIncomeTaxDeadlineForActor: vi.fn(async () => null),
}));
vi.mock("@/lib/data/vat-deadline", () => ({
  getVatDeadlinesForActor: vi.fn(async () => []),
}));

import { pendingTasks } from "@/lib/actions/pending-tasks";

describe("freelancerTasks — certificaatdossierquery is onbegrensd (badge-consistentie)", () => {
  it("de dossierquery draait zonder take-cap zodat /acties de onbegrensde /certificaten-badge spiegelt", async () => {
    // Unieke id → omzeilt de React.cache-memoisatie tussen tests.
    await pendingTasks({
      id: "freelancer-cred-unbounded-test",
      role: "FREELANCER",
      status: "ACTIVE",
    } as never);

    // De hoofd-dossierquery is te herkennen aan `select.title` (de fix-/verplichte-doc-afleiding);
    // andere credential-queries selecteren geen title.
    const dossierCall = credentialFindMany.mock.calls.find((c) => c[0]?.select?.title === true);
    expect(dossierCall).toBeDefined();
    // Geen `take`: onbegrensd, spiegelt de onbegrensde badge — geen niet-deterministische undercount.
    expect(dossierCall![0].take).toBeUndefined();
  });
});
