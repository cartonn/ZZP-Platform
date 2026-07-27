// Unit-tests voor loadOwnedApplication (via changeApplicationStatus/saveApplicationNote) — geen
// CWE-203 existence-oracle. Voorheen gaf een ONBEKENDE reactie "Reactie niet gevonden." maar een
// BESTAANDE-maar-niet-eigen reactie een andere fout (assertOwnership → AuthorizationError). Een
// opdrachtgever kon zo via een gegokt id het bestaan van andermans reactie aftasten. Nu geven beide
// paden EXACT dezelfde melding, zonder de DB te muteren. Spiegelt withdrawApplication (reacties/).
//
// Prisma, authz, audit, next-cache en de overige libs gemockt; @/lib/enums is bewust ECHT.

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

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// assertOwnership mag GEEN rol meer spelen: de ownership-poort is nu een inline id-vergelijking in
// loadOwnedApplication. We mocken hem als een throw zodat een test faalt als de productie-code hem
// per ongeluk terug zou introduceren (dan zou de melding weer divergeren).
vi.mock("@/lib/authz", () => ({
  requireRole: vi.fn(async () => store.actor),
}));
vi.mock("@/lib/audit", () => ({ audit: vi.fn(async () => {}), auditData: vi.fn((d) => d) }));
vi.mock("@/lib/db", () => ({
  prisma: {
    application: { findUnique: findUniqueMock, update: updateMock },
  },
}));
vi.mock("@/lib/applications", () => ({
  assertApplicationTransition: vi.fn(),
  ApplicationTransitionError: class extends Error {},
  planBulkApplicationTransition: vi.fn(() => ({ eligible: [], skipped: [] })),
}));
vi.mock("@/lib/rejection-reason", () => ({
  buildRejectionNotificationBody: vi.fn(() => ""),
  optionalRejectionReasonSchema: { safeParse: vi.fn(() => ({ success: true, data: null })) },
}));
vi.mock("@/lib/text-bounds", () => ({ boundReason: vi.fn((v) => v) }));

import { changeApplicationStatus, saveApplicationNote } from "./actions";

function foreignApp() {
  // Bestaat wél, maar hoort bij een ánder bedrijf (company.userId ≠ actor.id).
  return {
    id: "app-1",
    status: "NEW",
    job: { title: "Wijkverpleegkundige", company: { userId: "andere-client" } },
    freelancer: { userId: "zzp-9" },
    collaboration: null,
  };
}

beforeEach(() => {
  findUniqueMock.mockReset();
  updateMock.mockClear();
});

describe("loadOwnedApplication — geen existence-oracle (CWE-203)", () => {
  it("changeApplicationStatus: niet-eigen reactie geeft exact dezelfde fout als niet-gevonden", async () => {
    findUniqueMock.mockResolvedValueOnce(null);
    const notFound = await changeApplicationStatus("app-x", "VIEWED").catch((e) => e);

    findUniqueMock.mockResolvedValueOnce(foreignApp());
    const notOwned = await changeApplicationStatus("app-1", "VIEWED").catch((e) => e);

    expect(notFound).toBeInstanceOf(Error);
    expect(notOwned).toBeInstanceOf(Error);
    expect((notOwned as Error).message).toBe("Reactie niet gevonden.");
    expect((notOwned as Error).message).toBe((notFound as Error).message);
    // Niets gemuteerd op andermans reactie.
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("saveApplicationNote: niet-eigen reactie geeft dezelfde 'niet gevonden'-fout, muteert niet", async () => {
    findUniqueMock.mockResolvedValueOnce(foreignApp());
    await expect(saveApplicationNote("app-1", undefined, new FormData())).rejects.toThrow(
      "Reactie niet gevonden.",
    );
    expect(updateMock).not.toHaveBeenCalled();
  });
});
