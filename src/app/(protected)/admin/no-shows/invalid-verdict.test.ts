// Unit-tests voor judgeNoShowReport — robuustheid van de oordeel-invoer (DOEL 2). Een geknutselde
// admin-POST met een `verdict` buiten de NoShowVerdict-enum mag geen ongevangen ZodError → generieke
// 500 geven, maar een nette afwijzing, en mag de DB niet raken. Een geldig oordeel passeert de poort
// en bereikt de melding-lookup. Prisma, authz, audit, next-cache en no-show gemockt; enums is echt.

import { describe, it, expect, vi, beforeEach } from "vitest";

const findUniqueMock = vi.hoisted(() =>
  vi.fn(async (): Promise<Record<string, unknown> | null> => null),
);
const updateMock = vi.hoisted(() => vi.fn(async () => ({})));
const countMock = vi.hoisted(() => vi.fn(async () => 0));
const notificationCreateMock = vi.hoisted(() => vi.fn(async () => ({})));
const auditCreateMock = vi.hoisted(() => vi.fn(async () => ({})));
const transactionMock = vi.hoisted(() => vi.fn(async () => []));

vi.mock("@/lib/authz", () => ({
  requireRole: vi.fn(async () => ({ id: "admin-1", role: "ADMIN", status: "ACTIVE" })),
  AuthorizationError: class extends Error {},
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/audit", () => ({ auditData: vi.fn((d: unknown) => d) }));
vi.mock("@/lib/no-show", () => ({
  NO_SHOW_LIMIT: 3,
  noShowStanding: vi.fn(() => ({ unjustified: 0, atLimit: false })),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    noShowReport: { findUnique: findUniqueMock, update: updateMock, count: countMock },
    notification: { create: notificationCreateMock },
    auditLog: { create: auditCreateMock },
    $transaction: transactionMock,
  },
}));

import { judgeNoShowReport } from "./actions";

beforeEach(() => {
  findUniqueMock.mockReset();
  findUniqueMock.mockResolvedValue(null);
  updateMock.mockClear();
  countMock.mockClear();
  notificationCreateMock.mockClear();
  auditCreateMock.mockClear();
  transactionMock.mockClear();
});

describe("judgeNoShowReport — oordeel-validatie", () => {
  it("weigert een oordeel buiten de enum met een nette fout, zónder de DB te raken", async () => {
    await expect(judgeNoShowReport("r-1", "HACKED")).rejects.toThrow("Ongeldig oordeel.");
    // Cruciaal: de afwijzing gebeurt vóór elke DB-I/O (geen ongevangen ZodError → 500).
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("laat een geldig oordeel door tot de melding-lookup (hier: niet gevonden)", async () => {
    // Een geldige enum-waarde passeert de safeParse-poort en bereikt de report-lookup.
    await expect(judgeNoShowReport("r-1", "JUSTIFIED")).rejects.toThrow("Melding niet gevonden.");
    expect(findUniqueMock).toHaveBeenCalledTimes(1);
  });
});
