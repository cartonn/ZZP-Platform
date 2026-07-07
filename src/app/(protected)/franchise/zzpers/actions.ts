"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole, AuthorizationError } from "@/lib/authz";
import { hasTenant } from "@/lib/tenancy";
import { audit, auditData } from "@/lib/audit";
import { generateTempPassword } from "@/lib/onboarding/password";
import { availabilitySchema, credentialTypeSchema, type CredentialType } from "@/lib/enums";
import { computeFreelancerCompleteness } from "@/lib/profile";
import { type FreelancerCredential } from "@/lib/matching";
import {
  reminderDayStart,
  credentialReminderLink,
  outstandingMandatoryTypes,
  franchiseCredentialReminderMessage,
  FRANCHISE_REMINDER_ACTION,
  type FranchiseReminderState,
} from "@/lib/franchise/credential-reminder";

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
    ? // unbounded-allow: skills-referentielijst voor actie
      await prisma.skill.findMany({
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

/** Re-export zodat de knop-component de statustype uit de action-module kan importeren. */
export type ReminderState = FranchiseReminderState;

const reminderSchema = z.object({
  freelancerId: z.string().min(1),
  type: credentialTypeSchema,
});

/**
 * De bemiddelaar herinnert een roster-ZZP'er een ontbrekend/verlopen verplicht bewijsstuk aan te
 * leveren — de franchise-variant van de opdrachtgever-herinnering (#571), zelfde patroon. Keten:
 * auth → rol (FRANCHISER) → ownership (ZZP'er in eigen roster/tenant) → Zod → server-herbevestiging
 * dat het type écht openstaat (verplichte-documenten-status) → dag-idempotentie (max één per
 * ZZP'er+type per kalenderdag) → notify + audit. Server is de waarheid: nooit vertrouwen op de
 * client-side melding, anders kan men om een willekeurig certificaat vragen.
 */
export async function sendFranchiseCredentialReminder(
  freelancerId: string,
  type: string,
  _prev: ReminderState,
  _formData: FormData,
): Promise<ReminderState> {
  let actor;
  try {
    actor = await requireRole("FRANCHISER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }
  const tenantId = actor.tenantId;
  if (!tenantId) return { error: "Geen bemiddeling gekoppeld." };

  const parsed = reminderSchema.safeParse({ freelancerId, type });
  if (!parsed.success) return { error: "Ongeldige herinnering." };
  const reminderType = parsed.data.type as CredentialType;

  // Ownership: de ZZP'er moet in het eigen roster (tenant) zitten.
  const profile = await prisma.freelancerProfile.findFirst({
    where: { id: parsed.data.freelancerId, tenantId },
    select: {
      id: true,
      userId: true,
      credentials: { select: { type: true, status: true, expiresAt: true } },
    },
  });
  if (!profile) return { error: "ZZP'er niet in je roster." };

  // Server is de waarheid: bevestig dat dit verplichte document écht openstaat (ontbrekend/verlopen).
  const credentials: FreelancerCredential[] = profile.credentials.map((c) => ({
    type: c.type as CredentialType,
    status: c.status as FreelancerCredential["status"],
    expiresAt: c.expiresAt,
  }));
  if (!outstandingMandatoryTypes(credentials).includes(reminderType))
    return { error: "Dit document is niet (meer) vereist of al aangeleverd." };

  // Naam van de bemiddeling voor de afzender-tekst.
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });
  const franchiseName = tenant?.name ?? "Je bemiddelaar";

  // Idempotentie: geen spam. Eén herinnering per ZZP'er+type per kalenderdag.
  const dayStart = reminderDayStart(new Date());
  const todayReminders = await prisma.auditLog.findMany({
    where: {
      action: FRANCHISE_REMINDER_ACTION,
      entityType: "FreelancerProfile",
      entityId: profile.id,
      createdAt: { gte: dayStart },
    },
    select: { metadata: true },
    take: 50,
  });
  const alreadyReminded = todayReminders.some((r) => {
    if (!r.metadata) return false;
    try {
      return (JSON.parse(r.metadata) as { type?: string }).type === reminderType;
    } catch {
      return false;
    }
  });
  if (alreadyReminded) return { message: "Je hebt vandaag al herinnerd." };

  const { title, body } = franchiseCredentialReminderMessage(franchiseName, reminderType);
  await prisma.$transaction([
    prisma.notification.create({
      data: {
        userId: profile.userId,
        type: "CREDENTIAL_REMINDER",
        title,
        body,
        link: credentialReminderLink(reminderType),
      },
    }),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: FRANCHISE_REMINDER_ACTION,
        entityType: "FreelancerProfile",
        entityId: profile.id,
        metadata: { type: reminderType, tenantId },
      }),
    }),
  ]);

  revalidatePath("/franchise/zzpers");
  revalidatePath(`/franchise/zzpers/${profile.id}`);
  return { message: "Herinnering verstuurd." };
}
