import "server-only";

import { Prisma } from "@prisma/client";
import { applicationRateLimiter } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { canApply } from "@/lib/applications";
import { applicationLimitMessage, applicationPeriodEnd } from "@/lib/application-quota";
import { applicationQuotaWhere, loadApplicationQuota } from "@/lib/data/application-quota";
import { scoreJobForFreelancer } from "@/lib/matching";
import { estimateTravelMinutesWithRouting } from "@/lib/services/routing";
import { canViewJob } from "@/lib/tenancy";
import { applicationSchema } from "@/lib/validation";
import { type Actor } from "@/lib/authz";

/** Sentinel: de plan-limiet was bij de atomische her-telling BÍNNEN de create-transactie alsnog bereikt
 *  (TOCTOU-race verloren). Buiten de transactie vertaald naar dezelfde nette gebruikersfout als de
 *  pre-transactionele fast-fail, zodat de bewoording niet drift. */
class ApplicationPlanLimitError extends Error {
  constructor(
    readonly maxApplicationsPerMonth: number,
    readonly resetsAt: Date,
  ) {
    super("application-plan-limit-reached");
    this.name = "ApplicationPlanLimitError";
  }
}

// Serializable maakt de reactie-plan-limiet ook op PostgreSQL (productie) waterdicht: onder de default
// READ COMMITTED lezen twee gelijktijdige reacties van dezelfde FREE-ZZP'er (op verschillende
// opdrachten) beide dezelfde `count`, zien elkaars nog-niet-gecommitte insert niet, en glippen samen
// onder de limiet door. Onder Serializable (Postgres SSI) vormt de telling + insert een
// read-write-conflict → één transactie faalt met P2034 en wordt her-geprobeerd; de her-telling ziet de
// nu-gecommitte reactie en handhaaft de limiet. SQLite kent alléén Serializable (DB-brede lock) → daar
// gedrags-neutraal. Spiegelt `JOB_PUBLISH_TX_OPTIONS`/`changeJobStatus` in opdrachten/actions.ts.
const APPLICATION_TX_OPTIONS = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  timeout: 30_000,
  maxWait: 10_000,
} as const;
const APPLICATION_MAX_ATTEMPTS = 4;

/** Ruwe (ongevalideerde) invoer; de helper parst zelf met `applicationSchema`. */
export type ApplicationRawInput = {
  motivation: unknown;
  proposedRate: unknown;
  availability: unknown;
};

export type CreateApplicationResult =
  | { ok: true; applicationId: string }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string>;
      /** Vervolgactie bij een blokkade die met een ander plan verdwijnt (reactielimiet). */
      upgradeHref?: string;
    };

/**
 * Eén bron van waarheid voor het aanmaken van een reactie (Application) op een opdracht.
 * Hergebruikt door zowel het reageer-formulier op de opdrachtdetail (`createApplication`) als
 * de directe claim vanuit de rooster-kalender (`claimShift`). Voert de volledige authz-/
 * validatieketen uit: rate-limit → profiel → opdracht + zichtbaarheid → dubbel-check →
 * plan-gating → Zod → server-berekende matchscore + compliance → create → audit → notificatie.
 *
 * De aanroeper doet eerst `requireRole("FREELANCER")` en handelt daarna revalidate/redirect af;
 * deze helper raakt geen Next-cache (puur de mutatie + het resultaat).
 */
export async function createApplicationForJob(
  actor: Actor,
  jobId: string,
  raw: ApplicationRawInput,
): Promise<CreateApplicationResult> {
  // Reactie-rem: begrens massa-reageren per ZZP'er (spam richting opdrachtgevers).
  if (!(await applicationRateLimiter.check(`apply:${actor.id}`)).allowed) {
    return { ok: false, error: "Te veel reacties kort achter elkaar. Probeer het later opnieuw." };
  }

  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId: actor.id },
    include: {
      skills: true,
      credentials: { select: { type: true, status: true, expiresAt: true } },
      industries: { select: { industryId: true } },
    },
  });
  if (!profile) return { ok: false, error: "Maak eerst je profiel aan." };

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      skills: true,
      credentialRequirements: true,
      company: { select: { userId: true } },
      tenant: { select: { openOverflow: true } },
    },
  });
  if (!job) return { ok: false, error: "Opdracht niet gevonden." };
  if (job.status !== "PUBLISHED")
    return { ok: false, error: "Je kunt alleen op gepubliceerde opdrachten reageren." };
  // Tenant-zichtbaarheid: een tenant-dienst is alleen reageerbaar voor de eigen roster (of als de
  // franchise hem heeft opengesteld via overflow). Niet alleen op de detailpagina afdwingen.
  if (!canViewJob(actor, job))
    return { ok: false, error: "Deze opdracht is niet zichtbaar voor jou." };

  // Een eerder ingetrokken reactie blokkeert niet: de ZZP'er mag opnieuw reageren. De bestaande rij
  // (unieke jobId+freelancerId) wordt dan hergebruikt en heropend i.p.v. een tweede te maken.
  const existing = await prisma.application.findUnique({
    where: { jobId_freelancerId: { jobId, freelancerId: profile.id } },
    select: { id: true, status: true },
  });
  if (existing && existing.status !== "WITHDRAWN") {
    return { ok: false, error: "Je hebt al op deze opdracht gereageerd." };
  }

  // Plan-gating (server-side) alleen bij een echt nieuwe reactie. Het heropenen van een eerder
  // ingetrokken reactie hergebruikt een bestaande rij en verbruikt dus geen extra plan-slot. Het
  // planmaximum wordt hier read-only bepaald; de TELLING draait atomair mét de create-write (zie de
  // transactie onderaan) — anders passeren twee gelijktijdige reacties van een FREE-ZZP'er beide op
  // dezelfde `count` en omzeilen ze de limiet (TOCTOU/monetisatie-bypass, OWASP A04). Deze
  // pre-transactionele lees is de fast-fail (bespaart de dure matchscore-berekening); de her-telling
  // binnen de transactie is de echte grendel.
  //
  // De limiet is een MAANDQUOTUM, geen levenslange teller: alleen reacties die deze kalendermaand
  // (Europe/Amsterdam) zijn aangemaakt en niet zijn ingetrokken verbruiken een slot. Volgende maand
  // begint iedereen weer op nul.
  const now = new Date();
  const quotaWhere = applicationQuotaWhere(profile.id, now);
  const periodEnd = applicationPeriodEnd(now);
  let maxPerMonth = -1; // -1 = onbeperkt (canApply-conventie); niet gebruikt bij een bestaande rij
  if (!existing) {
    const quota = await loadApplicationQuota(actor.id, profile.id, now);
    maxPerMonth = quota.limit;
    if (quota.reached) {
      return {
        ok: false,
        error: applicationLimitMessage(quota.limit, quota.resetsAt),
        upgradeHref: "/abonnement",
      };
    }
  }

  const parsed = applicationSchema.safeParse({
    motivation: raw.motivation,
    proposedRate: raw.proposedRate ?? "",
    availability: raw.availability || undefined,
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) if (v && v[0]) fieldErrors[k] = v[0];
    return { ok: false, error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }
  const data = parsed.data;

  // Server-berekende matchscore + compliance-snapshot (CLAUDE.md regel 1). Echte routed reistijd
  // (Geoapify) als provider actief is; anders de offline schatting — beide via één seam.
  const routedTravelMinutesToJob =
    profile.maxTravelMinutes != null &&
    profile.maxTravelMinutes > 0 &&
    profile.workMode !== "REMOTE" &&
    job.workMode !== "REMOTE"
      ? await estimateTravelMinutesWithRouting(profile.location, job.location)
      : null;
  const match = scoreJobForFreelancer(job, { ...profile, routedTravelMinutesToJob });

  const applicationData = {
    status: "NEW" as const,
    motivation: data.motivation,
    proposedRate: data.proposedRate ?? null,
    availability: data.availability ?? null,
    matchScore: match.score,
    complianceSnapshot: JSON.stringify(match.compliance),
  };

  // Heropen een eerder ingetrokken reactie (zelfde rij) of maak een nieuwe aan. Beide krijgen verse
  // motivatie/tarief + een opnieuw berekende matchscore en compliance-snapshot.
  let application: { id: string };
  if (existing) {
    // Heropenen verbruikt geen plan-slot (hergebruikt een bestaande rij) → geen limiet-telling nodig.
    application = await prisma.application.update({
      where: { id: existing.id },
      data: applicationData,
      select: { id: true },
    });
  } else {
    // TOCTOU-grendel: her-tel het aantal reacties BÍNNEN dezelfde Serializable transactie als de insert
    // en handhaaf de plan-limiet atomair. Op Postgres SSI conflicteert die telling+insert met een
    // gelijktijdige tweede reactie → één transactie faalt met P2034 en wordt her-geprobeerd; de
    // her-telling ziet dan de gecommitte reactie en weigert correct. Spiegelt `changeJobStatus`.
    try {
      let created: { id: string } | null = null;
      for (let attempt = 0; attempt < APPLICATION_MAX_ATTEMPTS; attempt++) {
        try {
          created = await prisma.$transaction(async (tx) => {
            const count = await tx.application.count({ where: quotaWhere });
            if (!canApply(maxPerMonth, count))
              throw new ApplicationPlanLimitError(maxPerMonth, periodEnd);
            return tx.application.create({
              data: { jobId, freelancerId: profile.id, ...applicationData },
              select: { id: true },
            });
          }, APPLICATION_TX_OPTIONS);
          break;
        } catch (e) {
          // Serialisatie-conflict (Postgres SSI): een gelijktijdige reactie raakte dezelfde telling.
          // Her-probeer; de nieuwe telling ziet de gecommitte reactie en handhaaft de limiet.
          if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === "P2034" &&
            attempt < APPLICATION_MAX_ATTEMPTS - 1
          )
            continue;
          throw e;
        }
      }
      if (!created)
        return { ok: false, error: "Kon de reactie niet opslaan. Probeer het opnieuw." };
      application = created;
    } catch (e) {
      if (e instanceof ApplicationPlanLimitError) {
        return {
          ok: false,
          error: applicationLimitMessage(e.maxApplicationsPerMonth, e.resetsAt),
          upgradeHref: "/abonnement",
        };
      }
      throw e;
    }
  }

  await audit({
    actorId: actor.id,
    action: "APPLICATION_CREATED",
    entityType: "Application",
    entityId: application.id,
    metadata: { jobId, matchScore: match.score, compliance: match.compliance.status },
  });

  // Meld de nieuwe reactie aan de opdrachtgever.
  await prisma.notification.create({
    data: {
      userId: job.company.userId,
      type: "APPLICATION_RECEIVED",
      title: "Nieuwe reactie",
      body: `Nieuwe reactie op "${job.title}".`,
      link: "/kandidaten",
    },
  });

  return { ok: true, applicationId: application.id };
}
