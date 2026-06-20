"use server";

import { revalidatePath } from "next/cache";
import { AuthorizationError, requireRole } from "@/lib/authz";
import { createApplicationForJob } from "@/lib/applications-create";

export type ClaimState =
  | { ok?: boolean; error?: string; fieldErrors?: Record<string, string> }
  | undefined;

/**
 * Reageer (claim) direct vanuit de rooster-kalender op een open dienst. Hergebruikt exact dezelfde
 * applicatie-/matchketen als het reageer-formulier op de opdrachtdetail (`createApplication`), maar
 * blijft op `/rooster`: bij succes revalideren we de kalender zodat de dienst meteen als
 * "Gereageerd" verschijnt — geen navigatie weg van het overzicht.
 */
export async function claimShift(
  jobId: string,
  _prev: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  let actor;
  try {
    actor = await requireRole("FREELANCER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const result = await createApplicationForJob(actor, jobId, {
    motivation: formData.get("motivation"),
    proposedRate: formData.get("proposedRate") ?? "",
    availability: formData.get("availability") || undefined,
  });
  if (!result.ok) return { error: result.error, fieldErrors: result.fieldErrors };

  revalidatePath("/rooster");
  return { ok: true };
}
