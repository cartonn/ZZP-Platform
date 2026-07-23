// Anti-oracle-contract voor createReviewAction (CWE-203 / OWASP A01 Broken Access Control).
//
// De server-action is direct aanroepbaar met een gegokt collaborationId. Vóór de fix gaf een ONBEKEND
// id ("Samenwerking niet gevonden.") en een BESTAAND id waar de actor géén partij bij is ("Alleen de
// betrokken partijen kunnen een beoordeling geven.") onderscheidbare meldingen — de melding wordt via
// de ResolveState verbatim naar de client gerenderd, dus een buitenstaander kon zo het bestaan van een
// willekeurige samenwerking aftasten. Na de fix geven beide EXACT dezelfde melding.

import { describe, it, expect, vi, beforeEach } from "vitest";

const store = {
  actor: { id: "outsider-1", role: "FREELANCER", status: "ACTIVE", tenantId: null },
  collab: null as Record<string, unknown> | null,
};

const findUnique = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@prisma/client", () => ({ Prisma: {} }));
vi.mock("@/lib/authz", () => ({ requireActor: vi.fn(async () => store.actor) }));
vi.mock("@/lib/audit", () => ({ auditData: (d: unknown) => d }));
vi.mock("@/lib/db", () => ({
  prisma: { collaboration: { findUnique }, review: { create: vi.fn() }, $transaction: vi.fn() },
}));
vi.mock("@/lib/config", () => ({ reviewBlindDays: () => 14 }));

import { createReviewAction } from "./review-actions";

function foreignCollab() {
  return {
    status: "COMPLETED",
    completedAt: new Date(),
    createdAt: new Date(),
    company: { userId: "client-9" },
    freelancer: { userId: "zzp-9" },
    reviews: [] as unknown[],
  };
}

beforeEach(() => {
  findUnique.mockReset();
  store.actor = { id: "outsider-1", role: "FREELANCER", status: "ACTIVE", tenantId: null };
});

describe("createReviewAction — existence-oracle (CWE-203)", () => {
  it("onbekend id → 'Samenwerking niet gevonden.'", async () => {
    findUnique.mockResolvedValue(null);
    const res = await createReviewAction("nope", undefined, new FormData());
    expect(res).toEqual({ error: "Samenwerking niet gevonden." });
  });

  it("bestaande samenwerking waar de actor geen partij is → IDENTIEKE melding (geen oracle)", async () => {
    findUnique.mockResolvedValue(foreignCollab());
    const res = await createReviewAction("col-1", undefined, new FormData());
    expect(res).toEqual({ error: "Samenwerking niet gevonden." });
  });

  it("de twee meldingen zijn niet te onderscheiden", async () => {
    findUnique.mockResolvedValueOnce(null);
    const unknown = await createReviewAction("nope", undefined, new FormData());
    findUnique.mockResolvedValueOnce(foreignCollab());
    const foreign = await createReviewAction("col-1", undefined, new FormData());
    expect(foreign).toEqual(unknown);
  });
});
