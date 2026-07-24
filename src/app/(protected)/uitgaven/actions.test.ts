// Contract van createExpense/deleteExpense: auth → rol FREELANCER → Zod → transactie
// (Expense + gebalanceerde grootboekregels + audit). Ongeldige/niet-eigen invoer schrijft niets.

import { describe, it, expect, vi, beforeEach } from "vitest";

const roleState = vi.hoisted(() => ({ role: "FREELANCER" as string }));
const expenseState = vi.hoisted(() => ({
  found: null as { id: string; userId: string } | null,
}));

const { FakeAuthError } = vi.hoisted(() => ({ FakeAuthError: class extends Error {} }));

vi.mock("@/lib/authz", () => ({
  AuthorizationError: FakeAuthError,
  requireRole: vi.fn(async (...roles: string[]) => {
    if (!roles.includes(roleState.role)) throw new FakeAuthError("Geen toegang.");
    return { id: "user-1", role: roleState.role, status: "ACTIVE" };
  }),
  assertOwnership: vi.fn((actor: { id: string }, ownerId: string) => {
    if (actor.id !== ownerId) throw new FakeAuthError("Geen toegang.");
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const tx = vi.hoisted(() => ({
  expenseCreate: vi.fn(async (_args: { data: Record<string, unknown> }) => ({ id: "exp-1" })),
  entriesCreateMany: vi.fn(async (_args: { data: Record<string, unknown>[] }) => ({ count: 3 })),
  auditCreate: vi.fn(async (_args: { data: { action: string } }) => ({})),
  entriesDeleteMany: vi.fn(async (_args: { where: Record<string, unknown> }) => ({ count: 3 })),
  expenseDelete: vi.fn(async (_args: { where: Record<string, unknown> }) => ({})),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: vi.fn(async (cb: (client: unknown) => Promise<unknown>) =>
      cb({
        expense: { create: tx.expenseCreate, delete: tx.expenseDelete },
        administrationEntry: {
          createMany: tx.entriesCreateMany,
          deleteMany: tx.entriesDeleteMany,
        },
        auditLog: { create: tx.auditCreate },
      }),
    ),
    expense: {
      // findFirst scoopt op { id, userId }: geeft de rij alleen terug als hij van de actor is —
      // andermans uitgave "bestaat" per constructie niet voor deze query (anti-oracle).
      findFirst: vi.fn(async (args: { where: { id: string; userId: string } }) =>
        expenseState.found && expenseState.found.userId === args.where.userId
          ? expenseState.found
          : null,
      ),
    },
  },
}));

import { createExpense, deleteExpense } from "./actions";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const validFields = {
  description: "Treinkaartje klant",
  category: "REISKOSTEN",
  netAmount: "25,00",
  vatAmount: "5,25",
  occurredAt: "2026-03-10",
};

describe("createExpense", () => {
  beforeEach(() => {
    roleState.role = "FREELANCER";
    Object.values(tx).forEach((m) => m.mockClear());
  });

  it("boekt een geldige uitgave met grootboekregels + audit", async () => {
    const res = await createExpense(undefined, form(validFields));
    expect(res).toEqual({ ok: true });

    expect(tx.expenseCreate).toHaveBeenCalledTimes(1);
    const created = tx.expenseCreate.mock.calls[0]![0] as { data: Record<string, unknown> };
    expect(created.data).toMatchObject({
      userId: "user-1",
      description: "Treinkaartje klant",
      category: "REISKOSTEN",
      netCents: 2500,
      vatCents: 525,
    });

    // Grootboekregels: KOSTEN + BTW_VOORBELASTING + BETAALD, allemaal op expense + eigenaar.
    const entries = (tx.entriesCreateMany.mock.calls[0]![0] as { data: Record<string, unknown>[] })
      .data;
    expect(entries).toHaveLength(3);
    expect(entries.every((e) => e.ownerUserId === "user-1" && e.expenseId === "exp-1")).toBe(true);
    const debit = entries.reduce((s, e) => s + (e.debitCents as number), 0);
    const credit = entries.reduce((s, e) => s + (e.creditCents as number), 0);
    expect(debit).toBe(credit);

    const audit = tx.auditCreate.mock.calls[0]![0] as { data: { action: string } };
    expect(audit.data.action).toBe("EXPENSE_CREATED");
  });

  it("weigert een bedrag van € 0 zonder te schrijven", async () => {
    const res = await createExpense(
      undefined,
      form({ ...validFields, netAmount: "0", vatAmount: "0" }),
    );
    expect(res?.error).toBeTruthy();
    expect(tx.expenseCreate).not.toHaveBeenCalled();
  });

  it("weigert een onbekende categorie", async () => {
    const res = await createExpense(undefined, form({ ...validFields, category: "VAKANTIE" }));
    expect(res?.error).toBeTruthy();
    expect(tx.expenseCreate).not.toHaveBeenCalled();
  });

  it("weigert een ongeldige datum", async () => {
    const res = await createExpense(undefined, form({ ...validFields, occurredAt: "2026-02-31" }));
    expect(res?.error).toBeTruthy();
    expect(tx.expenseCreate).not.toHaveBeenCalled();
  });

  it("weigert een datum in de toekomst", async () => {
    const res = await createExpense(undefined, form({ ...validFields, occurredAt: "2999-01-01" }));
    expect(res?.error).toBeTruthy();
    expect(tx.expenseCreate).not.toHaveBeenCalled();
  });

  it("weigert een onnumeriek bedrag", async () => {
    const res = await createExpense(undefined, form({ ...validFields, netAmount: "gratis" }));
    expect(res?.error).toBeTruthy();
    expect(tx.expenseCreate).not.toHaveBeenCalled();
  });

  it("weigert een niet-FREELANCER", async () => {
    roleState.role = "CLIENT";
    const res = await createExpense(undefined, form(validFields));
    expect(res?.error).toBeTruthy();
    expect(tx.expenseCreate).not.toHaveBeenCalled();
  });
});

describe("deleteExpense", () => {
  beforeEach(() => {
    roleState.role = "FREELANCER";
    expenseState.found = { id: "exp-1", userId: "user-1" };
    Object.values(tx).forEach((m) => m.mockClear());
  });

  it("verwijdert een eigen uitgave + grootboekregels + audit", async () => {
    const res = await deleteExpense(undefined, form({ id: "exp-1" }));
    expect(res).toEqual({ ok: true });
    expect(tx.entriesDeleteMany).toHaveBeenCalledWith({ where: { expenseId: "exp-1" } });
    expect(tx.expenseDelete).toHaveBeenCalledWith({ where: { id: "exp-1" } });
    const audit = tx.auditCreate.mock.calls[0]![0] as { data: { action: string } };
    expect(audit.data.action).toBe("EXPENSE_DELETED");
  });

  it("meldt een onbekende uitgave", async () => {
    expenseState.found = null;
    const res = await deleteExpense(undefined, form({ id: "nope" }));
    expect(res?.error).toBeTruthy();
    expect(tx.expenseDelete).not.toHaveBeenCalled();
  });

  it("weigert andermans uitgave met exact dezelfde melding als een onbekend id (anti-oracle)", async () => {
    // Andermans (bestaand) id en een onbekend id geven per constructie dezelfde fout-state:
    // geen throw-vs-return-verschil waarmee het bestaan van andermans uitgave af te tasten is (CWE-203).
    expenseState.found = { id: "exp-1", userId: "someone-else" };
    const notOwned = await deleteExpense(undefined, form({ id: "exp-1" }));

    expenseState.found = null;
    const unknown = await deleteExpense(undefined, form({ id: "exp-1" }));

    expect(notOwned).toEqual(unknown);
    expect(notOwned?.error).toBe("Uitgave niet gevonden.");
    expect(tx.expenseDelete).not.toHaveBeenCalled();
  });
});
