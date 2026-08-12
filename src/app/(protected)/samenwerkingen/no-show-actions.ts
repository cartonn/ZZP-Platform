"use server";

// No-show-registratie (productbesluit 12-6-2026, punt 6 deel 2). De melder — de opdrachtgever
// van de samenwerking of de franchiser van de dienst — registreert een no-show met de reden
// zoals de ZZP'er die opgaf. De ZZP'er wordt direct geïnformeerd (notificatie mét reden);
// de admin beoordeelt daarna gegrond/ongegrond op /admin/no-shows.

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { noShowOccurredOnDayRange, noShowReportedNotificationBody } from "@/lib/no-show";
import { noShowReportRateLimiter } from "@/lib/rate-limit";
import { noShowReportSchema } from "@/lib/validation";

export type NoShowReportState = { error?: string; ok?: boolean } | undefined;

// Serializable maakt de same-day-dedup ook op PostgreSQL (productie) waterdicht: onder de default
// READ COMMITTED lezen twee gelijktijdige meldingen beide "geen bestaande rij" en schrijven beide.
// Onder Serializable (Postgres SSI) vormt de check + insert een read-write-conflict → één transactie
// faalt met P2034 en wordt her-geprobeerd; de her-check ziet de nu-gecommitte rij en weigert correct.
// SQLite kent alléén Serializable (DB-brede lock) → daar gedrags-neutraal. Spiegelt
// APPLICATION_TX_OPTIONS (applications-create.ts) / JOB_PUBLISH_TX_OPTIONS (opdrachten/actions.ts).
const NO_SHOW_TX_OPTIONS = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  timeout: 30_000,
  maxWait: 10_000,
} as const;
const NO_SHOW_MAX_ATTEMPTS = 4;

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
  // Anti-oracle (CWE-203): een actor die geen melder-partij is (incl. de ZZP'er zelf en elke buiten-
  // staander) mag "bestaat niet" niet kunnen onderscheiden van "bestaat, maar jij mag niet melden".
  // Identiek aan het onbekend-id-antwoord — sluit de directe-aanroep-aftast-poort op een gegokt id.
  if (!isClient && !isTenantFranchiser) return { error: "Samenwerking niet gevonden." };

  // Alleen op een lopende of (recent) geannuleerde inzet — een no-show leidt vaak tot annulering.
  if (collaboration.status !== "ACTIVE" && collaboration.status !== "CANCELLED")
    return { error: "No-show melden kan alleen op een actieve of geannuleerde samenwerking." };

  // Same-day-dedup: dezelfde gemiste dienst hoort maar één keer geregistreerd te worden. Zonder deze
  // check stapelt een (per ongeluk dubbel ingediend of gescript) melding meerdere permanente rijen +
  // notificaties voor dezelfde dag. Dagvenster i.p.v. exacte gelijkheid, zodat ook een geknutselde
  // POST met tijdcomponent binnen dezelfde UTC-dag wordt afgevangen (de melding zelf is dag-granulair).
  const { gte, lt } = noShowOccurredOnDayRange(parsed.data.occurredOn);
  // Dedup-check + create + notificatie + audit in ÉÉN Serializable transactie met begrensde
  // P2034-retry: (a) de race is ook op Postgres echt dicht (zie NO_SHOW_TX_OPTIONS), en (b) een
  // fout ná de create laat nooit een ongeaudite/ongenotificeerde report achter — alles of niets.
  let report: { id: string } | null = null;
  for (let attempt = 0; attempt < NO_SHOW_MAX_ATTEMPTS; attempt++) {
    try {
      report = await prisma.$transaction(async (tx) => {
        const existing = await tx.noShowReport.findFirst({
          where: { collaborationId, occurredOn: { gte, lt } },
          select: { id: true },
        });
        if (existing) return null;
        const created = await tx.noShowReport.create({
          data: {
            collaborationId,
            freelancerProfileId: collaboration.freelancer.id,
            reportedById: actor.id,
            reason: parsed.data.reason,
            occurredOn: parsed.data.occurredOn,
          },
        });
        // De ZZP'er hoort het direct, mét de geregistreerde reden en wat er nu gebeurt.
        await tx.notification.create({
          data: {
            userId: collaboration.freelancer.userId,
            type: "NO_SHOW_REPORTED",
            title: "No-show geregistreerd",
            body: noShowReportedNotificationBody({
              jobTitle: collaboration.job.title,
              occurredOn: parsed.data.occurredOn,
              reason: parsed.data.reason,
            }),
            link: `/samenwerkingen/${collaborationId}`,
          },
        });
        await tx.auditLog.create({
          data: auditData({
            actorId: actor.id,
            action: "NO_SHOW_REPORTED",
            entityType: "NoShowReport",
            entityId: created.id,
            metadata: {
              collaborationId,
              freelancerProfileId: collaboration.freelancer.id,
              occurredOn: parsed.data.occurredOn.toISOString(),
            },
          }),
        });
        return created;
      }, NO_SHOW_TX_OPTIONS);
      break;
    } catch (e) {
      // Serialisatie-conflict (Postgres SSI): een gelijktijdige melding raakte hetzelfde dagvenster.
      // Her-probeer; de nieuwe check ziet de gecommitte rij en weigert dan correct als duplicaat.
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2034" &&
        attempt < NO_SHOW_MAX_ATTEMPTS - 1
      )
        continue;
      throw e;
    }
  }
  if (!report)
    return { error: "Voor deze dag is al een no-show geregistreerd voor deze samenwerking." };

  revalidatePath(`/samenwerkingen/${collaborationId}`);
  revalidatePath("/admin/no-shows");
  return { ok: true };
}
