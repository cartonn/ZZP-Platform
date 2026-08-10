import { describe, it, expect, vi, beforeEach } from "vitest";

interface FindArgs {
  where: { ownerUserId?: unknown; occurredAt?: { gte?: Date; lt?: Date } };
}

const entryFindManyMock = vi.hoisted(() =>
  vi.fn<(args: FindArgs) => Promise<unknown[]>>(async () => []),
);

vi.mock("@/lib/db", () => ({
  prisma: { administrationEntry: { findMany: entryFindManyMock } },
}));

import { getIncomeTaxDeadlineForActor } from "@/lib/data/income-tax-deadline";

const USER = "user-1";
// Vóór 1 mei → het te agenderen belastingjaar is het net-afgesloten jaar 2026.
const NOW = new Date("2027-02-15T12:00:00Z");

// Eén omzet-boeking (netto credit op OMZET) in belastingjaar 2026 → activiteit aanwezig.
const revenueRow = {
  party: "FREELANCER",
  account: "OMZET",
  debitCents: 0,
  creditCents: 100000,
  occurredAt: new Date("2026-06-01T10:00:00Z"),
};

beforeEach(() => {
  entryFindManyMock.mockReset();
  entryFindManyMock.mockResolvedValue([]);
});

describe("getIncomeTaxDeadlineForActor", () => {
  it("null voor niet-ZZP-rollen (geen query)", async () => {
    expect(await getIncomeTaxDeadlineForActor(USER, "CLIENT", NOW)).toBeNull();
    expect(await getIncomeTaxDeadlineForActor(USER, "ADMIN", NOW)).toBeNull();
    expect(entryFindManyMock).not.toHaveBeenCalled();
  });

  it("null wanneer er geen omzet in het belastingjaar geboekt is (voorkomt ruis)", async () => {
    entryFindManyMock.mockResolvedValue([]);
    expect(await getIncomeTaxDeadlineForActor(USER, "FREELANCER", NOW)).toBeNull();
  });

  it("levert de eerstvolgende IB-deadline bij omzet in het jaar, owner-gescoopt op het jaar", async () => {
    entryFindManyMock.mockResolvedValue([revenueRow]);
    const result = await getIncomeTaxDeadlineForActor(USER, "FREELANCER", NOW);
    expect(result).not.toBeNull();
    expect(result!.taxYear).toBe(2026);
    expect(result!.deadline.toISOString()).toBe("2027-05-01T00:00:00.000Z");

    const where = entryFindManyMock.mock.calls[0]?.[0]?.where;
    expect(where?.ownerUserId).toBe(USER);
    // Jaar-gescoopt: 1 jan 2026 (inclusief) t/m 1 jan 2027 (exclusief), lokale tijd.
    expect(where?.occurredAt?.gte).toEqual(new Date(2026, 0, 1));
    expect(where?.occurredAt?.lt).toEqual(new Date(2027, 0, 1));
  });

  it("negeert kosten-/nul-omzet: alleen netto credit op OMZET telt als activiteit", async () => {
    entryFindManyMock.mockResolvedValue([
      {
        party: "FREELANCER",
        account: "KOSTEN",
        debitCents: 50000,
        creditCents: 0,
        occurredAt: new Date("2026-03-01T00:00:00Z"),
      },
    ]);
    expect(await getIncomeTaxDeadlineForActor(USER, "FREELANCER", NOW)).toBeNull();
  });
});
