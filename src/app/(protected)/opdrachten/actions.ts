"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthorizationError, owns, requireRole } from "@/lib/authz";
import { audit, auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { canApply } from "@/lib/applications";
import { createApplicationForJob } from "@/lib/applications-create";
import { assessDbaRisk } from "@/lib/dba";
import { assertJobTransition, canPublish, JobTransitionError } from "@/lib/jobs";
import { planPoolInvites, type PoolMember } from "@/lib/pool-routing";
import { OPEN_APPLICATION_STATUSES, planClosureNotifications } from "@/lib/job-closure";
import { type Availability, type JobStatus, jobStatusSchema } from "@/lib/enums";
import { jobSchema } from "@/lib/validation";
import { visibleJobsWhere } from "@/lib/tenancy";
import { discoverableFreelancerWhere } from "@/lib/freelancer-visibility";
import {
  assessInviteEligibility,
  buildJobInviteNotification,
  JOB_INVITED_AUDIT_ACTION,
  parseInvitedFreelancerIds,
  planBulkJobInvites,
} from "@/lib/job-invite";
import { suggestedFreelancersForJob } from "@/lib/suggestions";
import { inviteRateLimiter } from "@/lib/rate-limit";

export type JobFormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

// Interne sentinels voor de compound-guarded publish-transactie (zie `publishJob`). Ze rollen de
// transactie terug en worden buiten de transactie vertaald naar een nette `JobStatusState`-fout.
class StaleJobStatusError extends Error {
  constructor() {
    super("stale-job-status");
    this.name = "StaleJobStatusError";
  }
}
class PlanLimitReachedError extends Error {
  constructor(readonly maxJobs: number) {
    super("plan-limit-reached");
    this.name = "PlanLimitReachedError";
  }
}
// Serializable isolatie maakt de plan-limiet ook op PostgreSQL (productie) waterdicht: onder de
// default READ COMMITTED locken twee gelijktijdige publishes van VERSCHILLENDE drafts andere rijen,
// blokkeren elkaar niet, en zien elkaars nog-niet-gecommitte publicatie niet → beide zouden onder de
// FREE-limiet door glippen. Onder Serializable (Postgres SSI) vormt de plan-telling ná de write een
// read-write-conflict → één transactie faalt met een serialisatie-fout (P2034) en wordt her-geprobeerd;
// de her-telling ziet dan de nu-gecommitte opdracht en handhaaft de limiet. SQLite ondersteunt alléén
// Serializable (DB-brede write-lock) — dus dit is daar gedrags-neutraal. Ruime time-out/wachttijd
// tegen contentie; spiegelt `EXPIRY_TX_OPTIONS` in de cron-taken.
const JOB_PUBLISH_TX_OPTIONS = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  timeout: 30_000,
  maxWait: 10_000,
} as const;
// Aantal her-pogingen bij een serialisatie-conflict (P2034) voordat we opgeven; spiegelt de retry-lus
// op factuurnummer-botsingen in `facturen/actions.ts`.
const JOB_PUBLISH_MAX_ATTEMPTS = 4;

function parseJobForm(formData: FormData) {
  return jobSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    industryId: formData.get("industryId") ?? "",
    rateMin: formData.get("rateMin") ?? "",
    rateMax: formData.get("rateMax") ?? "",
    location: formData.get("location") || undefined,
    workMode: formData.get("workMode"),
    startDate: formData.get("startDate") ?? "",
    requiredSkillIds: formData.getAll("requiredSkillIds").map(String),
    optionalSkillIds: formData.getAll("optionalSkillIds").map(String),
    requiredCredentialTypes: formData.getAll("requiredCredentialTypes").map(String),
    optionalCredentialTypes: formData.getAll("optionalCredentialTypes").map(String),
    dbaDirectSupervision: formData.get("dbaDirectSupervision") === "on",
    dbaEmbedded: formData.get("dbaEmbedded") === "on",
    dbaFixedSchedule: formData.get("dbaFixedSchedule") === "on",
    dbaNoSubstitution: formData.get("dbaNoSubstitution") === "on",
    dbaExclusive: formData.get("dbaExclusive") === "on",
    dbaWeakEntrepreneurship: formData.get("dbaWeakEntrepreneurship") === "on",
    dbaDurationMonths: formData.get("dbaDurationMonths") ?? "",
    modelAgreementType: formData.get("modelAgreementType") ?? "",
  });
}

export async function saveJob(_prev: JobFormState, formData: FormData): Promise<JobFormState> {
  let actor;
  try {
    actor = await requireRole("CLIENT");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const company = await prisma.company.findUnique({
    where: { userId: actor.id },
    select: { id: true, userId: true, tenantId: true },
  });
  if (!company) return { error: "Bedrijfsprofiel niet gevonden." };

  const parsed = parseJobForm(formData);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) if (v && v[0]) fieldErrors[k] = v[0];
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }
  const data = parsed.data;

  // Alleen bestaande skills koppelen; required wint van optional bij overlap.
  const allSkillIds = [...new Set([...data.requiredSkillIds, ...data.optionalSkillIds])];
  // unbounded-allow: skills-referentielijst voor formulier
  const validSkills = await prisma.skill.findMany({
    where: { id: { in: allSkillIds } },
    select: { id: true },
  });
  const validSet = new Set(validSkills.map((s) => s.id));
  const requiredSet = new Set(data.requiredSkillIds.filter((id) => validSet.has(id)));
  const jobSkills = [...validSet].map((skillId) => ({
    skillId,
    required: requiredSet.has(skillId),
  }));

  const requiredCreds = new Set(data.requiredCredentialTypes);
  const credTypes = [
    ...new Set([...data.requiredCredentialTypes, ...data.optionalCredentialTypes]),
  ];
  const credReqs = credTypes.map((credentialType) => ({
    credentialType,
    required: requiredCreds.has(credentialType),
  }));

  const jobId = (formData.get("jobId") as string) || null;
  // Wet DBA: server-berekende (gezaghebbende) risico-snapshot — niet de client vertrouwen.
  const dba = assessDbaRisk({
    directSupervision: data.dbaDirectSupervision,
    embedded: data.dbaEmbedded,
    fixedSchedule: data.dbaFixedSchedule,
    noSubstitution: data.dbaNoSubstitution,
    exclusive: data.dbaExclusive,
    weakEntrepreneurship: data.dbaWeakEntrepreneurship,
    durationMonths: data.dbaDurationMonths ?? null,
  });

  const fields = {
    title: data.title,
    description: data.description,
    industryId: data.industryId ?? null,
    rateMin: data.rateMin ?? null,
    rateMax: data.rateMax ?? null,
    location: data.location ?? null,
    workMode: data.workMode,
    startDate: data.startDate ?? null,
    dbaDirectSupervision: data.dbaDirectSupervision,
    dbaEmbedded: data.dbaEmbedded,
    dbaFixedSchedule: data.dbaFixedSchedule,
    dbaNoSubstitution: data.dbaNoSubstitution,
    dbaExclusive: data.dbaExclusive,
    dbaWeakEntrepreneurship: data.dbaWeakEntrepreneurship,
    dbaDurationMonths: data.dbaDurationMonths ?? null,
    dbaRisk: dba.level,
    dbaReasons: JSON.stringify(dba.reasons),
    modelAgreementType: data.modelAgreementType ?? null,
  };

  let savedId: string;
  if (jobId) {
    const existing = await prisma.job.findUnique({
      where: { id: jobId },
      include: { company: { select: { userId: true } } },
    });
    // Onbekende én niet-eigen opdracht geven exact dezelfde fout-state. `assertOwnership` throwde een
    // onafgevangen AuthorizationError bij een geknutseld `jobId` van een ánder bedrijf, terwijl een
    // onbekend id een nette `{ error }` gaf — een throw-vs-return-oracle waarmee een opdrachtgever het
    // bestaan van andermans opdracht kon aftasten (CWE-203). Nu ononderscheidbaar.
    if (!existing || !owns(actor, existing.company.userId)) {
      return { error: "Opdracht niet gevonden." };
    }

    await prisma.$transaction([
      prisma.job.update({ where: { id: jobId }, data: fields }),
      prisma.jobSkill.deleteMany({ where: { jobId } }),
      prisma.jobSkill.createMany({ data: jobSkills.map((s) => ({ jobId, ...s })) }),
      prisma.jobCredentialRequirement.deleteMany({ where: { jobId } }),
      prisma.jobCredentialRequirement.createMany({ data: credReqs.map((c) => ({ jobId, ...c })) }),
    ]);
    savedId = jobId;
    await audit({ actorId: actor.id, action: "JOB_UPDATED", entityType: "Job", entityId: jobId });
  } else {
    const created = await prisma.job.create({
      data: {
        ...fields,
        companyId: company.id,
        // Denormaliseer de tenant van het bedrijf op de opdracht. Voor een franchise-opdrachtgever
        // (tenantId gezet) blijft de opdracht zo "gesloten per tenant"; zonder dit kreeg een
        // zelf-geplaatste opdracht tenantId=null en lekte hij als platform-opdracht naar alle
        // directe ZZP'ers (en suggesties cross-tenant). Spiegelt createFranchiseDienst.
        tenantId: company.tenantId,
        status: "DRAFT",
        skills: { create: jobSkills },
        credentialRequirements: { create: credReqs },
      },
    });
    savedId = created.id;
    await audit({ actorId: actor.id, action: "JOB_CREATED", entityType: "Job", entityId: savedId });

    // "Opslaan & publiceren": maak de opdracht aan als concept en publiceer haar direct via de
    // BESTAANDE statusovergang (changeJobStatus → JOB_TRANSITIONS + canPublish + plan-gating + pool),
    // exact zoals de publiceer-knop op de detailpagina. Geen nieuwe transitie-logica. Alleen op
    // aanmaken (nieuwe opdracht); bij bewerken blijft het gedrag ongewijzigd. Lukt publiceren
    // (bv. plan-limiet), dan blijft de opdracht als concept bewaard en valt de flow terug op de
    // redirect naar de detailpagina, waar de opdrachtgever alsnog kan publiceren.
    if (formData.get("intent") === "publish") {
      const published = await changeJobStatus(savedId, "PUBLISHED");
      // changeJobStatus redirect zelf bij succes; komen we hier, dan is het misgegaan.
      if (published?.error) {
        revalidatePath("/opdrachten");
        redirect(`/opdrachten/${savedId}`);
      }
    }
  }

  revalidatePath("/opdrachten");
  redirect(`/opdrachten/${savedId}`);
}

export type JobStatusState = { error?: string } | undefined;

export async function changeJobStatus(
  jobId: string,
  target: string,
  _prev?: JobStatusState,
  _formData?: FormData,
): Promise<JobStatusState> {
  const actor = await requireRole("CLIENT");
  // safeParse (geen throwing .parse): een geknutselde POST met een `target` buiten de enum mag geen
  // onafgevangen ZodError/500 geven. Deze actie retourneert een fout-object (JobStatusState), dus
  // geef dezelfde nette vorm terug als de overige faalpaden i.p.v. te throwen.
  const parsedTarget = jobStatusSchema.safeParse(target);
  if (!parsedTarget.success) return { error: "Ongeldige doelstatus." };
  const targetStatus = parsedTarget.data;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: { select: { userId: true } },
      tenant: { select: { openOverflow: true } },
    },
  });
  // Onbekende én niet-eigen opdracht geven exact dezelfde fout-state (geen CWE-203 existence-oracle;
  // spiegelt saveJob hierboven en inviteSuggestedFreelancersToJob hieronder). `assertOwnership` gaf
  // voor een bestaand-maar-vreemd `jobId` de melding "Geen toegang tot deze resource." terwijl een
  // onbekend id "Opdracht niet gevonden." gaf — een return-oracle (returnwaarden worden niet door
  // Next.js geredigeerd) waarmee een opdrachtgever Job-ids platform-breed kon aftasten. Nu identiek.
  if (!job || !owns(actor, job.company.userId)) return { error: "Opdracht niet gevonden." };

  const from = job.status as JobStatus;
  try {
    assertJobTransition(from, targetStatus);
  } catch (e) {
    if (e instanceof JobTransitionError) return { error: e.message };
    throw e;
  }

  if (targetStatus === "PUBLISHED" && !canPublish(job)) {
    return { error: "Een opdracht heeft een titel en omschrijving nodig om te publiceren." };
  }

  // Plan-limiet (server-side, CLAUDE.md regel 1): het aantal ACTIEVE (gepubliceerde) opdrachten is
  // begrensd door het plan (FREE = 1, betaald = onbeperkt). Het planmaximum wordt read-only bepaald,
  // maar de TELLING draait atomair mét de write (zie de transactie hieronder) — anders publiceren twee
  // gelijktijdige verzoeken van een FREE-opdrachtgever beide op activeCount=0 en omzeilen ze de upgrade.
  let maxJobs = -1; // -1 = onbeperkt (canApply-conventie)
  if (targetStatus === "PUBLISHED") {
    const [subscription, freePlan] = await Promise.all([
      prisma.subscription.findUnique({ where: { userId: actor.id }, include: { plan: true } }),
      prisma.plan.findUnique({ where: { key: "FREE" } }),
    ]);
    const activePlanMax = subscription?.status === "ACTIVE" ? subscription.plan.maxJobs : undefined;
    maxJobs = activePlanMax ?? freePlan?.maxJobs ?? 1;
  }

  // Compound-guarded statusovergang + atomische plan-limiet (CLAUDE.md regel 2/3). De vroegere blinde
  // `update({ where: { id } })` ná een niet-transactionele statuslees liet twee races toe:
  //  (1) een concurrente moderatie-CLOSED (`adminCloseJob`) werd door een heropen-write overschreven
  //      (resurrectie van een gesloten opdracht terug naar PUBLISHED), en
  //  (2) twee gelijktijdige publish-verzoeken telden beide onder de plan-limiet en publiceerden allebei.
  // `updateMany({ where: { id, status: from } })` schrijft alleen als de rij nog op de geziene status
  // staat (count 0 = race verloren → rollback) — dat dicht (1) op elke DB. De plan-telling draait ná die
  // write in dezelfde Serializable transactie; op Postgres SSI conflicteert die read-write-combinatie met
  // een gelijktijdige publish → één transactie faalt met P2034 en wordt hieronder her-geprobeerd (de
  // her-telling ziet dan de gecommitte opdracht → limiet gehandhaafd). Zo valt ook (2) dicht, niet alleen
  // op SQLite maar ook in productie.
  for (let attempt = 0; attempt < JOB_PUBLISH_MAX_ATTEMPTS; attempt++) {
    try {
      await prisma.$transaction(async (tx) => {
        const updated = await tx.job.updateMany({
          where: { id: jobId, status: from },
          data: {
            status: targetStatus,
            publishedAt:
              targetStatus === "PUBLISHED" && !job.publishedAt ? new Date() : job.publishedAt,
          },
        });
        if (updated.count === 0) throw new StaleJobStatusError();
        if (targetStatus === "PUBLISHED") {
          // `id: { not: jobId }` telt de ANDERE gepubliceerde opdrachten; deze zojuist-gepubliceerde job
          // is de +1, dus `canApply(maxJobs, activeCount)` valt precies gelijk met "totaal ≤ maxJobs".
          const activeCount = await tx.job.count({
            where: { company: { userId: actor.id }, status: "PUBLISHED", id: { not: jobId } },
          });
          if (!canApply(maxJobs, activeCount)) throw new PlanLimitReachedError(maxJobs);
        }
      }, JOB_PUBLISH_TX_OPTIONS);
      break; // geslaagd
    } catch (e) {
      if (e instanceof StaleJobStatusError) {
        return {
          error:
            "De status van deze opdracht is net gewijzigd. Ververs de pagina en probeer opnieuw.",
        };
      }
      if (e instanceof PlanLimitReachedError) {
        return {
          error: `Je hebt het maximum aantal actieve opdrachten (${e.maxJobs}) van je plan bereikt. Upgrade je abonnement voor meer.`,
        };
      }
      // Serialisatie-conflict (Postgres SSI): een gelijktijdige publish raakte dezelfde plan-telling.
      // Her-probeer; de nieuwe telling ziet de gecommitte opdracht en handhaaft de limiet correct.
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2034" &&
        attempt < JOB_PUBLISH_MAX_ATTEMPTS - 1
      ) {
        continue;
      }
      throw e;
    }
  }

  await audit({
    actorId: actor.id,
    action: "JOB_STATUS_CHANGED",
    entityType: "Job",
    entityId: jobId,
    metadata: { from, to: targetStatus },
  });

  // Flexpool "eerst eigen mensen": bij de EERSTE publicatie (publishedAt was nog leeg) krijgen de
  // poule-leden van de opdrachtgever direct een uitnodiging — vóór de brede job-alert-taak en
  // ongeacht de matchdrempel. Alleen op de eerste publicatie, zodat heropenen (CLOSED→PUBLISHED)
  // de poule niet opnieuw spamt. Wie geschikt is bepaalt de pure planner (server-side waarheid).
  if (targetStatus === "PUBLISHED" && !job.publishedAt) {
    const company = await prisma.company.findUnique({
      where: { userId: actor.id },
      select: { id: true, name: true },
    });
    if (company) {
      // unbounded-allow: eigen flexpool-leden bij eerste publicatie (per bedrijf begrensd)
      const favorites = await prisma.favoriteFreelancer.findMany({
        where: { companyId: company.id },
        select: {
          freelancer: {
            select: {
              id: true,
              availability: true,
              visibility: true,
              tenantId: true,
              user: { select: { id: true, status: true } },
              applications: { where: { jobId }, select: { id: true } },
            },
          },
        },
      });
      const members: PoolMember[] = favorites.map((f) => ({
        userId: f.freelancer.user.id,
        freelancerProfileId: f.freelancer.id,
        availability: f.freelancer.availability as Availability,
        visibility: f.freelancer.visibility,
        userStatus: f.freelancer.user.status,
        tenantId: f.freelancer.tenantId,
        hasApplied: f.freelancer.applications.length > 0,
      }));
      const invites = planPoolInvites(
        {
          id: jobId,
          title: job.title,
          companyName: company.name,
          tenantId: job.tenantId,
          openOverflow: job.tenant?.openOverflow ?? false,
        },
        members,
      );
      if (invites.length > 0) {
        await prisma.notification.createMany({
          data: invites.map((i) => ({
            userId: i.userId,
            type: i.notificationType,
            title: i.title,
            body: i.body,
            link: i.link,
          })),
        });
        await audit({
          actorId: actor.id,
          action: "POOL_INVITED",
          entityType: "Job",
          entityId: jobId,
          metadata: { count: invites.length },
        });
      }
    }
  }

  // Sluit de lus voor de ZZP'er: wordt een LIVE opdracht gesloten, dan verdienen de nog-openstaande
  // reacties (NEW/VIEWED/SHORTLIST) een seintje dat de opdracht weg is — anders wachten ze voor niets.
  // Alleen op de PUBLISHED→CLOSED-overgang (een gesloten concept had geen reacties); wie de pure
  // planner notificeert is server-side waarheid.
  if (targetStatus === "CLOSED" && from === "PUBLISHED") {
    // unbounded-allow: open reacties van één opdracht bij sluiten (per opdracht begrensd)
    const openApplications = await prisma.application.findMany({
      where: { jobId, status: { in: [...OPEN_APPLICATION_STATUSES] } },
      select: { status: true, freelancer: { select: { userId: true } } },
    });
    const notifications = planClosureNotifications(
      { id: jobId, title: job.title },
      openApplications.map((a) => ({ freelancerUserId: a.freelancer.userId, status: a.status })),
    );
    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications.map((n) => ({
          userId: n.userId,
          type: n.notificationType,
          title: n.title,
          body: n.body,
          link: n.link,
        })),
      });
      await audit({
        actorId: actor.id,
        action: "JOB_CLOSED_NOTIFIED",
        entityType: "Job",
        entityId: jobId,
        metadata: { count: notifications.length },
      });
    }
  }

  revalidatePath("/opdrachten");
  revalidatePath(`/opdrachten/${jobId}`);
  // Sluit af met een redirect naar dezelfde pagina: de client krijgt een 303 + verse GET in
  // plaats van een gestreamde action-rerender. Die stream blijft in productie intermitterend
  // hangen (issue #329) waardoor de knop eeuwig op "bezig" stond terwijl de wissel al gelukt
  // was; het redirect-pad is in alle probes betrouwbaar gebleken.
  redirect(`/opdrachten/${jobId}`);
}

export type ApplyState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

export async function createApplication(
  jobId: string,
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
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

  revalidatePath("/reacties");
  revalidatePath(`/opdrachten/${jobId}`);
  redirect("/reacties");
}

/**
 * Bewaart of verwijdert een opdracht uit de bewaarlijst van de ZZP'er (toggle, idempotent).
 * Keten: auth → rol (FREELANCER) → eigen profiel als anker → zichtbaarheidscheck op de opdracht
 * (alleen een gepubliceerde, voor deze ZZP'er zichtbare opdracht kan worden bewaard) → mutatie +
 * audit. Een reeds-verdwenen bookmark verwijderen is een no-op zonder audit.
 */
export async function toggleSavedJob(jobId: string): Promise<void> {
  const actor = await requireRole("FREELANCER");

  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId: actor.id },
    select: { id: true },
  });
  if (!profile) throw new Error("Geen ZZP'er-profiel gevonden.");
  const freelancerProfileId = profile.id;

  const existing = await prisma.savedJob.findUnique({
    where: { freelancerProfileId_jobId: { freelancerProfileId, jobId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.savedJob.delete({ where: { id: existing.id } });
    await audit({
      actorId: actor.id,
      action: "JOB_UNSAVED",
      entityType: "Job",
      entityId: jobId,
    });
  } else {
    // Bewaren mag alleen voor een gepubliceerde opdracht die voor deze ZZP'er zichtbaar is.
    const job = await prisma.job.findFirst({
      where: { id: jobId, status: "PUBLISHED", AND: [visibleJobsWhere(actor)] },
      select: { id: true },
    });
    if (!job) throw new Error("Opdracht niet gevonden.");

    await prisma.savedJob.create({ data: { freelancerProfileId, jobId } });
    await audit({
      actorId: actor.id,
      action: "JOB_SAVED",
      entityType: "Job",
      entityId: jobId,
    });
  }

  revalidatePath("/opgeslagen");
  revalidatePath("/opdrachten");
  revalidatePath(`/opdrachten/${jobId}`);
}

/**
 * Verwijdert in één keer alle bewaarde opdrachten van de ZZP'er die niet meer open staan (de opdracht
 * is niet langer PUBLISHED — gesloten of teruggetrokken). Houdt de "Opgeslagen"-lijst relevant zonder
 * dat de ZZP'er stuk voor stuk hoeft te verwijderen. Eigenaar-scoped: raakt alleen de eigen rijen.
 */
export async function clearUnavailableSavedJobs(): Promise<void> {
  const actor = await requireRole("FREELANCER");

  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId: actor.id },
    select: { id: true },
  });
  if (!profile) throw new Error("Geen ZZP'er-profiel gevonden.");

  const { count } = await prisma.savedJob.deleteMany({
    where: {
      freelancerProfileId: profile.id,
      job: { status: { not: "PUBLISHED" } },
    },
  });

  if (count > 0) {
    await audit({
      actorId: actor.id,
      action: "JOB_UNSAVED",
      entityType: "Job",
      entityId: "bulk",
      metadata: { clearedUnavailable: count },
    });
  }

  revalidatePath("/opgeslagen");
}

/**
 * Directe uitnodiging: de opdrachtgever nodigt een passende, openbare ZZP'er uit om op zijn
 * gepubliceerde opdracht te reageren. Volledige mutatieketen (CLAUDE.md regel 2):
 * auth → rol CLIENT → ownership van de opdracht → server-side eligibility → actie → audit.
 *
 * Geen eigen datamodel: de uitnodiging is een Notification naar de ZZP'er + een gezaghebbend
 * JOB_INVITED-auditrecord (identiek patroon als flexpool-routing). Het auditrecord is óók de
 * dedup-/UI-bron: een tweede poging voor hetzelfde (opdracht, ZZP'er)-paar is een stille no-op.
 * Idempotent en veilig bij races (soft-return i.p.v. een 500).
 */
export async function inviteFreelancerToJob(
  jobId: string,
  freelancerProfileId: string,
): Promise<void> {
  const actor = await requireRole("CLIENT");

  // Spam-rem (security-review): begrens het aantal directe uitnodigingen per opdrachtgever per uur
  // vóór de DB-reads/-writes. Zonder bovengrens kan één opdrachtgever een script laten lopen dat de
  // hele discoverable-pool aanschrijft (massa-notificaties richting ZZP'ers). De eligibility-/
  // ownership-poort blijft de bron van toegang; dit is een extra volume-rem.
  if (!(await inviteRateLimiter.check(actor.id)).allowed) {
    throw new Error("Je hebt het maximum aantal uitnodigingen per uur bereikt.");
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true,
      status: true,
      tenantId: true,
      company: { select: { userId: true, name: true } },
    },
  });
  // Onbekende én niet-eigen opdracht: exact dezelfde stille afhandeling. `assertOwnership` throwt een
  // AuthorizationError die deze void-actie niet afving — een onbekend id resolvete stil, een bestaand-
  // maar-vreemd id rejecte: een observeerbaar throw-vs-resolve-verschil waarmee een opdrachtgever het
  // bestaan (incl. ongepubliceerde CONCEPT-opdracht) van andermans opdracht kon aftasten (CWE-203
  // existence-oracle). Nu ononderscheidbaar: geen lek, geen 500. Spiegelt de gefolde checks elders.
  if (!job || !owns(actor, job.company.userId)) return;

  // De ZZP'er moet openbaar vindbaar zijn (PUBLIC + ACTIVE) — precies de pool die de suggesties
  // voedt. `findFirst` mét de discoverable-where scoped de zichtbaarheid server-side af. Cruciaal:
  // óók op de eigen tenant van de opdracht (`tenantId: job.tenantId`) scopen — identiek aan
  // `suggestedFreelancersForJob` (suggestions.ts), dat exact deze uitnodigingsknoppen voedt. Zonder
  // die tenant-grens kan een opdrachtgever een ZZP'er uit de private roster van een ándere franchise
  // uitnodigen (het profiel staat standaard op PUBLIC) — een cross-tenant-lek: de ZZP'er krijgt een
  // notificatie met bedrijfs-/opdrachtnaam van buiten zijn franchise en er wordt PII gejoind over de
  // tenant-grens (OWASP A01; CLAUDE.md regel 1 & 2 — ownership dekt óók de uitgenodigde, niet enkel
  // de opdracht). Een directe opdrachtgever (tenantId null) bereikt zo alleen niet-tenant-ZZP'ers.
  const freelancer = await prisma.freelancerProfile.findFirst({
    where: { id: freelancerProfileId, tenantId: job.tenantId, ...discoverableFreelancerWhere },
    select: {
      id: true,
      user: { select: { id: true } },
      applications: { where: { jobId }, select: { id: true } },
    },
  });

  const alreadyInvited = freelancer
    ? (await prisma.auditLog.count({
        where: {
          entityType: "Job",
          entityId: jobId,
          action: JOB_INVITED_AUDIT_ACTION,
          metadata: { contains: `"freelancerId":"${freelancerProfileId}"` },
        },
      })) > 0
    : false;

  const eligibility = assessInviteEligibility({
    jobStatus: job.status as JobStatus,
    alreadyApplied: (freelancer?.applications.length ?? 0) > 0,
    alreadyInvited,
    discoverable: freelancer != null,
  });
  if (!eligibility.ok || !freelancer) {
    revalidatePath(`/opdrachten/${jobId}`);
    return;
  }

  const notification = buildJobInviteNotification({
    jobId,
    jobTitle: job.title,
    companyName: job.company.name,
  });
  await prisma.notification.create({
    data: {
      userId: freelancer.user.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      link: notification.link,
    },
  });
  await audit({
    actorId: actor.id,
    action: JOB_INVITED_AUDIT_ACTION,
    entityType: "Job",
    entityId: jobId,
    metadata: { freelancerId: freelancerProfileId },
  });

  revalidatePath(`/opdrachten/${jobId}`);
}

/**
 * Bulk-uitnodiging: de opdrachtgever nodigt in één klik álle nog-niet-uitgenodigde geschikte ZZP'ers
 * voor zijn gepubliceerde opdracht uit. Vertaalt de auto-uitnodiging-liquiditeit van PIDZ/Zorgwerk
 * naar onze verklaarbare matching, zónder eigen datamodel: per uitnodiging een Notification + een
 * gezaghebbend JOB_INVITED-auditrecord (identiek aan de enkelvoudige `inviteFreelancerToJob`).
 *
 * Volledige mutatieketen (CLAUDE.md regel 2): auth → rol CLIENT → ownership → server-side eligibility.
 * De kandidatenbron is `suggestedFreelancersForJob` (dezelfde die de UI-knoppen voedt) — die is al
 * openbaar/tenant-gescoopt/gepubliceerd/niet-gereageerd. Hier resteert de reeds-uitgenodigd-dedup, de
 * volumecap (`MAX_BULK_JOB_INVITES`) én de per-uur-spam-rem (`inviteRateLimiter`, één token per
 * daadwerkelijke uitnodiging — stopt zodra het budget op is). Idempotent en race-veilig: een tweede
 * poging is een stille no-op, een defensieve her-fetch (discoverable + eigen tenant) sluit stale
 * suggesties uit. Nooit een 500 op lege/afgehandelde input.
 */
export async function inviteSuggestedFreelancersToJob(jobId: string): Promise<void> {
  const actor = await requireRole("CLIENT");

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true,
      status: true,
      tenantId: true,
      company: { select: { userId: true, name: true } },
    },
  });
  // Onbekende én niet-eigen opdracht ononderscheidbaar (zie inviteFreelancerToJob): geen throw-vs-
  // resolve-oracle op andermans (concept-)opdracht. Geen lek, geen 500.
  if (!job || !owns(actor, job.company.userId)) return;

  if ((job.status as JobStatus) !== "PUBLISHED") {
    revalidatePath(`/opdrachten/${jobId}`);
    return;
  }

  // Gezaghebbende kandidatenbron: exact de lijst die de "Geschikte ZZP'ers"-knoppen voedt.
  const suggestions = await suggestedFreelancersForJob(jobId);
  const invited = parseInvitedFreelancerIds(
    await prisma.auditLog.findMany({
      where: { entityType: "Job", entityId: jobId, action: JOB_INVITED_AUDIT_ACTION },
      select: { metadata: true },
      take: 200,
    }),
  );
  const toInvite = planBulkJobInvites(
    suggestions.map((s) => s.freelancerId),
    invited,
  );
  if (toInvite.length === 0) {
    revalidatePath(`/opdrachten/${jobId}`);
    return;
  }

  // Defensieve her-fetch: bevestig openbare vindbaarheid + eigen-tenant (identiek aan de
  // enkelvoudige actie — sluit een stale suggestie of cross-tenant-PII hard uit) en haal de userId's
  // op voor de notificaties. Ook `alreadyApplied` verifiëren tegen een race sinds de suggestie-fetch.
  // unbounded-allow: begrensd door de IN-lijst (toInvite ≤ MAX_BULK_JOB_INVITES).
  const profiles = await prisma.freelancerProfile.findMany({
    where: { id: { in: toInvite }, tenantId: job.tenantId, ...discoverableFreelancerWhere },
    select: {
      id: true,
      user: { select: { id: true } },
      applications: { where: { jobId }, select: { id: true } },
    },
  });
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  const notification = buildJobInviteNotification({
    jobId,
    jobTitle: job.title,
    companyName: job.company.name,
  });

  const notifications: { userId: string }[] = [];
  const invitedIds: string[] = [];
  // Behoud de suggestievolgorde (hoogste match eerst) zodat, als het rate-limit-budget opraakt,
  // de best passende ZZP'ers als eerste worden uitgenodigd.
  for (const freelancerProfileId of toInvite) {
    const profile = profileById.get(freelancerProfileId);
    const eligibility = assessInviteEligibility({
      jobStatus: job.status as JobStatus,
      alreadyApplied: (profile?.applications.length ?? 0) > 0,
      alreadyInvited: invited.has(freelancerProfileId),
      discoverable: profile != null,
    });
    if (!eligibility.ok || !profile) continue;

    // Eén token per daadwerkelijke uitnodiging — spiegelt de enkelvoudige actie en houdt de
    // massa-notificatie-rem intact. Budget op? Stop; de rest volgt bij een volgende poging.
    if (!(await inviteRateLimiter.check(actor.id)).allowed) break;

    notifications.push({ userId: profile.user.id });
    invitedIds.push(freelancerProfileId);
  }

  if (invitedIds.length === 0) {
    revalidatePath(`/opdrachten/${jobId}`);
    return;
  }

  await prisma.$transaction([
    prisma.notification.createMany({
      data: notifications.map((n) => ({
        userId: n.userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        link: notification.link,
      })),
    }),
    prisma.auditLog.createMany({
      data: invitedIds.map((freelancerId) =>
        auditData({
          actorId: actor.id,
          action: JOB_INVITED_AUDIT_ACTION,
          entityType: "Job",
          entityId: jobId,
          metadata: { freelancerId },
        }),
      ),
    }),
  ]);

  revalidatePath(`/opdrachten/${jobId}`);
}
