"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { approvePerformance } from "@/lib/cascade/commands";
import { toSafeActionError } from "@/lib/safe-action-error";

export interface BulkApproveResult {
  approved: number;
  failed: number;
  error?: string;
}

/**
 * Keurt in één keer alle nog-ingediende (SUBMITTED) prestaties van één samenwerking goed. De
 * eigenaarscontrole zit dubbel vast: de prestatie-query is gescoopt op `collaboration.company.userId`
 * (alleen samenwerkingen van deze opdrachtgever), en `approvePerformance` her-controleert per prestatie
 * de rol/ownership + de status-overgang + audit + dedupe. Elke goedkeuring loopt door dezelfde cascade
 * als de losse "Keuren →"-actie; een prestatie die intussen van status wisselde of een dispuut-freeze
 * raakt, faalt alleen voor zichzelf (per-item try/catch) en breekt de rest niet af.
 */
export async function approveSubmittedPerformancesAction(
  collaborationId: string,
): Promise<BulkApproveResult> {
  const actor = await requireActor();
  if (actor.role !== "CLIENT" && actor.role !== "ADMIN") {
    return { approved: 0, failed: 0, error: "Alleen de opdrachtgever kan urenstaten goedkeuren." };
  }

  const submitted = await prisma.performance.findMany({
    where: {
      collaborationId,
      status: "SUBMITTED",
      collaboration: { company: { userId: actor.id } },
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    // Eén samenwerking heeft in de praktijk een kleine set ingediende urenstaten; ruime cap tegen
    // onbegrensde groei. Restanten boven de cap blijven SUBMITTED en zijn in een tweede klik te keuren.
    take: 500,
  });

  if (submitted.length === 0) {
    return { approved: 0, failed: 0 };
  }

  let approved = 0;
  let failed = 0;
  let firstError: string | undefined;
  for (const p of submitted) {
    try {
      await approvePerformance(actor, p.id);
      approved += 1;
    } catch (e) {
      failed += 1;
      if (!firstError) {
        firstError = toSafeActionError(e, "Eén of meer urenstaten konden niet worden goedgekeurd.");
      }
    }
  }

  revalidatePath("/prestaties");
  revalidatePath(`/samenwerkingen/${collaborationId}`);
  revalidatePath("/samenwerkingen");
  revalidatePath("/facturen");
  revalidatePath("/acties");
  revalidatePath("/dashboard");

  return { approved, failed, error: failed > 0 ? firstError : undefined };
}
