"use server";

// No-show-registratie (productbesluit 12-6-2026, punt 6 deel 2). De melder — de opdrachtgever
// van de samenwerking of de franchiser van de dienst — registreert een no-show met de reden
// zoals de ZZP'er die opgaf. De ZZP'er wordt direct geïnformeerd (notificatie mét reden);
// de admin beoordeelt daarna gegrond/ongegrond op /admin/no-shows.

import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { NO_SHOW_LIMIT, noShowOccurredOnDayRange } from "@/lib/no-show";
import { noShowReportRateLimiter } from "@/lib/rate-limit";
import { noShowReportSchema } from "@/lib/validation";
import { formatDateShortNl } from "@/lib/format-date";

export type NoShowReportState = { error?: string; ok?: boolean } | undefined;

export async function reportNoShow(
  collaborationId: string,
  _prev: NoShowReportState,
  formData: FormData,
): Promise<NoShowReportState> {
  const actor = await requireActor();

  // Volume-rem (parity met invite/message/application): een no-show-melding schrijft een permanente
  // NoShowReport + notificatie + auditregel en voedt de admin-uitschrijfwachtrij; zonder bovengrens
  // kan een gecompromitteerde/kwaadwillende melder herhaalde POST's scripten (notificatie-/audit-DoS,
  // harassment). De ownership-/statuspoort hieronder blijft de bron van toegang; dit is een extra rem.
  if (!(await noShowReportRateLimiter.check(actor.id)).allowed)
    return {
      error:
        "Je hebt het maximum aantal no-show-meldingen per uur bereikt. Probeer het later opnieuw.",
    };

  const parsed = noShowReportSchema.safeParse({
    reason: formData.get("reason") ?? "",
    occurredOn: formData.get("occurredOn") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Controleer de invoer." };

  const collaboration = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    select: {
      id: true,
      status: true,
      company: { select: { userId: true } },
      freelancer: { select: { id: true, userId: true } },
      job: { select: { title: true, tenantId: true } },
    },
  });
  if (!collaboration) return { error: "Samenwerking niet gevonden." };

  // Melden mag door de opdrachtgever van de samenwerking, of door de franchiser van de
  // dienst (tenant). De ZZP'er meldt zichzelf niet; de admin oordeelt, meldt niet.
  const isClient = actor.id === collaboration.company.userId;
  const isTenantFranchiser =
    actor.role === "FRANCHISER" &&
    actor.tenantId != null &&
    actor.tenantId === collaboration.job.tenantId;
  if (!isClient && !isTenantFranchiser)
    return { error: "Alleen de opdrachtgever of de bemiddelaar kan een no-show melden." };

  // Alleen op een lopende of (recent) geannuleerde inzet — een no-show leidt vaak tot annulering.
  if (collaboration.status !== "ACTIVE" && collaboration.status !== "CANCELLED")
    return { error: "No-show melden kan alleen op een actieve of geannuleerde samenwerking." };

  // Same-day-dedup: dezelfde gemiste dienst hoort maar één keer geregistreerd te worden. Zonder deze
  // check stapelt een (per ongeluk dubbel ingediend of gescript) melding meerdere permanente rijen +
  // notificaties voor dezelfde dag. Dagvenster i.p.v. exacte gelijkheid, zodat ook een geknutselde
  // POST met tijdcomponent binnen dezelfde UTC-dag wordt afgevangen (de melding zelf is dag-granulair).
  const { gte, lt } = noShowOccurredOnDayRange(parsed.data.occurredOn);
  const existing = await prisma.noShowReport.findFirst({
    where: { collaborationId, occurredOn: { gte, lt } },
    select: { id: true },
  });
  if (existing)
    return { error: "Voor deze dag is al een no-show geregistreerd voor deze samenwerking." };

  const report = await prisma.noShowReport.create({
    data: {
      collaborationId,
      freelancerProfileId: collaboration.freelancer.id,
      reportedById: actor.id,
      reason: parsed.data.reason,
      occurredOn: parsed.data.occurredOn,
    },
  });

  await prisma.$transaction([
    // De ZZP'er hoort het direct, mét de geregistreerde reden en wat er nu gebeurt.
    prisma.notification.create({
      data: {
        userId: collaboration.freelancer.userId,
        type: "NO_SHOW_REPORTED",
        title: "No-show geregistreerd",
        body:
          `Voor "${collaboration.job.title}" is een no-show geregistreerd ` +
          `(${formatDateShortNl(parsed.data.occurredOn)}). Reden: ${parsed.data.reason} — ` +
          `een beheerder beoordeelt of de reden gegrond is. Bij ${NO_SHOW_LIMIT} ongegronde ` +
          `no-shows volgt uitschrijving van het platform.`,
        link: `/samenwerkingen/${collaborationId}`,
      },
    }),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "NO_SHOW_REPORTED",
        entityType: "NoShowReport",
        entityId: report.id,
        metadata: {
          collaborationId,
          freelancerProfileId: collaboration.freelancer.id,
          occurredOn: parsed.data.occurredOn.toISOString(),
        },
      }),
    }),
  ]);

  revalidatePath(`/samenwerkingen/${collaborationId}`);
  revalidatePath("/admin/no-shows");
  return { ok: true };
}
