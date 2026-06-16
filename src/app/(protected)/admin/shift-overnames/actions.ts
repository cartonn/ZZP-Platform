"use server";

// Governance op shift-overname-aanvragen (productbesluit 16-6-2026). De franchiser (tenant) of admin
// keurt een OPEN overname-aanvraag goed of af. Goedkeuring legt ALLEEN de beslissing vast en informeert
// de ZZP'er — ze verplaatst geen contract/modelovereenkomst en herschikt de samenwerking NIET (Wet-DBA,
// veilige scope). De feitelijke herplaatsing blijft via de bestaande annuleer/vervang-flow.
//
// Mutatieketen (CLAUDE.md regel 2): auth → rol (ADMIN of FRANCHISER) → ownership (tenant-isolatie:
// de aanvraag valt binnen de tenant van de actor) → Zod → actie (statusovergang via de map) → audit.

import { revalidatePath } from "next/cache";
import { requireRole, type Actor } from "@/lib/authz";
import { assertSameTenant } from "@/lib/tenancy";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { assertHandoffTransition } from "@/lib/shift-handoff";
import { shiftHandoffRejectSchema } from "@/lib/validation";

/** Laadt een OPEN handoff + dwingt tenant-isolatie af. Werpt bij ontbreken/cross-tenant/al-beslist. */
async function loadDecidableHandoff(handoffId: string, actor: Actor) {
  const handoff = await prisma.shiftHandoff.findUnique({
    where: { id: handoffId },
    select: {
      id: true,
      status: true,
      requestedByUserId: true,
      collaboration: {
        select: { id: true, job: { select: { title: true, tenantId: true } } },
      },
    },
  });
  if (!handoff) throw new Error("Overname-aanvraag niet gevonden.");
  // Tenant-isolatie: een franchiser beslist alleen binnen de eigen tenant; ADMIN mag alles.
  assertSameTenant(actor, handoff.collaboration.job.tenantId);
  if (handoff.status !== "OPEN") throw new Error("Deze aanvraag is al beoordeeld.");
  return handoff;
}

export async function approveShiftHandoff(handoffId: string): Promise<void> {
  const actor = await requireRole("ADMIN", "FRANCHISER");
  const handoff = await loadDecidableHandoff(handoffId, actor);

  // Statusovergang via de expliciete map (OPEN → APPROVED).
  assertHandoffTransition("OPEN", "APPROVED");

  await prisma.$transaction([
    prisma.shiftHandoff.update({
      where: { id: handoffId },
      data: { status: "APPROVED", decidedByUserId: actor.id, decidedAt: new Date() },
    }),
    // De ZZP'er hoort het oordeel; de tekst maakt expliciet dat herplaatsing een aparte stap blijft.
    prisma.notification.create({
      data: {
        userId: handoff.requestedByUserId,
        type: "SHIFT_HANDOFF_APPROVED",
        title: "Overname goedgekeurd",
        body:
          `De overname van "${handoff.collaboration.job.title}" is goedgekeurd. ` +
          `Een beheerder regelt de herplaatsing via de bestaande annuleer-/vervang-stap; ` +
          `de overnemer krijgt een eigen contract.`,
        link: `/samenwerkingen/${handoff.collaboration.id}`,
      },
    }),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "SHIFT_HANDOFF_APPROVED",
        entityType: "ShiftHandoff",
        entityId: handoffId,
        metadata: { collaborationId: handoff.collaboration.id },
      }),
    }),
  ]);

  revalidatePath("/admin/shift-overnames");
  revalidatePath(`/samenwerkingen/${handoff.collaboration.id}`);
}

export type ShiftHandoffRejectState = { error?: string; ok?: boolean } | undefined;

export async function rejectShiftHandoff(
  handoffId: string,
  _prev: ShiftHandoffRejectState,
  formData: FormData,
): Promise<ShiftHandoffRejectState> {
  const actor = await requireRole("ADMIN", "FRANCHISER");

  const parsed = shiftHandoffRejectSchema.safeParse({ note: formData.get("note") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Controleer de invoer." };

  let handoff;
  try {
    handoff = await loadDecidableHandoff(handoffId, actor);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Aanvraag kon niet worden beoordeeld." };
  }

  // Statusovergang via de expliciete map (OPEN → REJECTED).
  assertHandoffTransition("OPEN", "REJECTED");

  await prisma.$transaction([
    prisma.shiftHandoff.update({
      where: { id: handoffId },
      data: {
        status: "REJECTED",
        decidedByUserId: actor.id,
        decidedAt: new Date(),
        decisionNote: parsed.data.note,
      },
    }),
    prisma.notification.create({
      data: {
        userId: handoff.requestedByUserId,
        type: "SHIFT_HANDOFF_REJECTED",
        title: "Overname afgewezen",
        body:
          `De overname van "${handoff.collaboration.job.title}" is afgewezen. ` +
          `Reden: ${parsed.data.note}`,
        link: `/samenwerkingen/${handoff.collaboration.id}`,
      },
    }),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "SHIFT_HANDOFF_REJECTED",
        entityType: "ShiftHandoff",
        entityId: handoffId,
        metadata: { collaborationId: handoff.collaboration.id },
      }),
    }),
  ]);

  revalidatePath("/admin/shift-overnames");
  revalidatePath(`/samenwerkingen/${handoff.collaboration.id}`);
  return { ok: true };
}
