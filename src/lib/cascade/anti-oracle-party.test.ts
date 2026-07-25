// Anti-oracle (CWE-203) op de cascade-goedkeur/afkeur-commando's. Een actor die géén partij is bij de
// prestatie/factuur mag niet via een afwijkende "wie mag dit"-rolmelding het bestaan van de resource
// aftasten: onbekend id én bestaand-maar-vreemd id moeten exact dezelfde "niet gevonden"-melding geven.
// Dit verschil is productie-observeerbaar omdat de useActionState-drawers (approve/rejectPerformanceState,
// approve/rejectInvoiceState) de melding als RETURNwaarde tonen (niet door Next.js geredigeerd).
// Een echte partij aan de verkeerde kant (bv. de ZZP'er die zijn eigen prestatie wil goedkeuren) houdt
// wél de behulpzame rolmelding.
import { describe, it, expect, vi, beforeEach } from "vitest";

const perfRecord = () => ({
  id: "perf-1",
  status: "SUBMITTED",
  type: "HOURS" as const,
  hours: 8,
  rateCents: 5000,
  amountCents: null,
  ortSegments: null,
  collaborationId: "col-1",
  collaboration: {
    id: "col-1",
    ortProfile: null,
    ortCustomRates: null,
    freelancer: { userId: "f1" },
    company: { userId: "c1" },
  },
});

const invRecord = () => ({
  id: "inv-1",
  lifecycleStatus: "SUBMITTED",
  issuerUserId: "f1",
  counterpartyUserId: "c1",
  issuerKey: "f1",
  subtotalCents: 10000,
  vatCents: 2100,
  totalCents: 12100,
  partyInvoiceNumber: "2026-0001",
  correlationId: "col-1",
  collaborationId: "col-1",
});

vi.mock("@/lib/cascade/apply", () => ({ applyCascadeEffects: vi.fn().mockResolvedValue({}) }));
vi.mock("@/lib/services/mail-sender", () => ({
  getMailSender: () => ({ send: vi.fn().mockResolvedValue(undefined) }),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    performance: { findUnique: vi.fn().mockImplementation(async () => perfRecord()) },
    invoice: { findUnique: vi.fn().mockImplementation(async () => invRecord()) },
    collaboration: {
      findUnique: vi.fn().mockResolvedValue({ disputedAt: null, status: "ACTIVE" }),
    },
  },
}));

const STRANGER = { id: "x-stranger", role: "FREELANCER" as const, status: "ACTIVE" };
const FREELANCER = { id: "f1", role: "FREELANCER" as const, status: "ACTIVE" };

beforeEach(() => vi.clearAllMocks());

async function msg(p: Promise<unknown>): Promise<string> {
  try {
    await p;
    return "__no-throw__";
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

describe("cascade anti-oracle — niet-partij ononderscheidbaar van niet-gevonden", () => {
  it("approvePerformance: vreemde actor krijgt 'Prestatie niet gevonden.', niet de rolmelding", async () => {
    const { approvePerformance } = await import("@/lib/cascade/performance-commands");
    expect(await msg(approvePerformance(STRANGER, "perf-1"))).toBe("Prestatie niet gevonden.");
  });

  it("approvePerformance: eigen ZZP'er (partij, verkeerde kant) houdt de behulpzame rolmelding", async () => {
    const { approvePerformance } = await import("@/lib/cascade/performance-commands");
    expect(await msg(approvePerformance(FREELANCER, "perf-1"))).toBe(
      "Alleen de opdrachtgever kan de prestatie goedkeuren.",
    );
  });

  it("rejectPerformance: vreemde actor krijgt 'Prestatie niet gevonden.'", async () => {
    const { rejectPerformance } = await import("@/lib/cascade/performance-commands");
    expect(await msg(rejectPerformance(STRANGER, "perf-1", "reden"))).toBe(
      "Prestatie niet gevonden.",
    );
  });

  it("approveInvoice: vreemde actor krijgt 'Factuur niet gevonden.', niet de rolmelding", async () => {
    const { approveInvoice } = await import("@/lib/cascade/invoice-commands");
    expect(await msg(approveInvoice(STRANGER, "inv-1"))).toBe("Factuur niet gevonden.");
  });

  it("approveInvoice: uitschrijver (partij, verkeerde kant) houdt de rolmelding", async () => {
    const { approveInvoice } = await import("@/lib/cascade/invoice-commands");
    expect(await msg(approveInvoice(FREELANCER, "inv-1"))).toBe(
      "Alleen de opdrachtgever kan de factuur goedkeuren.",
    );
  });

  it("rejectInvoice: vreemde actor krijgt 'Factuur niet gevonden.'", async () => {
    const { rejectInvoice } = await import("@/lib/cascade/invoice-commands");
    expect(await msg(rejectInvoice(STRANGER, "inv-1", "reden"))).toBe("Factuur niet gevonden.");
  });
});
