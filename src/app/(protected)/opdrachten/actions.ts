"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertOwnership, AuthorizationError, requireRole } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { canApply } from "@/lib/applications";
import { assessDbaRisk } from "@/lib/dba";
import { assertJobTransition, canPublish, JobTransitionError } from "@/lib/jobs";
import { scoreJobForFreelancer } from "@/lib/matching";
import { canViewJob } from "@/lib/tenancy";
import { type JobStatus, jobStatusSchema } from "@/lib/enums";
import { applicationSchema, jobSchema } from "@/lib/validation";

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
    select: { id: true, userId: true },
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
    include: { company: { select: { userId: true } } },
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

  revalidatePath("/opdrachten");
  revalidatePath(`/opdrachten/${jobId}`);
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

  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId: actor.id },
    include: {
      skills: true,
      credentials: { select: { type: true, status: true, expiresAt: true } },
    },
  });
  if (!profile) return { error: "Maak eerst je profiel aan." };

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      skills: true,
      credentialRequirements: true,
      company: { select: { userId: true } },
      tenant: { select: { openOverflow: true } },
    },
  });
  if (!job) return { error: "Opdracht niet gevonden." };
  if (job.status !== "PUBLISHED")
    return { error: "Je kunt alleen op gepubliceerde opdrachten reageren." };
  // Tenant-zichtbaarheid: een tenant-dienst is alleen reageerbaar voor de eigen roster (of als de
  // franchise hem heeft opengesteld via overflow). Niet alleen op de detailpagina afdwingen.
  if (!canViewJob(actor, job)) return { error: "Deze opdracht is niet zichtbaar voor jou." };

  const existing = await prisma.application.findUnique({
    where: { jobId_freelancerId: { jobId, freelancerId: profile.id } },
    select: { id: true },
  });
  if (existing) return { error: "Je hebt al op deze opdracht gereageerd." };

  // Plan-gating (server-side). Zonder abonnement geldt het FREE-plan.
  const [count, subscription, freePlan] = await Promise.all([
    prisma.application.count({ where: { freelancerId: profile.id } }),
    prisma.subscription.findUnique({ where: { userId: actor.id }, include: { plan: true } }),
    prisma.plan.findUnique({ where: { key: "FREE" } }),
  ]);
  // Alleen een ACTIEF abonnement telt; anders geldt het FREE-plan (CLAUDE.md regel 1).
  const activePlanMax =
    subscription?.status === "ACTIVE" ? subscription.plan.maxApplications : undefined;
  const maxApplications = activePlanMax ?? freePlan?.maxApplications ?? 5;
  if (!canApply(maxApplications, count)) {
    return {
      error: `Je hebt het maximum aantal reacties (${maxApplications}) van je plan bereikt. Upgrade je abonnement voor meer reacties.`,
    };
  }

  const parsed = applicationSchema.safeParse({
    motivation: formData.get("motivation"),
    proposedRate: formData.get("proposedRate") ?? "",
    availability: formData.get("availability") || undefined,
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) if (v && v[0]) fieldErrors[k] = v[0];
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }
  const data = parsed.data;

  // Server-berekende matchscore + compliance-snapshot (CLAUDE.md regel 1).
  const match = scoreJobForFreelancer(job, profile);

  const application = await prisma.application.create({
    data: {
      jobId,
      freelancerId: profile.id,
      status: "NEW",
      motivation: data.motivation,
      proposedRate: data.proposedRate ?? null,
      availability: data.availability ?? null,
      matchScore: match.score,
      complianceSnapshot: JSON.stringify(match.compliance),
    },
  });

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

  revalidatePath("/reacties");
  revalidatePath(`/opdrachten/${jobId}`);
  redirect("/reacties");
}
