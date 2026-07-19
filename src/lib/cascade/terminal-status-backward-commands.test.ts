// Terminale-status-grendel op de achterwaartse/zijpad-cascade-commando's (defense-in-depth, #825
// bracht de forward-siblings al onder de grendel). rejectPerformance / updatePerformance /
// rejectInvoice / creditInvoice mogen een geannuleerde (CANCELLED) samenwerking niet muteren; een
// creditnota ná AFRONDING (COMPLETED) is wél legitiem (allowCompleted). Deze test bewijst dat de
// grendel in élk van deze commando's is bedraad (rood zonder de wiring in de commands).

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mutabele staat die de gemockte samenwerking rapporteert.
let collabStatus = "ACTIVE";
let collabDisputedAt: Date | null = null;
let perfStatus = "SUBMITTED";

const perfRecord = () => ({
  id: "perf-1",
  status: perfStatus,
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
  lifecycleStatus: "PAID",
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

const applyMock = vi.fn().mockResolvedValue({});
vi.mock("@/lib/cascade/apply", () => ({ applyCascadeEffects: applyMock }));
vi.mock("@/lib/services/mail-sender", () => ({
  getMailSender: () => ({ send: vi.fn().mockResolvedValue(undefined) }),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    performance: {
      findUnique: vi.fn().mockImplementation(async () => perfRecord()),
      update: vi.fn().mockResolvedValue({}),
    },
    invoice: { findUnique: vi.fn().mockImplementation(async () => invRecord()) },
    collaboration: {
      findUnique: vi
        .fn()
        .mockImplementation(async () => ({ disputedAt: collabDisputedAt, status: collabStatus })),
    },
    domainEvent: { findUnique: vi.fn().mockResolvedValue(null) },
    notification: { createMany: vi.fn().mockResolvedValue({}) },
    // In-transactie-grendel leest disputedAt + status opnieuw; spiegelt de top-level mock.
    $transaction: (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        collaboration: {
          findUnique: vi
            .fn()
            .mockResolvedValue({ disputedAt: collabDisputedAt, status: collabStatus }),
        },
        domainEvent: { create: vi.fn().mockResolvedValue({ id: "event-1" }) },
        eventHandlerRun: { create: vi.fn().mockResolvedValue({}) },
      }),
  },
}));

const CLIENT = { id: "c1", role: "CLIENT" as const, status: "ACTIVE" };
const FREELANCER = { id: "f1", role: "FREELANCER" as const, status: "ACTIVE" };

beforeEach(() => {
  collabStatus = "ACTIVE";
  collabDisputedAt = null;
  perfStatus = "SUBMITTED";
  applyMock.mockClear();
});

describe("rejectPerformance — terminale-status-grendel", () => {
  it("weigert afkeuren op een GEANNULEERDE samenwerking", async () => {
    collabStatus = "CANCELLED";
    const { rejectPerformance } = await import("@/lib/cascade/performance-commands");
    await expect(rejectPerformance(CLIENT, "perf-1", "reden")).rejects.toThrow(/geannuleerd/);
    expect(applyMock).not.toHaveBeenCalled();
  });

  it("weigert afkeuren op een AFGERONDE samenwerking", async () => {
    collabStatus = "COMPLETED";
    const { rejectPerformance } = await import("@/lib/cascade/performance-commands");
    await expect(rejectPerformance(CLIENT, "perf-1", "reden")).rejects.toThrow(/afgerond/);
    expect(applyMock).not.toHaveBeenCalled();
  });
});

describe("updatePerformance — terminale-status-grendel", () => {
  it("weigert bijwerken van een concept op een GEANNULEERDE samenwerking", async () => {
    collabStatus = "CANCELLED";
    perfStatus = "DRAFT";
    const { updatePerformance } = await import("@/lib/cascade/performance-commands");
    await expect(
      updatePerformance(FREELANCER, "perf-1", { type: "HOURS", hours: 8, rateCents: 5000 }),
    ).rejects.toThrow(/geannuleerd/);
  });
});

describe("rejectInvoice — terminale-status-grendel", () => {
  it("weigert afkeuren op een GEANNULEERDE samenwerking", async () => {
    collabStatus = "CANCELLED";
    const { rejectInvoice } = await import("@/lib/cascade/invoice-commands");
    await expect(rejectInvoice(CLIENT, "inv-1", "reden")).rejects.toThrow(/geannuleerd/);
    expect(applyMock).not.toHaveBeenCalled();
  });
});

describe("creditInvoice — terminale-status-grendel (allowCompleted)", () => {
  it("weigert crediteren op een GEANNULEERDE samenwerking", async () => {
    collabStatus = "CANCELLED";
    const { creditInvoice } = await import("@/lib/cascade/invoice-commands");
    await expect(creditInvoice(FREELANCER, "inv-1", "reden")).rejects.toThrow(/geannuleerd/);
    expect(applyMock).not.toHaveBeenCalled();
  });

  it("staat crediteren toe op een AFGERONDE samenwerking (legitieme creditnota)", async () => {
    collabStatus = "COMPLETED";
    const { creditInvoice } = await import("@/lib/cascade/invoice-commands");
    await expect(creditInvoice(FREELANCER, "inv-1", "reden")).resolves.toBeUndefined();
    expect(applyMock).toHaveBeenCalledTimes(1);
  });
});
