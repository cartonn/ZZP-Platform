"use server";

import { revalidatePath } from "next/cache";
import { AuthorizationError, requireActor } from "@/lib/authz";
import { audit, auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { userHasEntitlement } from "@/lib/entitlement-guard";
import { indirectHoursEntrySchema } from "@/lib/tax/indirect-hours";

export type IndirectHoursState = { error?: string } | undefined;

/**
 * Voegt een indirecte-uren-regel toe voor de ingelogde ZZP'er.
 * Controleert: auth → rol → entitlement → Zod-validatie → schrijven → audit.
 */
export async function addIndirectHours(
  _prev: IndirectHoursState,
  formData: FormData,
): Promise<IndirectHoursState> {
  let actor;
  try {
    actor = await requireActor();
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  if (actor.role !== "FREELANCER") {
    return { error: "Alleen voor ZZP'ers." };
  }

  if (!(await userHasEntitlement(actor.id, "IB_VOORBEREIDING"))) {
    return { error: "Indirecte uren bijhouden hoort bij een betaald plan." };
  }

  const parsed = indirectHoursEntrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Ongeldige invoer. Controleer de velden.";
    return { error: message };
  }

  const { workedOn, hours, category, note } = parsed.data;
  // Lege string wordt als null opgeslagen (geen notitie).
  const noteValue = note === "" || note === undefined ? null : note;

  const created = await prisma.indirectHoursEntry.create({
    data: {
      userId: actor.id,
      workedOn,
      hours,
      category,
      note: noteValue,
    },
  });

  await audit({
    actorId: actor.id,
    action: "INDIRECT_HOURS_LOGGED",
    entityType: "IndirectHoursEntry",
    entityId: created.id,
    metadata: {
      hours,
      category,
      workedOn: workedOn.toISOString(),
    },
  });

  revalidatePath("/ontzorgd/uren");
  revalidatePath("/ontzorgd");
  return undefined;
}

/**
 * Verwijdert een indirecte-uren-regel van de ingelogde ZZP'er.
 * Controleert ownership — alleen de eigenaar mag zijn eigen regels verwijderen.
 */
export async function deleteIndirectHours(id: string): Promise<void> {
  const actor = await requireActor();
  // Volledige keten zoals addIndirectHours: auth → rol → ownership → actie → audit. De rol-check
  // stond hier eerder niet, waardoor de keten gebroken was (een ADMIN passeert de ownership-check via
  // owns(); indirecte uren zijn puur ZZP'er-werk).
  if (actor.role !== "FREELANCER") {
    throw new AuthorizationError("Alleen voor ZZP'ers.");
  }

  const row = await prisma.indirectHoursEntry.findUnique({ where: { id } });
  if (!row || row.userId !== actor.id) {
    throw new Error("Regel niet gevonden.");
  }

  // Delete + audit atomair: anders kan de audit wegvallen als de write na de delete faalt.
  await prisma.$transaction([
    prisma.indirectHoursEntry.delete({ where: { id } }),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "INDIRECT_HOURS_DELETED",
        entityType: "IndirectHoursEntry",
        entityId: id,
        metadata: {
          hours: row.hours,
          category: row.category,
          workedOn: row.workedOn.toISOString(),
        },
      }),
    }),
  ]);

  revalidatePath("/ontzorgd/uren");
  revalidatePath("/ontzorgd");
}
