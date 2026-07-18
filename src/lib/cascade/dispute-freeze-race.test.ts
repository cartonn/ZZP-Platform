// TOCTOU-grendel op de dispuut-bevriezing (§4 zijpad). `assertNotDisputed` is een pre-transactionele
// lees; tussen die lees en de effect-write zit planning-/laadwerk. Een dispuut dat in dat venster
// wordt geopend mocht de cascade tot nu toe niet bevriezen — een betaling/afronding/factuur-effect
// kon nog wegschrijven op een samenwerking die net in dispuut ging (geld-/statusinconsistentie).
// Deze test dekt de her-verificatie BINNEN de effect-transactie (rood zonder de fix).

import { describe, it, expect, vi, beforeEach } from "vitest";
import { emptyEffects } from "@/lib/cascade/types";
import type { DomainEventInput } from "@/lib/events";

const mockTransaction = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    domainEvent: { findUnique: vi.fn().mockResolvedValue(null) },
    $transaction: mockTransaction,
  },
}));

const applyMock = vi.fn().mockResolvedValue({});
vi.mock("@/lib/cascade/apply", () => ({ applyCascadeEffects: applyMock }));

// Installeert een fake-transactie waarin de her-verificatie-lees `disputedAt` teruggeeft.
function installTx(disputedAt: Date | null) {
  mockTransaction.mockReset();
  mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
    const fakeTx = {
      collaboration: { findUnique: vi.fn().mockResolvedValue({ disputedAt }) },
      domainEvent: { create: vi.fn().mockResolvedValue({ id: "event-1" }) },
      eventHandlerRun: { create: vi.fn().mockResolvedValue({}) },
    };
    return fn(fakeTx);
  });
}

const eventInput: DomainEventInput = {
  type: "PAYMENT_CONFIRMED",
  actorRole: "FREELANCER",
  actorId: "f1",
  subjectType: "Invoice",
  subjectId: "inv-1",
};
const owners = { FREELANCER: "f1", CLIENT: "c1" };

describe("dispuut-bevriezing — TOCTOU-grendel binnen de effect-transactie", () => {
  beforeEach(() => {
    applyMock.mockClear();
  });

  it("rolt de effect-transactie terug als er BINNEN de transactie een open dispuut blijkt", async () => {
    installTx(new Date("2026-07-18T10:00:00Z"));
    const { persistEventAndEffects } = await import("@/lib/cascade/commands-shared");
    await expect(
      persistEventAndEffects(eventInput, emptyEffects(), {
        owners,
        disputeGuardCollaborationId: "col-1",
      }),
    ).rejects.toThrow(/bevroren wegens een open dispuut/);
    // Cruciaal: geen enkel geld-/statuseffect is weggeschreven.
    expect(applyMock).not.toHaveBeenCalled();
  });

  it("laat de effect-transactie door wanneer de samenwerking niet in dispuut is", async () => {
    installTx(null);
    const { persistEventAndEffects } = await import("@/lib/cascade/commands-shared");
    await persistEventAndEffects(eventInput, emptyEffects(), {
      owners,
      disputeGuardCollaborationId: "col-1",
    });
    expect(applyMock).toHaveBeenCalledTimes(1);
  });

  it("zonder guard-id wordt er niet naar een dispuut gekeken (achterwaarts compatibel)", async () => {
    // Zelfs met een dispuut in de tx: zonder disputeGuardCollaborationId geen extra grendel.
    installTx(new Date("2026-07-18T10:00:00Z"));
    const { persistEventAndEffects } = await import("@/lib/cascade/commands-shared");
    await persistEventAndEffects(eventInput, emptyEffects(), { owners });
    expect(applyMock).toHaveBeenCalledTimes(1);
  });
});
