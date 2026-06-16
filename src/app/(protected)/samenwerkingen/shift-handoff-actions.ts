"use server";

// Shift-overname aanvragen (productbesluit 16-6-2026, concurrentie-backlog punt 3). De huidige ZZP'er
// van een ACTIEVE samenwerking biedt de inzet ter overname aan ("kan deze inzet niet voortzetten"),
// eventueel met een voorgestelde overnemer. De franchiser (tenant) en/of admin krijgen de aanvraag ter
// beoordeling op /admin/shift-overnames; bij goedkeuring wordt alléén de beslissing vastgelegd —
// nooit automatisch een contract verplaatst of de samenwerking herschikt (Wet-DBA, veilige scope).
//
// Mutatieketen (CLAUDE.md regel 2): auth → rol (FREELANCER) → ownership (is de ZZP'er van deze
// samenwerking) → Zod → actie → audit.

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { assertHandoffTransition, canRequestHandoff } from "@/lib/shift-handoff";
import { type ShiftHandoffStatus } from "@/lib/enums";
import { shiftHandoffRequestSchema } from "@/lib/validation";

export type ShiftHandoffRequestState = { error?: string; ok?: boolean } | undefined;

export async function requestShiftHandoff(
  collaborationId: string,
  _prev: ShiftHandoffRequestState,
  formData: FormData,
): Promise<ShiftHandoffRequestState> {
  // auth + rol: alleen een ZZP'er kan een overname aanvragen.
  const actor = await requireRole("FREELANCER");

  // Zod-validatie.
  const parsed = shiftHandoffRequestSchema.safeParse({
    reason: formData.get("reason") ?? "",
    candidateFreelancerId: formData.get("candidateFreelancerId") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Controleer de invoer." };

  const collaboration = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    select: {
      id: true,
      status: true,
      disputedAt: true,
      freelancer: { select: { userId: true } },
      job: { select: { title: true, tenantId: true } },
    },
  });
  if (!collaboration) return { error: "Samenwerking niet gevonden." };

  // ownership: alleen de huidige ZZP'er van deze samenwerking, op een ACTIEVE inzet (pure regel).
  const isCurrentFreelancer = collaboration.freelancer.userId === actor.id;
  if (
    !canRequestHandoff({
      collaborationStatus: collaboration.status,
      isCurrentFreelancer,
    })
  ) {
    return {
      error: "Alleen de ZZP'er van een actieve samenwerking kan deze inzet ter overname aanbieden.",
    };
  }

  // Bevroren bij dispuut: de UI verbergt deze actie tijdens een dispuut, maar een directe POST
  // mag die rem niet omzeilen (server is de waarheid).
  if (collaboration.disputedAt) {
    return { error: "Niet mogelijk tijdens een lopend dispuut." };
  }

  // Een voorgestelde overnemer moet binnen dezelfde tenant vallen (tenant-isolatie) en niet de
  // huidige ZZP'er zelf zijn. Bij een platform-inzet (tenantId null) moet de kandidaat ook tenantloos
  // zijn. Een ongeldige kandidaat wordt geweigerd i.p.v. stil genegeerd.
  let candidateFreelancerId: string | undefined;
  if (parsed.data.candidateFreelancerId) {
    const candidate = await prisma.freelancerProfile.findUnique({
      where: { id: parsed.data.candidateFreelancerId },
      select: { id: true, userId: true, tenantId: true },
    });
    if (!candidate) return { error: "Voorgestelde overnemer niet gevonden." };
    if (candidate.userId === actor.id)
      return { error: "Je kunt jezelf niet als overnemer voorstellen." };
    if ((candidate.tenantId ?? null) !== (collaboration.job.tenantId ?? null))
      return { error: "De voorgestelde overnemer valt buiten deze bemiddeling." };
    candidateFreelancerId = candidate.id;
  }

  // actie: maximaal één OPEN aanvraag per samenwerking. De check + create worden in één interactieve
  // transactie geserialiseerd, zodat twee gelijktijdige aanvragen er niet beide doorheen glippen.
  const handoff = await prisma.$transaction(async (tx) => {
    const existing = await tx.shiftHandoff.findFirst({
      where: { collaborationId, status: "OPEN" },
      select: { id: true },
    });
    if (existing) return null;
    return tx.shiftHandoff.create({
      data: {
        collaborationId,
        requestedByUserId: actor.id,
        reason: parsed.data.reason,
        candidateFreelancerId,
      },
    });
  });
  if (!handoff) return { error: "Er staat al een openstaande overname-aanvraag voor deze inzet." };

  // De franchiser (tenant-eigenaar) en/of de admins beoordelen de aanvraag. Tenant-isolatie: bij een
  // tenant-inzet wordt de franchiser geïnformeerd; admins zien alles platformbreed.
  const recipients = new Map<string, true>();
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { id: true },
    take: 50,
  });
  for (const a of admins) recipients.set(a.id, true);
  // De franchise-eigenaar beoordeelt op zijn eigen route; admins op de admin-route. Onthoud
  // welke recipient de tenant-eigenaar is, zodat zijn notificatie naar /franchise/... linkt
  // (de admin-route zou hem via de middleware terug naar het dashboard sturen).
  let tenantOwnerUserId: string | null = null;
  if (collaboration.job.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: collaboration.job.tenantId },
      select: { ownerUserId: true, owner: { select: { status: true } } },
    });
    if (tenant?.owner.status === "ACTIVE") {
      recipients.set(tenant.ownerUserId, true);
      tenantOwnerUserId = tenant.ownerUserId;
    }
  }

  await prisma.$transaction([
    ...[...recipients.keys()].map((userId) =>
      prisma.notification.create({
        data: {
          userId,
          type: "SHIFT_HANDOFF_REQUESTED",
          title: "Overname-aanvraag voor een inzet",
          body:
            `Een ZZP'er kan de inzet "${collaboration.job.title}" niet voortzetten en biedt deze ` +
            `ter overname aan. Beoordeel de aanvraag.`,
          link:
            userId === tenantOwnerUserId ? `/franchise/shift-overnames` : `/admin/shift-overnames`,
        },
      }),
    ),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "SHIFT_HANDOFF_REQUESTED",
        entityType: "ShiftHandoff",
        entityId: handoff.id,
        metadata: {
          collaborationId,
          candidateFreelancerId: candidateFreelancerId ?? null,
        },
      }),
    }),
  ]);

  revalidatePath(`/samenwerkingen/${collaborationId}`);
  revalidatePath("/admin/shift-overnames");
  revalidatePath("/franchise/shift-overnames");
  return { ok: true };
}

export type ShiftHandoffCancelState = { error?: string; ok?: boolean } | undefined;

/**
 * De aanvragende ZZP'er trekt een nog-OPEN overname-aanvraag in (OPEN → CANCELLED).
 *
 * Mutatieketen: auth → rol (FREELANCER) → ownership (de actor is de aanvrager van een OPEN
 * aanvraag) → transitie via de map → atomaire status-guard → audit. Geen notificatie nodig:
 * de beoordelaars hoeven niet apart te worden geïnformeerd dat een aanvraag is teruggetrokken
 * (ze zien ze simpelweg niet meer in hun queue).
 */
export async function cancelShiftHandoff(
  handoffId: string,
  _prev: ShiftHandoffCancelState,
): Promise<ShiftHandoffCancelState> {
  const actor = await requireRole("FREELANCER");

  const handoff = await prisma.shiftHandoff.findUnique({
    where: { id: handoffId },
    select: { id: true, status: true, requestedByUserId: true, collaborationId: true },
  });
  if (!handoff) return { error: "Overname-aanvraag niet gevonden." };
  // ownership: alleen de ZZP'er die de aanvraag opende mag ze intrekken.
  if (handoff.requestedByUserId !== actor.id) {
    return { error: "Alleen de aanvrager kan deze overname-aanvraag intrekken." };
  }

  // Transitie via de expliciete map (OPEN → CANCELLED), op basis van de gefetchte status.
  try {
    assertHandoffTransition(handoff.status as ShiftHandoffStatus, "CANCELLED");
  } catch {
    return { error: "Deze aanvraag is al beoordeeld of ingetrokken." };
  }

  // Atomaire status-guard: alleen een nog-OPEN aanvraag wordt ingetrokken (geen dubbele intrekking).
  const updated = await prisma.shiftHandoff.updateMany({
    where: { id: handoffId, status: "OPEN" },
    data: { status: "CANCELLED" },
  });
  if (updated.count !== 1) return { error: "Deze aanvraag is al beoordeeld of ingetrokken." };

  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "SHIFT_HANDOFF_CANCELLED",
      entityType: "ShiftHandoff",
      entityId: handoffId,
      metadata: { collaborationId: handoff.collaborationId },
    }),
  });

  revalidatePath(`/samenwerkingen/${handoff.collaborationId}`);
  revalidatePath("/admin/shift-overnames");
  revalidatePath("/franchise/shift-overnames");
  return { ok: true };
}
