// Entitlement-poort op startFiling (security-audit — OWASP A01 Broken Access Control / AVG-grondslag).
//
// Defect (was): `startFiling` bepaalde het plan met een lokale `planKeyFor` die ENKEL naar
// `Subscription.status === "ACTIVE"` keek en `currentPeriodEnd` negeerde. Een betaalde periode die
// al verlopen is (`currentPeriodEnd <= nu`) blijft `ACTIVE` in de DB tot de dagelijkse
// `subscription-expiry-task` hem naar CANCELLED veegt. In dat venster ontsloot de aangifte-service
// een ÉCHTE aangifte — `partner.prepareConcept()` (extern effect + PII naar de verwerker) + een
// `TaxFilingRequest` — voor een ZZP'er wiens entitlement feitelijk was verlopen. Een monetisatie-
// bypass én een AVG-grondslag-probleem (PII de grens over zonder geldige grondslag).
//
// Fix: `startFiling` gebruikt nu de canonieke `userHasEntitlement`/`isSubscriptionActive`, die een
// ACTIVE-rij met verlopen periode als FREE behandelt. Deze test faalt zonder de fix (de oude
// `planKeyFor` zou doorlopen en de partner + upsert aanroepen) en slaagt met de fix.

import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => {
  const subFindUnique = vi.fn();
  const upsert = vi.fn(async () => ({ id: "tf-1" }));
  const adminFindMany = vi.fn(async () => []);
  const perfAggregate = vi.fn(async () => ({ _sum: { hours: 0 } }));
  const auditFn = vi.fn(async () => ({}));
  const prepareConcept = vi.fn(async () => ({
    partnerName: "Partner",
    conceptAmountCents: 1000,
  }));
  return { subFindUnique, upsert, adminFindMany, perfAggregate, auditFn, prepareConcept };
});

vi.mock("@/lib/db", () => ({
  prisma: {
    subscription: { findUnique: h.subFindUnique },
    taxFilingRequest: { upsert: h.upsert },
    administrationEntry: { findMany: h.adminFindMany },
    performance: { aggregate: h.perfAggregate },
  },
}));
vi.mock("@/lib/authz", () => ({
  AuthorizationError: class extends Error {},
  requireActor: vi.fn(async () => ({ id: "u1", role: "FREELANCER", status: "ACTIVE" })),
}));
vi.mock("@/lib/audit", () => ({ audit: h.auditFn }));
vi.mock("@/lib/tax-filing/partner", () => ({
  getTaxFilingPartner: () => ({ prepareConcept: h.prepareConcept }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { startFiling } from "./actions";

function form(): FormData {
  const fd = new FormData();
  fd.set("kind", "IB");
  fd.set("taxYear", "2025");
  fd.set("mandateKind", "DIGID");
  fd.set("consentDpa", "on");
  fd.set("consentShare", "on");
  fd.set("consentMandate", "on");
  return fd;
}

const YEAR = 365 * 24 * 60 * 60 * 1000;

beforeEach(() => {
  h.subFindUnique.mockReset();
  h.upsert.mockClear();
  h.auditFn.mockClear();
  h.prepareConcept.mockClear();
});

describe("startFiling — entitlement-verval (currentPeriodEnd)", () => {
  it("ACTIVE maar verlopen betaalde periode → geweigerd, geen partner-effect, geen upsert/audit", async () => {
    // status ACTIVE, maar de betaalde periode is een jaar geleden verlopen (verval-taak nog niet gedraaid).
    h.subFindUnique.mockResolvedValue({
      status: "ACTIVE",
      currentPeriodEnd: new Date(Date.now() - YEAR),
      plan: { key: "BUSINESS" },
    });

    const result = await startFiling(undefined, form());

    expect(result).toEqual({ error: expect.stringMatching(/Volledig Ontzorgd/i) });
    // Geen extern partner-effect en geen PII-verwerking voor een niet-gerechtigde ZZP'er.
    expect(h.prepareConcept).not.toHaveBeenCalled();
    expect(h.upsert).not.toHaveBeenCalled();
    expect(h.auditFn).not.toHaveBeenCalled();
  });

  it("ACTIVE met geldige (toekomstige) periode → toegestaan: partner + upsert + audit lopen", async () => {
    h.subFindUnique.mockResolvedValue({
      status: "ACTIVE",
      currentPeriodEnd: new Date(Date.now() + YEAR),
      plan: { key: "BUSINESS" },
    });

    const result = await startFiling(undefined, form());

    expect(result).toBeUndefined();
    expect(h.prepareConcept).toHaveBeenCalledTimes(1);
    expect(h.upsert).toHaveBeenCalledTimes(1);
    expect(h.auditFn).toHaveBeenCalledWith(
      expect.objectContaining({ action: "TAX_FILING_REQUESTED" }),
    );
  });
});
