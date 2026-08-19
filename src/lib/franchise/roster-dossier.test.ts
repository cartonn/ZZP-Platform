import { describe, it, expect, vi, beforeEach } from "vitest";

// Regressietest voor het bemiddelaar-dossier (persona-sweep run 80 residu, na #1125): de Facturen-tab
// scoopte de facturenlijst op de kolom `issuerUserId` — die zet alléén de cascade-handler. Een legacy
// loose-factuur (handmatig via /facturen/nieuw) heeft geen `issuerUserId` en viel dus volledig weg uit
// het dossier van de ZZP'er. De fix scoopt via de altijd-gevulde relatie (`collaboration.freelancerId`
// + tenant), net als de KPI-fixes in #1125 en de prestatie-query ernaast.

const invoiceFindMany = vi.fn();
const profileFindFirst = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    freelancerProfile: { findFirst: (args: unknown) => profileFindFirst(args) },
    collaboration: { findMany: vi.fn(async () => []) },
    performance: { findMany: vi.fn(async () => []) },
    invoice: { findMany: (args: unknown) => invoiceFindMany(args) },
    auditLog: { findMany: vi.fn(async () => []) },
  },
}));

vi.mock("@/lib/tenancy", () => ({
  tenantScopeWhere: () => ({ tenantId: "t1" }),
}));

import { getRosterDossier } from "./roster-dossier";
import { type Actor } from "@/lib/authz";

const ACTOR = { id: "b1", role: "FRANCHISER", tenantId: "t1" } as unknown as Actor;

const PROFILE = {
  id: "p1",
  user: { id: "u1", name: "Sanne", email: "s@x.nl", identityVerifiedAt: null, lastLoginAt: null },
  skills: [],
  industries: [],
  credentials: [],
  completeness: 50,
  availability: "AVAILABLE",
  headline: null,
  bio: null,
  location: null,
  workMode: "REMOTE",
  hourlyRate: null,
  maxTravelMinutes: null,
  languages: null,
  kvkNumber: null,
  btwNumber: null,
};

beforeEach(() => {
  invoiceFindMany.mockReset();
  invoiceFindMany.mockResolvedValue([]);
  profileFindFirst.mockReset();
  profileFindFirst.mockResolvedValue(PROFILE);
});

describe("getRosterDossier — factuur-scoping", () => {
  it("scoopt facturen via de samenwerkings-relatie (freelancerId + tenant), niet op issuerUserId", async () => {
    await getRosterDossier(ACTOR, "p1");

    expect(invoiceFindMany).toHaveBeenCalledTimes(1);
    const where = invoiceFindMany.mock.calls[0][0].where;
    // Scoping via de altijd-gevulde relatie: déze ZZP'er, binnen de eigen tenant.
    expect(where.collaboration.is.freelancerId).toBe("p1");
    expect(where.collaboration.is.job.is).toEqual({ tenantId: "t1" });
    // De cascade-only kolom mag NIET meer de scoping bepalen (anders vielen legacy-facturen weg).
    expect(where.issuerUserId).toBeUndefined();
  });

  it("neemt een legacy loose-factuur zonder issuerUserId op in het dossier", async () => {
    invoiceFindMany.mockResolvedValue([
      {
        id: "inv-legacy",
        number: "2026-0007",
        status: "SENT",
        totalCents: 121000,
        issuedAt: new Date("2026-08-01"),
        dueAt: new Date("2026-08-31"),
        // Legacy: geen issuerUserId; hoort bij deze ZZP'er via de samenwerking.
        collaboration: { company: { name: "Zorg BV" } },
      },
    ]);

    const dossier = await getRosterDossier(ACTOR, "p1");

    expect(dossier?.invoices).toHaveLength(1);
    expect(dossier?.invoices[0]).toMatchObject({
      id: "inv-legacy",
      number: "2026-0007",
      status: "SENT",
      companyName: "Zorg BV",
      totalCents: 121000,
    });
    expect(dossier?.counts.invoices).toBe(1);
  });

  it("geeft null als de ZZP'er niet in de roster van de actor zit (geen cross-tenant lek)", async () => {
    profileFindFirst.mockResolvedValue(null);
    const dossier = await getRosterDossier(ACTOR, "p1");
    expect(dossier).toBeNull();
    expect(invoiceFindMany).not.toHaveBeenCalled();
  });
});
