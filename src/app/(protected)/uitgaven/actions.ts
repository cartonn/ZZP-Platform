"use server";

import { revalidatePath } from "next/cache";
import { requireRole, assertOwnership, AuthorizationError } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { expenseSchema, planExpensePostings, parseEurosToCents } from "@/lib/expense";

export type ExpenseFormState = { ok?: true; error?: string } | undefined;

function parseDateOnly(raw: string): Date | null {
  // Verwacht ISO `jjjj-mm-dd` uit het datumveld; bouw een UTC-middernacht zodat het kwartaal/jaar
  // deterministisch is (geen tijdzone-drift op de grootboek-boeking).
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (!m) return null;
  const [, y, mo, d] = m;
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  if (Number.isNaN(date.getTime())) return null;
  // Rond-trip-check (bv. 2026-02-31 → ongeldig).
  if (
    date.getUTCFullYear() !== Number(y) ||
    date.getUTCMonth() !== Number(mo) - 1 ||
    date.getUTCDate() !== Number(d)
  ) {
    return null;
  }
  return date;
}

/**
 * Boekt een zakelijke uitgave van de ZZP'er. Keten: auth → rol FREELANCER → Zod → transactie
 * (Expense + gebalanceerde grootboekregels KOSTEN/BTW_VOORBELASTING/BETAALD + audit). Zo tellen
 * winst, IB-schatting en belastingreservering direct met de werkelijke kosten mee.
 */
export async function createExpense(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  let actor;
  try {
    actor = await requireRole("FREELANCER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const netCents = parseEurosToCents(String(formData.get("netAmount") ?? ""));
  const vatCents = parseEurosToCents(String(formData.get("vatAmount") ?? ""));
  if (netCents === null) return { error: "Vul een geldig bedrag in." };
  if (vatCents === null) return { error: "Vul een geldig btw-bedrag in." };

  const occurredAt = parseDateOnly(String(formData.get("occurredAt") ?? ""));
  if (!occurredAt) return { error: "Kies een geldige datum." };
  if (occurredAt.getTime() > Date.now()) return { error: "De datum ligt in de toekomst." };

  const parsed = expenseSchema.safeParse({
    description: String(formData.get("description") ?? ""),
    category: String(formData.get("category") ?? ""),
    netCents,
    vatCents,
    occurredAt,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Controleer de ingevoerde gegevens." };
  }
  const data = parsed.data;

  const postings = planExpensePostings({ netCents: data.netCents, vatCents: data.vatCents });

  await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        userId: actor.id,
        description: data.description,
        category: data.category,
        netCents: data.netCents,
        vatCents: data.vatCents,
        occurredAt: data.occurredAt,
      },
    });

    if (postings.length > 0) {
      await tx.administrationEntry.createMany({
        data: postings.map((p) => ({
          party: p.party,
          ownerUserId: actor.id,
          account: p.account,
          debitCents: p.debitCents,
          creditCents: p.creditCents,
          expenseId: expense.id,
          occurredAt: data.occurredAt,
        })),
      });
    }

    await tx.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "EXPENSE_CREATED",
        entityType: "Expense",
        entityId: expense.id,
        metadata: {
          category: data.category,
          netCents: data.netCents,
          vatCents: data.vatCents,
        },
      }),
    });
  });

  revalidatePath("/financien");
  return { ok: true };
}

/**
 * Verwijdert een uitgave van de ZZP'er (en, via de cascade-relatie op `expenseId`, de bijbehorende
 * grootboekregels). Keten: auth → rol → ownership → transactie (delete + audit).
 */
export async function deleteExpense(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  let actor;
  try {
    actor = await requireRole("FREELANCER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Geen uitgave opgegeven." };

  const expense = await prisma.expense.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!expense) return { error: "Uitgave niet gevonden." };
  assertOwnership(actor, expense.userId);

  await prisma.$transaction(async (tx) => {
    await tx.administrationEntry.deleteMany({ where: { expenseId: expense.id } });
    await tx.expense.delete({ where: { id: expense.id } });
    await tx.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "EXPENSE_DELETED",
        entityType: "Expense",
        entityId: expense.id,
      }),
    });
  });

  revalidatePath("/financien");
  return { ok: true };
}
