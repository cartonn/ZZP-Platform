"use server";

import { revalidatePath } from "next/cache";
import { requireRole, assertOwnership, AuthorizationError } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { computeFreelancerCompleteness } from "@/lib/profile";
import { serializeLanguages, splitLanguagesInput } from "@/lib/parse-languages";
import { freelancerProfileSchema } from "@/lib/validation";
import { workExperienceSchema, WORK_EXPERIENCE_MAX_PER_PROFILE } from "@/lib/work-experience";

export type ProfileState =
  | { ok?: true; error?: string; fieldErrors?: Record<string, string> }
  | undefined;

export async function updateFreelancerProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  let actor;
  try {
    actor = await requireRole("FREELANCER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const profile = await prisma.freelancerProfile.findUnique({ where: { userId: actor.id } });
  if (!profile) return { error: "Profiel niet gevonden." };
  assertOwnership(actor, profile.userId);

  const languages = splitLanguagesInput(String(formData.get("languages") ?? ""));

  const parsed = freelancerProfileSchema.safeParse({
    headline: formData.get("headline") || undefined,
    bio: formData.get("bio") || undefined,
    hourlyRate: formData.get("hourlyRate") ?? "",
    location: formData.get("location") || undefined,
    availability: formData.get("availability"),
    workMode: formData.get("workMode"),
    maxTravelMinutes: formData.get("maxTravelMinutes") ?? "",
    languages,
    kvkNumber: formData.get("kvkNumber") || undefined,
    btwNumber: formData.get("btwNumber") || undefined,
    iban: formData.get("iban") || undefined,
    website: formData.get("website") || undefined,
    visibility: formData.get("visibility"),
    defaultMotivation: formData.get("defaultMotivation") || undefined,
    skillIds: formData.getAll("skillIds").map(String),
    industryIds: formData.getAll("industryIds").map(String),
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) if (v && v[0]) fieldErrors[k] = v[0];
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }
  const data = parsed.data;

  // Alleen bestaande skills/branches koppelen (defensief tegen gemanipuleerde input).
  const [validSkills, validIndustries] = await Promise.all([
    // unbounded-allow: skills-referentielijst voor profielformulier
    prisma.skill.findMany({ where: { id: { in: data.skillIds } }, select: { id: true } }),
    // unbounded-allow: branches-referentielijst voor profielformulier
    prisma.industry.findMany({ where: { id: { in: data.industryIds } }, select: { id: true } }),
  ]);
  const skillIds = validSkills.map((s) => s.id);
  const industryIds = validIndustries.map((i) => i.id);

  const completeness = computeFreelancerCompleteness({
    headline: data.headline ?? null,
    bio: data.bio ?? null,
    hourlyRate: data.hourlyRate ?? null,
    location: data.location ?? null,
    availability: data.availability,
    languages: data.languages,
    skillCount: skillIds.length,
    industryCount: industryIds.length,
  }).score;

  await prisma.$transaction([
    prisma.freelancerProfile.update({
      where: { id: profile.id },
      data: {
        headline: data.headline ?? null,
        bio: data.bio ?? null,
        hourlyRate: data.hourlyRate ?? null,
        location: data.location ?? null,
        availability: data.availability,
        workMode: data.workMode,
        maxTravelMinutes: data.maxTravelMinutes ?? null,
        languages: serializeLanguages(data.languages),
        kvkNumber: data.kvkNumber ?? null,
        btwNumber: data.btwNumber ?? null,
        iban: data.iban ?? null,
        website: data.website ?? null,
        visibility: data.visibility,
        defaultMotivation: data.defaultMotivation ?? null,
        completeness,
      },
    }),
    prisma.freelancerSkill.deleteMany({ where: { freelancerProfileId: profile.id } }),
    prisma.freelancerSkill.createMany({
      data: skillIds.map((skillId) => ({ freelancerProfileId: profile.id, skillId })),
    }),
    prisma.freelancerIndustry.deleteMany({ where: { freelancerProfileId: profile.id } }),
    prisma.freelancerIndustry.createMany({
      data: industryIds.map((industryId) => ({ freelancerProfileId: profile.id, industryId })),
    }),
  ]);

  await audit({
    actorId: actor.id,
    action: "PROFILE_UPDATED",
    entityType: "FreelancerProfile",
    entityId: profile.id,
    metadata: { completeness, visibility: data.visibility },
  });

  revalidatePath("/profiel/bewerken");
  revalidatePath(`/zzp/${profile.id}`);
  return { ok: true };
}

export type WorkExperienceState =
  | { ok?: true; error?: string; fieldErrors?: Record<string, string> }
  | undefined;

/**
 * Voegt één werkervaring toe aan het eigen ZZP-profiel. Keten: auth → rol FREELANCER →
 * ownership (eigen profiel) → Zod → cap-check → create → audit.
 */
export async function addWorkExperience(
  _prev: WorkExperienceState,
  formData: FormData,
): Promise<WorkExperienceState> {
  let actor;
  try {
    actor = await requireRole("FREELANCER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const profile = await prisma.freelancerProfile.findUnique({ where: { userId: actor.id } });
  if (!profile) return { error: "Profiel niet gevonden." };
  assertOwnership(actor, profile.userId);

  const parsed = workExperienceSchema.safeParse({
    role: formData.get("role") ?? "",
    organization: formData.get("organization") ?? "",
    startYear: formData.get("startYear") ?? "",
    endYear: formData.get("endYear") ?? "",
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) if (v && v[0]) fieldErrors[k] = v[0];
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }

  const count = await prisma.workExperience.count({
    where: { freelancerProfileId: profile.id },
  });
  if (count >= WORK_EXPERIENCE_MAX_PER_PROFILE) {
    return { error: `Je kunt maximaal ${WORK_EXPERIENCE_MAX_PER_PROFILE} ervaringen toevoegen.` };
  }

  const created = await prisma.workExperience.create({
    data: {
      freelancerProfileId: profile.id,
      role: parsed.data.role,
      organization: parsed.data.organization,
      startYear: parsed.data.startYear,
      endYear: parsed.data.endYear,
      description: parsed.data.description,
    },
  });

  await audit({
    actorId: actor.id,
    action: "WORK_EXPERIENCE_ADDED",
    entityType: "WorkExperience",
    entityId: created.id,
    metadata: { role: created.role, organization: created.organization },
  });

  revalidatePath("/profiel/bewerken");
  revalidatePath(`/zzp/${profile.id}`);
  return { ok: true };
}

/**
 * Verwijdert een eigen werkervaring. Ownership wordt hard afgedwongen: alleen een rij die aan het
 * profiel van de actor hangt kan weg (geen IDOR).
 */
export async function deleteWorkExperience(
  _prev: WorkExperienceState,
  formData: FormData,
): Promise<WorkExperienceState> {
  let actor;
  try {
    actor = await requireRole("FREELANCER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const profile = await prisma.freelancerProfile.findUnique({ where: { userId: actor.id } });
  if (!profile) return { error: "Profiel niet gevonden." };
  assertOwnership(actor, profile.userId);

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Ongeldige invoer." };

  const existing = await prisma.workExperience.findUnique({ where: { id } });
  if (!existing || existing.freelancerProfileId !== profile.id) {
    // Bestaat niet of hoort bij een ander profiel → geen bestaans-orakel, gewoon klaar.
    return { ok: true };
  }

  await prisma.workExperience.delete({ where: { id } });

  await audit({
    actorId: actor.id,
    action: "WORK_EXPERIENCE_REMOVED",
    entityType: "WorkExperience",
    entityId: id,
    metadata: { role: existing.role, organization: existing.organization },
  });

  revalidatePath("/profiel/bewerken");
  revalidatePath(`/zzp/${profile.id}`);
  return { ok: true };
}
