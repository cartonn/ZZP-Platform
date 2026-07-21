import { describe, it, expect, vi, beforeEach } from "vitest";

// Permissieve where-vorm zodat de mock-call-argumenten getypeerd te inspecteren zijn (de repo draait
// met noUncheckedIndexedAccess; een parameterloze mock laat `.calls[0][0]` niet indexeren).
interface FindArgs {
  where: {
    status?: unknown;
    expiresAt?: unknown;
    freelancerProfile?: unknown;
    dueAt?: unknown;
    AND?: Array<{ OR?: Array<Record<string, unknown>> }>;
  };
}

const credentialFindManyMock = vi.hoisted(() =>
  vi.fn<(args: FindArgs) => Promise<unknown[]>>(async () => []),
);
const invoiceFindManyMock = vi.hoisted(() =>
  vi.fn<(args: FindArgs) => Promise<unknown[]>>(async () => []),
);
const getVatDeadlinesMock = vi.hoisted(() => vi.fn(async () => [] as unknown[]));

vi.mock("@/lib/db", () => ({
  prisma: {
    credential: { findMany: credentialFindManyMock },
    invoice: { findMany: invoiceFindManyMock },
  },
}));
vi.mock("@/lib/data/vat-deadline", () => ({ getVatDeadlinesForActor: getVatDeadlinesMock }));

import { loadUserAdministrativeDeadlines } from "@/lib/calendar/user-deadlines";

const USER = "user-1";
const NOW = new Date("2026-07-21T12:00:00Z");

beforeEach(() => {
  credentialFindManyMock.mockReset();
  credentialFindManyMock.mockResolvedValue([]);
  invoiceFindManyMock.mockReset();
  invoiceFindManyMock.mockResolvedValue([]);
  getVatDeadlinesMock.mockReset();
  getVatDeadlinesMock.mockResolvedValue([]);
});

describe("loadUserAdministrativeDeadlines", () => {
  it("ZZP'er: laadt VERIFIED certificaten met verloopdatum, gescoopt op de eigen userId", async () => {
    credentialFindManyMock.mockResolvedValue([
      { id: "c1", title: "VOG", expiresAt: new Date("2026-09-01T00:00:00Z") },
    ]);
    const result = await loadUserAdministrativeDeadlines(USER, "FREELANCER", NOW);

    expect(result.credentials).toEqual([
      { id: "c1", title: "VOG", expiresAt: new Date("2026-09-01T00:00:00Z") },
    ]);
    const where = credentialFindManyMock.mock.calls[0]?.[0]?.where;
    expect(where).toBeDefined();
    expect(where!.status).toBe("VERIFIED");
    expect(where!.expiresAt).toEqual({ not: null });
    expect(where!.freelancerProfile).toEqual({ userId: USER });
  });

  it("opdrachtgever: geen certificaatquery (niet-ZZP heeft geen dossier)", async () => {
    await loadUserAdministrativeDeadlines(USER, "CLIENT", NOW);
    expect(credentialFindManyMock).not.toHaveBeenCalled();
  });

  it("factuur payable=true wanneer de gebruiker de tegenpartij (betaler) is, anders false", async () => {
    invoiceFindManyMock.mockResolvedValue([
      {
        id: "i1",
        number: "F-1",
        dueAt: new Date("2026-08-01T00:00:00Z"),
        counterpartyUserId: USER,
      },
      {
        id: "i2",
        number: "F-2",
        dueAt: new Date("2026-08-02T00:00:00Z"),
        counterpartyUserId: "other",
      },
    ]);
    const result = await loadUserAdministrativeDeadlines(USER, "FREELANCER", NOW);
    expect(result.invoices).toEqual([
      { id: "i1", number: "F-1", dueAt: new Date("2026-08-01T00:00:00Z"), payable: true },
      { id: "i2", number: "F-2", dueAt: new Date("2026-08-02T00:00:00Z"), payable: false },
    ]);
  });

  it("scoopt facturen op openstaand + eigen partij, met een gezette dueAt", async () => {
    await loadUserAdministrativeDeadlines(USER, "FREELANCER", NOW);
    const where = invoiceFindManyMock.mock.calls[0]?.[0]?.where;
    expect(where).toBeDefined();
    expect(where!.dueAt).toEqual({ not: null });
    // De partij-OR (uitschrijver óf tegenpartij) zit in de AND naast de canonieke openstaand-where.
    // Discrimineer op de sleutel, want de openstaand-where dráágt zelf óók een OR van lengte 2.
    const partyClause = (where!.AND ?? []).find(
      (c) => Array.isArray(c.OR) && c.OR.some((o) => "issuerUserId" in o),
    );
    expect(partyClause?.OR).toContainEqual({ issuerUserId: USER });
    expect(partyClause?.OR).toContainEqual({ counterpartyUserId: USER });
  });

  it("delegeert BTW aan de bestaande engine en mapt jaar/kwartaal/deadline door", async () => {
    getVatDeadlinesMock.mockResolvedValue([
      {
        year: 2026,
        quarter: 2,
        deadline: new Date("2026-07-31T00:00:00Z"),
        daysUntil: 10,
        status: "DUE_SOON",
        balanceCents: 12100,
        party: "FREELANCER",
      },
    ]);
    const result = await loadUserAdministrativeDeadlines(USER, "FREELANCER", NOW);
    expect(getVatDeadlinesMock).toHaveBeenCalledWith(USER, "FREELANCER", NOW);
    expect(result.vat).toEqual([
      { year: 2026, quarter: 2, deadline: new Date("2026-07-31T00:00:00Z") },
    ]);
  });
});
