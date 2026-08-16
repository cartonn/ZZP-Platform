// Regressietest voor de next-action-engine (DOEL 1b — persona-sweep run 79): de opdrachtgever-
// compliance-query `clientCredentialAlerts` window-t 200 samenwerkingen. Vóór de fix ontbrak een
// `orderBy` — als enige `take: N`-query in deze familie — waardoor wélke 200-van-N rijen Prisma
// teruggaf niet gegarandeerd was; bij >200 gelijktijdige ACTIVE-samenwerkingen kon de hoogste
// opdrachtgever-next-action (clientComplianceTask, P.complianceRipple=85) tussen page-loads
// flapperen (verschijnen/verdwijnen zonder afhandeling). De fix maakt het venster deterministisch
// (`orderBy: { createdAt: "asc" }`, oudste blijft staan → self-healing) én filtert op
// `job: { credentialRequirements: { some: { required: true } } }` zodat alleen samenwerkingen die
// überhaupt een compliance-alert kúnnen opleveren een venster-slot vullen. Deze test borgt beide
// eigenschappen op de query-argumenten (zonder DB).

import { describe, it, expect, vi, beforeEach } from "vitest";

const captured = vi.hoisted(() => ({ args: null as unknown }));

vi.mock("@/lib/db", () => ({
  prisma: {
    company: { findUnique: vi.fn(async () => ({ id: "comp-1" })) },
    collaboration: {
      findMany: vi.fn(async (args: unknown) => {
        captured.args = args;
        return [];
      }),
    },
  },
}));

import { clientCredentialAlerts } from "@/lib/collaboration-alerts";

beforeEach(() => {
  captured.args = null;
});

describe("clientCredentialAlerts — deterministisch, gefilterd venster (DOEL 1b)", () => {
  it("ordent op createdAt asc en filtert op verplichte certificaat-vereisten", async () => {
    await clientCredentialAlerts("user-1");
    const args = captured.args as {
      where?: {
        companyId?: string;
        status?: string;
        disputedAt?: null;
        job?: { credentialRequirements?: { some?: { required?: boolean } } };
      };
      orderBy?: { createdAt?: string };
      take?: number;
    };

    // Deterministische ordening — dit ontbrak vóór de fix.
    expect(args.orderBy).toEqual({ createdAt: "asc" });
    // Alleen certificaat-dragende samenwerkingen vullen het venster.
    expect(args.where?.job?.credentialRequirements?.some?.required).toBe(true);
    // Bestaande scoping blijft: eigen company, lopend, niet in dispuut.
    expect(args.where?.companyId).toBe("comp-1");
    expect(args.where?.status).toBe("ACTIVE");
    expect(args.where?.disputedAt).toBeNull();
  });

  it("geeft een lege lijst terug zonder company (geen query-crash)", async () => {
    // Bevestigt de vroege return-pad-guard blijft intact.
    const { prisma } = await import("@/lib/db");
    (prisma.company.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const result = await clientCredentialAlerts("user-without-company");
    expect(result).toEqual([]);
  });
});
