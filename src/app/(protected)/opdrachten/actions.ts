"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertOwnership, AuthorizationError, requireRole } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { assertJobTransition, canPublish, JobTransitionError } from "@/lib/jobs";
import { type JobStatus, jobStatusSchema } from "@/lib/enums";
import { jobSchema } from "@/lib/validation";

export type JobFormState =
  | { error?: string; fieldErrors?: Record<string, string> }
  | undefined;

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

  const company = await prisma.company.findUnique({ where: { userId: actor.id }, select: { id: true, userId: true } });
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
  const validSkills = await prisma.skill.findMany({ where: { id: { in: allSkillIds } }, select: { id: true } });
  const validSet = new Set(validSkills.map((s) => s.id));
  const requiredSet = new Set(data.requiredSkillIds.filter((id) => validSet.has(id)));
  const jobSkills = [...validSet].map((skillId) => ({ skillId, required: requiredSet.has(skillId) }));

  const requiredCreds = new Set(data.requiredCredentialTypes);
  const credTypes = [...new Set([...data.requiredCredentialTypes, ...data.optionalCredentialTypes])];
  const credReqs = credTypes.map((credentialType) => ({ credentialType, required: requiredCreds.has(credentialType) }));

  const jobId = (formData.get("jobId") as string) || null;
  const fields = {
    title: data.title,
    description: data.description,
    industryId: data.industryId ?? null,
    rateMin: data.rateMin ?? null,
    rateMax: data.rateMax ?? null,
    location: data.location ?? null,
    workMode: data.workMode,
    startDate: data.startDate ?? null,
  };

  let savedId: string;
  if (jobId) {
    const existing = await prisma.job.findUnique({ where: { id: jobId }, include: { company: { select: { userId: true } } } });
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

export async function changeJobStatus(jobId: string, target: string): Promise<void> {
  const actor = await requireRole("CLIENT");
  const targetStatus = jobStatusSchema.parse(target);

  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { company: { select: { userId: true } } } });
  if (!job) throw new Error("Opdracht niet gevonden.");
  assertOwnership(actor, job.company.userId);

  const from = job.status as JobStatus;
  try {
    assertJobTransition(from, targetStatus);
  } catch (e) {
    if (e instanceof JobTransitionError) throw new Error(e.message);
    throw e;
  }

  if (targetStatus === "PUBLISHED" && !canPublish(job)) {
    throw new Error("Een opdracht heeft een titel en omschrijving nodig om te publiceren.");
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
