"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { canWithdrawApplication } from "@/lib/applications";
import { type ApplicationStatus } from "@/lib/enums";

/**
 * De ZZP'er trekt zijn eigen reactie in. Server-side keten (CLAUDE.md regel 2): auth → rol →
 * ownership → toegestane overgang → mutatie + audit + notificatie naar de opdrachtgever.
 *
 * Voorwaarden (server-side waarheid): de reactie is van deze ZZP'er, er is nog geen samenwerking uit
 * voortgekomen, en de status laat intrekken toe (NEW/VIEWED/SHORTLIST — niet na een beslissing van de
 * opdrachtgever of een eerdere intrekking). Gooit een Error bij elke schending; de bevestigingsdialoog
 * voorkomt onbedoeld intrekken.
 */
export async function withdrawApplication(appId: string): Promise<void> {
  const actor = await requireRole("FREELANCER");

  const app = await prisma.application.findUnique({
    where: { id: appId },
    include: {
      job: { select: { title: true, company: { select: { userId: true } } } },
      freelancer: { select: { userId: true } },
      collaboration: { select: { id: true } },
    },
  });
  // Geen ownership-leak: een onbekende én een niet-eigen reactie geven dezelfde melding.
  if (!app || app.freelancer.userId !== actor.id) throw new Error("Reactie niet gevonden.");

  if (app.collaboration) {
    throw new Error(
      "Er is al een samenwerking uit deze reactie voortgekomen; intrekken kan niet meer.",
    );
  }

  const from = app.status as ApplicationStatus;
  if (!canWithdrawApplication(from)) {
    throw new Error("Deze reactie kan niet (meer) worden ingetrokken.");
  }

  // Compound-guarded write (CLAUDE.md regel 2/3 — server-side waarheid, geen losse status-update). De
  // pre-lees en de canWithdraw-check leunen op een stale snapshot; in het TOCTOU-venster kan de
  // opdrachtgever de reactie parallel afwijzen/accepteren (kandidaten/actions.ts). Zonder guard landt de
  // blinde `update({ where: { id } })` dan alsnog op de al-getransitioneerde rij → een verboden overgang
  // (bv. REJECTED→WITHDRAWN, niet in APPLICATION_TRANSITIONS) + een valse "ingetrokken"-notificatie. De
  // `updateMany` op de exact geziene status telt 0 zodra de rij in het venster wisselde → we schrijven
  // niets en melden de wijziging.
  const applied = await prisma.$transaction(async (tx) => {
    const { count } = await tx.application.updateMany({
      where: { id: appId, status: from },
      data: { status: "WITHDRAWN" },
    });
    if (count === 0) return false;
    await tx.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "APPLICATION_WITHDRAWN",
        entityType: "Application",
        entityId: appId,
        metadata: { from },
      }),
    });
    await tx.notification.create({
      data: {
        userId: app.job.company.userId,
        type: "APPLICATION_WITHDRAWN",
        title: "Reactie ingetrokken",
        body: `Een kandidaat heeft zijn reactie op "${app.job.title}" ingetrokken.`,
        link: "/kandidaten",
      },
    });
    return true;
  });

  if (!applied) {
    throw new Error("Deze reactie is inmiddels gewijzigd en kan niet meer worden ingetrokken.");
  }

  revalidatePath("/reacties");
  revalidatePath("/kandidaten");
}
