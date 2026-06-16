"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole, AuthorizationError } from "@/lib/authz";
import { hasTenant } from "@/lib/tenancy";
import { audit } from "@/lib/audit";
import { generateTempPassword } from "@/lib/onboarding/password";
import { availabilitySchema } from "@/lib/enums";
import { computeFreelancerCompleteness } from "@/lib/profile";

const schema = z.object({
  name: z.string().trim().min(2, "Naam is te kort.").max(120),
  email: z.string().trim().toLowerCase().email("Ongeldig e-mailadres."),
  headline: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(120).optional(),
  hourlyRate: z.coerce.number().int().min(0).max(100000).optional(),
  availability: availabilitySchema.default("UNKNOWN"),
});

export type ZzperState =
  | { ok: true; email: string; tempPassword: string; name: string }
  | { error: string; fieldErrors?: Record<string, string> }
  | undefined;

/** Franchiser brengt een ZZP'er (FREELANCER) in zijn roster (tenant). */
export async function createZzper(_prev: ZzperState, formData: FormData): Promise<ZzperState> {
  let actor;
  try {
    actor = await requireRole("FRANCHISER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }
  if (!hasTenant(actor)) return { error: "Geen bemiddeling gekoppeld." };

  const rawRate = formData.get("hourlyRate");
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    headline: formData.get("headline") || undefined,
    bio: formData.get("bio") || undefined,
    location: formData.get("location") || undefined,
    hourlyRate: rawRate ? rawRate : undefined,
    availability: formData.get("availability") || "UNKNOWN",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path[0];
      if (typeof k === "string" && !fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }
  const { name, email, headline, bio, location, hourlyRate, availability } = parsed.data;

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return { error: "Er bestaat al een account met dit e-mailadres.", fieldErrors: { email: "Al in gebruik." } }; // prettier-ignore
  }

  // Alleen bestaande skills koppelen (defensief tegen gemanipuleerde input).
  const requestedSkillIds = formData.getAll("skillIds").map(String).filter(Boolean);
  const validSkills = requestedSkillIds.length
    ? await prisma.skill.findMany({
        where: { id: { in: requestedSkillIds } },
        select: { id: true },
      })
    : [];
  const skillIds = validSkills.map((s) => s.id);

  const completeness = computeFreelancerCompleteness({
    headline: headline ?? null,
    bio: bio ?? null,
    hourlyRate: hourlyRate ?? null,
    location: location ?? null,
    availability,
    languages: [],
    skillCount: skillIds.length,
    industryCount: 0,
  }).score;

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const tenantId = actor.tenantId;

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "FREELANCER",
      status: "ACTIVE",
      mustChangePassword: true,
      tenantId,
      freelancerProfile: {
        create: {
          headline: headline ?? null,
          bio: bio ?? null,
          location: location ?? null,
          hourlyRate: hourlyRate ?? null,
          availability,
          visibility: "PUBLIC",
          completeness,
          tenantId,
          skills: skillIds.length ? { create: skillIds.map((id) => ({ skillId: id })) } : undefined,
        },
      },
    },
  });

  await audit({
    actorId: actor.id,
    action: "FRANCHISE_FREELANCER_ADDED",
    entityType: "FreelancerProfile",
    entityId: email,
    metadata: { tenantId, name, skills: skillIds.length, availability },
  });

  revalidatePath("/franchise/zzpers");
  return { ok: true, email, tempPassword, name };
}
