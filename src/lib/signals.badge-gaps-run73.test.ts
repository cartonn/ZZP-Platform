import { beforeEach, describe, expect, it, vi } from "vitest";

// Regressietest voor badge↔/acties-drift (persona-sweep run 73, DOEL 1b): de fiscale-deadline-taken
// (BTW-aangifte `vatDeadlineTask`, inkomstenbelasting `incomeTaxDeadlineTask`) verschijnen op /acties +
// de dashboard-rail (pending-tasks.ts) met een hoge, attention-toon-prioriteit, maar de nav-badges
// telden ze niet — de Administratie-hub (`/financien`) was het enige nav-item met een /acties-taak
// zonder badge (het "signaal op één oppervlak"-anti-patroon; zie run 70/71/#1059). Bovendien deelt de
// nieuwe fiscale-telling het href `/financien` met `overdueInvoices`, wat de oude `buildBadges` (laatste
// key wint) stil één van de twee liet overschrijven. Deze test grendelt beide vast:
//   1. `buildBadges` telt gelijk-href tellingen op i.p.v. overschrijven;
//   2. `navBadges` telt de fiscale-deadline-taken mee op `/financien` — exact dezelfde bron als /acties.

import { buildBadges } from "./signals";

describe("buildBadges — gelijk-href tellingen tellen op (run 73)", () => {
  it("telt overdueInvoices + fiscalDeadlines op op /financien i.p.v. overschrijven", () => {
    // Vóór de fix overschreef de tweede key de eerste → count 3 (of 2), niet 5.
    const badges = buildBadges({ overdueInvoices: 2, fiscalDeadlines: 3 });
    expect(badges["/financien"]).toEqual({ count: 5, tone: "attention" });
  });

  it("fiscalDeadlines alleen → attention-badge op /financien", () => {
    expect(buildBadges({ fiscalDeadlines: 1 })["/financien"]).toEqual({
      count: 1,
      tone: "attention",
    });
  });

  it("laat 0-tellingen weg (geen lege badge)", () => {
    expect(buildBadges({ overdueInvoices: 0, fiscalDeadlines: 0 })["/financien"]).toBeUndefined();
  });

  it("verandert bestaande, niet-gedeelde hrefs niet", () => {
    const badges = buildBadges({ overdueInvoices: 4 });
    expect(badges["/financien"]).toEqual({ count: 4, tone: "attention" });
  });
});

// --- navBadges-integratie: fiscale deadlines tellen mee op /financien (pariteit met /acties) ---

type CountArgs = { where?: Record<string, unknown> };

const state = {
  vatDeadlines: 0, // aantal te-agenderen BTW-vensters (elk = één taak op /acties)
  incomeTaxNeedsAction: false, // IB-deadline die nú actie vraagt (alleen ZZP'er)
  overdueInvoices: 0, // facturen over de vervaldatum (deelt /financien met de fiscale badge)
};

// De fiscale bron is exact dezelfde die pending-tasks.ts gebruikt — hier gemockt zodat de test de
// navBadges-bedrading toetst (telt de badge de taken mee?) zonder een volledige grootboek-seed.
vi.mock("@/lib/data/vat-deadline", () => ({
  getVatDeadlinesForActor: vi.fn(() =>
    Promise.resolve(Array.from({ length: state.vatDeadlines }, (_, i) => ({ quarter: i + 1 }))),
  ),
}));
vi.mock("@/lib/data/income-tax-deadline", () => ({
  getIncomeTaxDeadlineForActor: vi.fn(() =>
    Promise.resolve(state.incomeTaxNeedsAction ? { taxYear: 2025 } : null),
  ),
}));
vi.mock("@/lib/administration/income-tax-deadline", () => ({
  incomeTaxDeadlineNeedsAction: () => state.incomeTaxNeedsAction,
}));

vi.mock("@/lib/db", () => {
  const invoiceCount = vi.fn((_a: CountArgs) => Promise.resolve(state.overdueInvoices));
  return {
    prisma: {
      freelancerProfile: { findUnique: vi.fn(() => Promise.resolve({ id: "p-1" })) },
      company: { findUnique: vi.fn(() => Promise.resolve({ id: "c-1" })) },
      credential: {
        count: vi.fn(() => Promise.resolve(0)),
        findMany: vi.fn(() => Promise.resolve([])),
      },
      collaboration: { findMany: vi.fn(() => Promise.resolve([])) },
      savedJob: { count: vi.fn(() => Promise.resolve(0)) },
      job: {
        count: vi.fn(() => Promise.resolve(0)),
        findMany: vi.fn(() => Promise.resolve([])),
      },
      application: {
        count: vi.fn(() => Promise.resolve(0)),
        findMany: vi.fn(() => Promise.resolve([])),
      },
      performance: { count: vi.fn(() => Promise.resolve(0)) },
      invoice: { count: invoiceCount },
      conversationParticipant: { findMany: vi.fn(() => Promise.resolve([])) },
      message: { groupBy: vi.fn(() => Promise.resolve([])) },
    },
  };
});

import { navBadges } from "./signals";

beforeEach(() => {
  state.vatDeadlines = 0;
  state.incomeTaxNeedsAction = false;
  state.overdueInvoices = 0;
});

describe("navBadges — fiscale deadlines op /financien (run 73)", () => {
  it("FREELANCER: telt BTW + IB samen op /financien (pariteit met /acties)", async () => {
    state.vatDeadlines = 2;
    state.incomeTaxNeedsAction = true; // +1
    const badges = await navBadges("FREELANCER", "u-1");
    expect(badges["/financien"]).toEqual({ count: 3, tone: "attention" });
  });

  it("FREELANCER: fiscale badge sommeert met overdue-facturen op hetzelfde hub-item", async () => {
    state.vatDeadlines = 1;
    state.overdueInvoices = 2;
    const badges = await navBadges("FREELANCER", "u-1");
    expect(badges["/financien"]).toEqual({ count: 3, tone: "attention" });
  });

  it("FREELANCER: geen fiscale deadline → geen (stille) badge", async () => {
    const badges = await navBadges("FREELANCER", "u-1");
    expect(badges["/financien"]).toBeUndefined();
  });

  it("CLIENT: telt alléén BTW (geen IB voor de opdrachtgever)", async () => {
    state.vatDeadlines = 2;
    state.incomeTaxNeedsAction = true; // moet genegeerd worden voor CLIENT
    const badges = await navBadges("CLIENT", "u-1");
    expect(badges["/financien"]).toEqual({ count: 2, tone: "attention" });
  });
});
