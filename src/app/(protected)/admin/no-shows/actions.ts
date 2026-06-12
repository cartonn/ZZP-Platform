"use server";

// Admin-beoordeling van no-show-meldingen (productbesluit 12-6-2026): gegrond (telt niet mee)
// of ongegrond (telt mee richting NO_SHOW_LIMIT). De ZZP'er krijgt het oordeel als notificatie;
// bij het bereiken van de grens verschijnt de uitschrijf-taak in de admin-wachtrij —
// uitschrijven blijft een handmatige adminbeslissing via setUserStatus (nooit automatisch).

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { NO_SHOW_LIMIT, noShowStanding } from "@/lib/no-show";
import { noShowVerdictSchema } from "@/lib/enums";

export async function judgeNoShowReport(reportId: string, verdictRaw: string): Promise<void> {
  const actor = await requireRole("ADMIN");
  const verdict = noShowVerdictSchema.parse(verdictRaw);
  if (verdict === "PENDING") throw new Error("Kies gegrond of ongegrond.");

  const report = await prisma.noShowReport.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      verdict: true,
      reason: true,
      freelancerProfileId: true,
      freelancer: { select: { userId: true } },
      collaboration: { select: { id: true, job: { select: { title: true } } } },
    },
  });
  if (!report) throw new Error("Melding niet gevonden.");
  if (report.verdict !== "PENDING") throw new Error("Deze melding is al beoordeeld.");

  await prisma.$transaction([
    prisma.noShowReport.update({
      where: { id: reportId },
      data: { verdict, verdictById: actor.id, verdictAt: new Date() },
    }),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "NO_SHOW_JUDGED",
        entityType: "NoShowReport",
        entityId: reportId,
        metadata: { verdict, freelancerProfileId: report.freelancerProfileId },
      }),
    }),
  ]);

  // Oordeel + stand richting de grens naar de ZZP'er — server-side geteld ná de update.
  const unjustified = await prisma.noShowReport.count({
    where: { freelancerProfileId: report.freelancerProfileId, verdict: "UNJUSTIFIED" },
  });
  const standing = noShowStanding(unjustified);
  const jobTitle = report.collaboration.job.title;
  await prisma.notification.create({
    data: {
      userId: report.freelancer.userId,
      type: "NO_SHOW_JUDGED",
      title: verdict === "JUSTIFIED" ? "No-show gegrond verklaard" : "No-show ongegrond verklaard",
      body:
        verdict === "JUSTIFIED"
          ? `De no-show-melding voor "${jobTitle}" is gegrond verklaard en telt niet mee.`
          : standing.atLimit
            ? `De no-show-melding voor "${jobTitle}" is ongegrond verklaard. Je staat op ` +
              `${standing.unjustified} ongegronde no-shows — een beheerder beoordeelt nu je ` +
              `uitschrijving van het platform.`
            : `De no-show-melding voor "${jobTitle}" is ongegrond verklaard ` +
              `(${standing.unjustified} van ${NO_SHOW_LIMIT}). Bij ${NO_SHOW_LIMIT} ongegronde ` +
              `no-shows volgt uitschrijving van het platform.`,
      link: `/samenwerkingen/${report.collaboration.id}`,
    },
  });

  revalidatePath("/admin/no-shows");
  revalidatePath("/acties");
  revalidatePath("/dashboard");
}
