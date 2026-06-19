"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertOwnership, AuthorizationError, requireRole } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { canApply } from "@/lib/applications";
import { createApplicationForJob } from "@/lib/applications-create";
import { assessDbaRisk } from "@/lib/dba";
import { assertJobTransition, canPublish, JobTransitionError } from "@/lib/jobs";
import { planPoolInvites, type PoolMember } from "@/lib/pool-routing";
import { type Availability, type JobStatus, jobStatusSchema } from "@/lib/enums";
import { jobSchema } from "@/lib/validation";

export type JobFormState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

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
    if (!existing) return { error: "Opdracht niet gevonden." };
    assertOwnership(actor, existing.company.userId);

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
  const targetStatus = jobStatusSchema.parse(target);

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: { select: { userId: true } },
      tenant: { select: { openOverflow: true } },
    },
  });
  if (!job) return { error: "Opdracht niet gevonden." };
  try {
    assertOwnership(actor, job.company.userId);
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

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

  // Plan-gating (server-side, CLAUDE.md regel 1): het aantal ACTIEVE (gepubliceerde) opdrachten is
  // begrensd door het plan (FREE = 1, betaald = onbeperkt). Spiegelt de reactie-limiet (maxApplications);
  // zonder dit kon een gratis opdrachtgever onbeperkt publiceren en de betaalde upgrade omzeilen.
  if (targetStatus === "PUBLISHED") {
    const [activeCount, subscription, freePlan] = await Promise.all([
      prisma.job.count({
        where: { company: { userId: actor.id }, status: "PUBLISHED", id: { not: jobId } },
      }),
      prisma.subscription.findUnique({ where: { userId: actor.id }, include: { plan: true } }),
      prisma.plan.findUnique({ where: { key: "FREE" } }),
    ]);
    const activePlanMax = subscription?.status === "ACTIVE" ? subscription.plan.maxJobs : undefined;
    const maxJobs = activePlanMax ?? freePlan?.maxJobs ?? 1;
    if (!canApply(maxJobs, activeCount)) {
      return {
        error: `Je hebt het maximum aantal actieve opdrachten (${maxJobs}) van je plan bereikt. Upgrade je abonnement voor meer.`,
      };
    }
  }

  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: targetStatus,
      publishedAt: targetStatus === "PUBLISHED" && !job.publishedAt ? new Date() : job.publishedAt,
    },
  });

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
