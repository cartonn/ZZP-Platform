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
import { canRequestHandoff } from "@/lib/shift-handoff";
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

  // Maximaal één OPEN aanvraag per samenwerking (server-side afgedwongen).
  const existing = await prisma.shiftHandoff.findFirst({
    where: { collaborationId, status: "OPEN" },
    select: { id: true },
  });
  if (existing) return { error: "Er staat al een openstaande overname-aanvraag voor deze inzet." };

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
      return { error: "De voorgestelde overnemer valt buiten deze franchise." };
    candidateFreelancerId = candidate.id;
  }

  // actie + audit (atomair).
  const handoff = await prisma.shiftHandoff.create({
    data: {
      collaborationId,
      requestedByUserId: actor.id,
      reason: parsed.data.reason,
      candidateFreelancerId,
    },
  });

  // De franchiser (tenant-eigenaar) en/of de admins beoordelen de aanvraag. Tenant-isolatie: bij een
  // tenant-inzet wordt de franchiser geïnformeerd; admins zien alles platformbreed.
  const recipients = new Map<string, true>();
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { id: true },
    take: 50,
  });
  for (const a of admins) recipients.set(a.id, true);
  if (collaboration.job.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: collaboration.job.tenantId },
      select: { ownerUserId: true, owner: { select: { status: true } } },
    });
    if (tenant?.owner.status === "ACTIVE") recipients.set(tenant.ownerUserId, true);
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
          link: `/admin/shift-overnames`,
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
  return { ok: true };
}
