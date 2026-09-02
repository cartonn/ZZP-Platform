import { describe, it, expect, vi, beforeEach } from "vitest";

// Permissieve where-vorm zodat de mock-call-argumenten getypeerd te inspecteren zijn (de repo draait
// met noUncheckedIndexedAccess; een parameterloze mock laat `.calls[0][0]` niet indexeren).
interface FindArgs {
  where: {
    status?: unknown;
    expiresAt?: unknown;
    freelancerProfile?: unknown;
    dueAt?: unknown;
    disputedAt?: unknown;
    endDate?: unknown;
    AND?: Array<{ OR?: Array<Record<string, unknown>> }>;
    OR?: Array<Record<string, unknown>>;
  };
}

const credentialFindManyMock = vi.hoisted(() =>
  vi.fn<(args: FindArgs) => Promise<unknown[]>>(async () => []),
);
const invoiceFindManyMock = vi.hoisted(() =>
  vi.fn<(args: FindArgs) => Promise<unknown[]>>(async () => []),
);
const getVatDeadlinesMock = vi.hoisted(() => vi.fn(async () => [] as unknown[]));
const getIncomeTaxDeadlineMock = vi.hoisted(() => vi.fn(async () => null as unknown));
const collaborationFindManyMock = vi.hoisted(() =>
  vi.fn<(args: FindArgs) => Promise<unknown[]>>(async () => []),
);

vi.mock("@/lib/db", () => ({
  prisma: {
    credential: { findMany: credentialFindManyMock },
    invoice: { findMany: invoiceFindManyMock },
    collaboration: { findMany: collaborationFindManyMock },
  },
}));
vi.mock("@/lib/data/vat-deadline", () => ({ getVatDeadlinesForActor: getVatDeadlinesMock }));
vi.mock("@/lib/data/income-tax-deadline", () => ({
  getIncomeTaxDeadlineForActor: getIncomeTaxDeadlineMock,
}));

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
  getIncomeTaxDeadlineMock.mockReset();
  getIncomeTaxDeadlineMock.mockResolvedValue(null);
  collaborationFindManyMock.mockReset();
  collaborationFindManyMock.mockResolvedValue([]);
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

  it("delegeert de IB-deadline aan de engine en mapt belastingjaar/deadline door", async () => {
    getIncomeTaxDeadlineMock.mockResolvedValue({
      taxYear: 2026,
      deadline: new Date("2027-05-01T00:00:00Z"),
      daysUntil: 284,
      status: "upcoming",
    });
    const result = await loadUserAdministrativeDeadlines(USER, "FREELANCER", NOW);
    expect(getIncomeTaxDeadlineMock).toHaveBeenCalledWith(USER, "FREELANCER", NOW);
    expect(result.incomeTax).toEqual({
      taxYear: 2026,
      deadline: new Date("2027-05-01T00:00:00Z"),
    });
  });

  it("incomeTax is null wanneer de engine niets teruggeeft (geen omzet / niet-ZZP)", async () => {
    getIncomeTaxDeadlineMock.mockResolvedValue(null);
    const result = await loadUserAdministrativeDeadlines(USER, "CLIENT", NOW);
    expect(result.incomeTax).toBeNull();
  });

  it("ZZP'er: laadt lopende plaatsingen met einddatum en toont de opdrachtgever als tegenpartij", async () => {
    collaborationFindManyMock.mockResolvedValue([
      {
        id: "col-1",
        startDate: new Date("2026-05-01T00:00:00Z"), // verstreken → geen start-event
        endDate: new Date("2026-10-01T00:00:00Z"),
        freelancer: { userId: USER, user: { name: "Sanne de Vries" } },
        company: { userId: "other-client", name: "Zorggroep De Linde" },
      },
    ]);
    const result = await loadUserAdministrativeDeadlines(USER, "FREELANCER", NOW);
    expect(result.collaborations).toEqual([
      {
        id: "col-1",
        endDate: new Date("2026-10-01T00:00:00Z"),
        counterpartyName: "Zorggroep De Linde",
        asClient: false,
      },
    ]);
    // Een reeds aangebroken start levert geen start-event (her-toets `>= now` in JS).
    expect(result.placementStarts).toEqual([]);
    // Scoping: alleen ACTIVE, niet-betwiste plaatsingen van de eigen gebruiker, met een nog niet
    // aangebroken start óf een nog niet verstreken einde.
    const where = collaborationFindManyMock.mock.calls[0]?.[0]?.where;
    expect(where!.status).toBe("ACTIVE");
    expect(where!.disputedAt).toBeNull();
    const partyClause = (where!.AND ?? []).find(
      (c) => Array.isArray(c.OR) && c.OR.some((o) => "freelancer" in o),
    );
    expect(partyClause?.OR).toEqual([
      { freelancer: { userId: USER } },
      { company: { userId: USER } },
    ]);
    const dateClause = (where!.AND ?? []).find(
      (c) => Array.isArray(c.OR) && c.OR.some((o) => "endDate" in o || "startDate" in o),
    );
    expect(dateClause?.OR).toContainEqual({ endDate: { not: null, gte: NOW } });
    expect(dateClause?.OR).toContainEqual({ startDate: { not: null, gte: NOW } });
  });

  it("ZZP'er: een aanstaande startdatum levert een placementStart (opdrachtgever als tegenpartij)", async () => {
    collaborationFindManyMock.mockResolvedValue([
      {
        id: "col-3",
        startDate: new Date("2026-08-15T00:00:00Z"), // toekomst → start-event
        endDate: null, // geen einddatum → geen einde-event
        freelancer: { userId: USER, user: { name: "Sanne de Vries" } },
        company: { userId: "other-client", name: "Zorggroep De Linde" },
      },
    ]);
    const result = await loadUserAdministrativeDeadlines(USER, "FREELANCER", NOW);
    expect(result.placementStarts).toEqual([
      {
        id: "col-3",
        startDate: new Date("2026-08-15T00:00:00Z"),
        counterpartyName: "Zorggroep De Linde",
        asClient: false,
      },
    ]);
    // Geen einddatum → geen einde-event (de rij matchte via de start).
    expect(result.collaborations).toEqual([]);
  });

  it("opdrachtgever: een aanstaande startdatum toont de ZZP'er als tegenpartij (asClient)", async () => {
    collaborationFindManyMock.mockResolvedValue([
      {
        id: "col-4",
        startDate: new Date("2026-09-01T00:00:00Z"),
        endDate: new Date("2026-12-01T00:00:00Z"),
        freelancer: { userId: "other-zzp", user: { name: "Sanne de Vries" } },
        company: { userId: USER, name: "Mijn Bedrijf BV" },
      },
    ]);
    const result = await loadUserAdministrativeDeadlines(USER, "CLIENT", NOW);
    // Toekomstige start én toekomstig einde → beide events, dezelfde tegenpartij/asClient.
    expect(result.placementStarts).toEqual([
      {
        id: "col-4",
        startDate: new Date("2026-09-01T00:00:00Z"),
        counterpartyName: "Sanne de Vries",
        asClient: true,
      },
    ]);
    expect(result.collaborations).toEqual([
      {
        id: "col-4",
        endDate: new Date("2026-12-01T00:00:00Z"),
        counterpartyName: "Sanne de Vries",
        asClient: true,
      },
    ]);
  });

  it("opdrachtgever: toont de ZZP'er als tegenpartij (asClient) op de plaatsing-einddatum", async () => {
    collaborationFindManyMock.mockResolvedValue([
      {
        id: "col-2",
        endDate: new Date("2026-11-15T00:00:00Z"),
        freelancer: { userId: "other-zzp", user: { name: "Sanne de Vries" } },
        company: { userId: USER, name: "Mijn Bedrijf BV" },
      },
    ]);
    const result = await loadUserAdministrativeDeadlines(USER, "CLIENT", NOW);
    expect(result.collaborations).toEqual([
      {
        id: "col-2",
        endDate: new Date("2026-11-15T00:00:00Z"),
        counterpartyName: "Sanne de Vries",
        asClient: true,
      },
    ]);
  });

  it("bemiddelaar/admin: geen plaatsing-query (agenda = eigen data)", async () => {
    await loadUserAdministrativeDeadlines(USER, "FRANCHISER", NOW);
    await loadUserAdministrativeDeadlines(USER, "ADMIN", NOW);
    expect(collaborationFindManyMock).not.toHaveBeenCalled();
  });
});
