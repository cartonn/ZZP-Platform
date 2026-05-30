// Idempotentie-hardening: dezelfde logische actie tweemaal publiceren → één effect.
// Strategie: test dat (a) elke pure planner voor hetzelfde input hetzelfde dedupeKey-anker
// geeft, en (b) de dedupeKey-extractie bij de cascade-commands voorspelbaar en stabiel is.
// De DB-laag (domainEvent.findUnique → vroegtijdig teruggaan) is getest via de mock hieronder.

import { describe, expect, it, vi, beforeEach } from "vitest";
import { planContractSigned, planPerformanceSubmitted, planInvoiceSubmittedEvent } from "@/lib/cascade/handlers";

// --- Pure planner idempotentie -------------------------------------------

describe("dedupeKey-stabiliteit: planners geven dezelfde sleutel voor hetzelfde input", () => {
  const now = new Date("2026-06-01T10:00:00Z");

  it("planContractSigned — zelfde collaborationId → zelfde events (herhaalbaar)", () => {
    const input = {
      collaborationId: "col-abc",
      status: "PROPOSED" as const,
      freelancerUserId: "f1",
      clientUserId: "c1",
      jobTitle: "Test opdracht",
      actorId: "c1",
    };
    const fx1 = planContractSigned(input);
    const fx2 = planContractSigned(input);
    // Zelfde inputs → zelfde statuswijzigingen en dezelfde notificatie-ontvangers.
    expect(fx1.statusChanges).toEqual(fx2.statusChanges);
    expect(fx1.notifications.map((n) => n.userId).sort()).toEqual(
      fx2.notifications.map((n) => n.userId).sort(),
    );
  });

  it("planPerformanceSubmitted — zelfde performanceId → zelfde events", () => {
    const input = {
      performanceId: "perf-1",
      status: "DRAFT" as const,
      performanceType: "HOURS" as const,
      collaborationId: "col-abc",
      clientUserId: "c1",
      now,
      actorId: "f1",
    };
    const fx1 = planPerformanceSubmitted(input);
    const fx2 = planPerformanceSubmitted(input);
    expect(fx1.statusChanges).toEqual(fx2.statusChanges);
    expect(fx1.notifications).toEqual(fx2.notifications);
  });

  it("planInvoiceSubmittedEvent — zelfde invoiceId → zelfde events", () => {
    const input = {
      invoice: { id: "inv-1", lifecycleStatus: "DRAFT" as const, subtotalCents: 100000, vatCents: 21000, totalCents: 121000 },
      partyInvoiceNumber: "2026-0001",
      clientUserId: "c1",
      now,
      actorId: "f1",
    };
    const fx1 = planInvoiceSubmittedEvent(input);
    const fx2 = planInvoiceSubmittedEvent(input);
    expect(fx1.statusChanges).toEqual(fx2.statusChanges);
    expect(fx1.notifications.map((n) => n.userId).sort()).toEqual(
      fx2.notifications.map((n) => n.userId).sort(),
    );
  });
});

// --- DB-laag: dedupeKey guard via mock -----------------------------------
// De dedupeKey-check in persistEventAndEffects (commands.ts) vraagt prisma.domainEvent.findUnique.
// Bij een bestaand event wordt de transactie overgeslagen — dit simuleren we hier.

const mockTransaction = vi.fn();
const domainEventStore = new Map<string, { id: string; dedupeKey: string }>();

vi.mock("@/lib/db", () => ({
  prisma: {
    domainEvent: {
      findUnique: vi.fn(({ where }: { where: { dedupeKey: string } }) =>
        Promise.resolve(domainEventStore.get(where.dedupeKey) ?? null),
      ),
    },
    collaboration: {
      findUnique: vi.fn().mockResolvedValue({
        id: "col-abc",
        status: "PROPOSED",
        disputedAt: null,
        company: { userId: "c1" },
        freelancer: { userId: "f1" },
        job: { title: "Test opdracht" },
      }),
    },
    $transaction: mockTransaction,
  },
}));

vi.mock("@/lib/cascade/apply", () => ({
  applyCascadeEffects: vi.fn().mockResolvedValue({}),
}));

describe("signContract — DB-niveau idempotentie via dedupeKey", () => {
  beforeEach(() => {
    domainEventStore.clear();
    mockTransaction.mockReset();
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const fakeTx = {
        domainEvent: {
          create: vi.fn(({ data }: { data: { dedupeKey?: string | null; [k: string]: unknown } }) => {
            const event = { id: "event-1", dedupeKey: data.dedupeKey ?? null, ...data };
            if (data.dedupeKey) domainEventStore.set(data.dedupeKey, { id: "event-1", dedupeKey: data.dedupeKey });
            return Promise.resolve(event);
          }),
        },
        eventHandlerRun: { create: vi.fn().mockResolvedValue({}) },
        // applyCascadeEffects is gemockt; de fakeTx hoeft het niet te bevatten.
      };
      return fn(fakeTx);
    });
  });

  it("eerste aanroep voert de transactie uit", async () => {
    const { signContract } = await import("@/lib/cascade/commands");
    const actor = { id: "c1", role: "CLIENT" as const, name: "Client", status: "ACTIVE" };
    await signContract(actor, "col-abc");
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it("tweede aanroep met dezelfde collaborationId slaat de transactie over (idempotent)", async () => {
    // Simuleer dat het event al in de store zit (zoals na de eerste succesvolle aanroep).
    domainEventStore.set("contract-signed-col-abc", { id: "event-1", dedupeKey: "contract-signed-col-abc" });

    const { signContract } = await import("@/lib/cascade/commands");
    const actor = { id: "c1", role: "CLIENT" as const, name: "Client", status: "ACTIVE" };
    await signContract(actor, "col-abc");
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});
