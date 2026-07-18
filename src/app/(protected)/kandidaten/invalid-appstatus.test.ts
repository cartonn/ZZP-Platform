// Unit-tests voor changeApplicationStatus — robuustheid van de doelstatus-invoer (DOEL-2). Een
// geknutselde POST met een `target` buiten de ApplicationStatus-enum mag geen ongevangen ZodError →
// generieke 500 geven, maar een nette afwijzing die de DB niet raakt. Een geldige doelstatus passeert
// de safeParse-poort en bereikt loadOwnedApplication (die prisma aanroept). Prisma, authz, audit,
// next-cache en de overige libs gemockt; @/lib/enums is bewust ECHT.

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

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/authz", () => ({
  requireRole: vi.fn(async () => store.actor),
  assertOwnership: vi.fn(),
}));
vi.mock("@/lib/audit", () => ({ audit: vi.fn(async () => {}), auditData: vi.fn((d) => d) }));
vi.mock("@/lib/db", () => ({
  prisma: {
    application: { findUnique: findUniqueMock, update: vi.fn() },
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

import { changeApplicationStatus } from "./actions";

beforeEach(() => {
  findUniqueMock.mockReset();
  findUniqueMock.mockResolvedValue(null);
});

describe("changeApplicationStatus — doelstatus-validatie", () => {
  it("weigert een doelstatus buiten de enum met een nette fout, zónder de DB te raken", async () => {
    await expect(changeApplicationStatus("app-1", "HACKED")).rejects.toThrow(
      "Ongeldige doelstatus.",
    );
    // Cruciaal: de afwijzing gebeurt vóór elke DB-I/O (geen ongevangen ZodError → 500).
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("laat een geldige doelstatus door tot loadOwnedApplication (hier: niet gevonden)", async () => {
    // "VIEWED" is een geldige ApplicationStatus; hij passeert de safeParse-poort en bereikt de lookup.
    await expect(changeApplicationStatus("app-1", "VIEWED")).rejects.toThrow(
      "Reactie niet gevonden.",
    );
    expect(findUniqueMock).toHaveBeenCalledTimes(1);
  });
});
