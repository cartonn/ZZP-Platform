"use server";

import { revalidatePath } from "next/cache";
import { requireRole, assertOwnership, AuthorizationError } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { computeFreelancerCompleteness } from "@/lib/profile";
import { freelancerProfileSchema } from "@/lib/validation";

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

  const languages = String(formData.get("languages") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const parsed = freelancerProfileSchema.safeParse({
    headline: formData.get("headline") || undefined,
    bio: formData.get("bio") || undefined,
    hourlyRate: formData.get("hourlyRate") ?? "",
    location: formData.get("location") || undefined,
    availability: formData.get("availability"),
    workMode: formData.get("workMode"),
    languages,
    kvkNumber: formData.get("kvkNumber") || undefined,
    btwNumber: formData.get("btwNumber") || undefined,
    visibility: formData.get("visibility"),
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
    prisma.skill.findMany({ where: { id: { in: data.skillIds } }, select: { id: true } }),
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
        languages: data.languages.length ? JSON.stringify(data.languages) : null,
        kvkNumber: data.kvkNumber ?? null,
        btwNumber: data.btwNumber ?? null,
        visibility: data.visibility,
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

  revalidatePath("/profiel");
  revalidatePath(`/zzp/${profile.id}`);
  return { ok: true };
}
