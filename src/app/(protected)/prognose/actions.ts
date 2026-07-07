"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, assertOwnership, AuthorizationError } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { MONTHLY_INCOME_GOAL_MAX_EUROS } from "@/lib/income-goal";

export type IncomeGoalState = { ok?: true; error?: string } | undefined;

// Heel euro's; leeg veld = doel wissen. Boven het plafond (int4-veilig) of negatief → afgewezen.
const amountSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[.\s]/g, "")) // duizendtal-punten/spaties negeren
  .pipe(
    z
      .string()
      .regex(/^\d*$/, "Vul een heel bedrag in euro's in.")
      .transform((v) => (v === "" ? null : Number.parseInt(v, 10))),
  )
  .refine((n) => n === null || (n >= 0 && n <= MONTHLY_INCOME_GOAL_MAX_EUROS), {
    message: `Kies een bedrag tussen € 0 en € ${MONTHLY_INCOME_GOAL_MAX_EUROS.toLocaleString("nl-NL")}.`,
  });

/**
 * Stelt het maandelijkse inkomstendoel van de ZZP'er in (of wist het bij een leeg bedrag).
 * Keten: auth → rol FREELANCER → ownership (eigen profiel) → Zod → update → audit.
 */
export async function setMonthlyIncomeGoal(
  _prev: IncomeGoalState,
  formData: FormData,
): Promise<IncomeGoalState> {
  let actor;
  try {
    actor = await requireRole("FREELANCER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const parsed = amountSchema.safeParse(String(formData.get("amount") ?? ""));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Controleer het ingevoerde bedrag." };
  }
  const euros = parsed.data;
  const goalCents = euros === null ? null : euros * 100;

  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId: actor.id },
    select: { id: true, userId: true },
  });
  if (!profile) return { error: "Profiel niet gevonden." };
  assertOwnership(actor, profile.userId);

  await prisma.freelancerProfile.update({
    where: { id: profile.id },
    data: { monthlyIncomeGoalCents: goalCents },
  });

  await audit({
    actorId: actor.id,
    action: goalCents === null ? "INCOME_GOAL_CLEARED" : "INCOME_GOAL_SET",
    entityType: "FreelancerProfile",
    entityId: profile.id,
    metadata: goalCents === null ? {} : { goalCents },
  });

  revalidatePath("/prognose");
  return { ok: true };
}
