"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole, AuthorizationError } from "@/lib/authz";
import { assertSameTenant, hasTenant } from "@/lib/tenancy";
import { audit } from "@/lib/audit";
import { credentialTypeSchema } from "@/lib/enums";

const schema = z
  .object({
    departmentId: z.string().min(1, "Kies een afdeling."),
    title: z.string().trim().min(3, "Titel is te kort.").max(160),
    description: z.string().trim().min(10, "Geef een korte omschrijving.").max(5000),
    location: z.string().trim().max(120).optional(),
    workMode: z.enum(["REMOTE", "ONSITE", "HYBRID"]).default("ONSITE"),
    startDate: z.string().trim().optional(),
    rateMin: z.coerce.number().int().min(0).max(100000).optional(),
    rateMax: z.coerce.number().int().min(0).max(100000).optional(),
  })
  .refine((d) => d.rateMin == null || d.rateMax == null || d.rateMin <= d.rateMax, {
    message: "Het minimumtarief mag niet hoger zijn dan het maximum.",
    path: ["rateMax"],
  });

export type DienstState =
  | { ok: true; title: string }
  | { error: string; fieldErrors?: Record<string, string> }
  | undefined;

/** Franchiser zet een dienst (opdracht) uit namens een opdrachtgever, gekoppeld aan een afdeling. */
export async function createDienst(_prev: DienstState, formData: FormData): Promise<DienstState> {
  let actor;
  try {
    actor = await requireRole("FRANCHISER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }
  if (!hasTenant(actor)) return { error: "Geen franchise gekoppeld." };

  const rawMin = formData.get("rateMin");
  const rawMax = formData.get("rateMax");
  const parsed = schema.safeParse({
    departmentId: formData.get("departmentId"),
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location") || undefined,
    workMode: formData.get("workMode") || "ONSITE",
    startDate: formData.get("startDate") || undefined,
    rateMin: rawMin ? rawMin : undefined,
    rateMax: rawMax ? rawMax : undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path[0];
      if (typeof k === "string" && !fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }
  const { departmentId, title, description, location, workMode, startDate, rateMin, rateMax } =
    parsed.data;

  // Alleen bestaande skills en geldige certificaattypes koppelen (defensief tegen gemanipuleerde input).
  const requestedSkillIds = formData.getAll("skillIds").map(String).filter(Boolean);
  const validSkills = requestedSkillIds.length
    ? await prisma.skill.findMany({
        where: { id: { in: requestedSkillIds } },
        select: { id: true },
      })
    : [];
  const skillIds = validSkills.map((s) => s.id);
  const credentialTypes = [
    ...new Set(
      formData
        .getAll("credentialTypes")
        .map(String)
        .filter((t) => credentialTypeSchema.safeParse(t).success),
    ),
  ];

  // De afdeling (en daarmee de opdrachtgever) moet in de eigen tenant zitten.
  const dept = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { companyId: true, company: { select: { tenantId: true } } },
  });
  if (!dept)
    return { error: "Afdeling niet gevonden.", fieldErrors: { departmentId: "Onbekend." } };
  try {
    assertSameTenant(actor, dept.company.tenantId);
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const job = await prisma.job.create({
    data: {
      companyId: dept.companyId,
      tenantId: actor.tenantId,
      departmentId,
      title,
      description,
      status: "PUBLISHED",
      publishedAt: new Date(),
      workMode,
      location: location ?? null,
      startDate: startDate ? new Date(startDate) : null,
      rateMin: rateMin ?? null,
      rateMax: rateMax ?? null,
      skills: skillIds.length ? { create: skillIds.map((id) => ({ skillId: id })) } : undefined,
      credentialRequirements: credentialTypes.length
        ? { create: credentialTypes.map((credentialType) => ({ credentialType })) }
        : undefined,
    },
  });

  await audit({
    actorId: actor.id,
    action: "FRANCHISE_DIENST_PUBLISHED",
    entityType: "Job",
    entityId: job.id,
    metadata: {
      tenantId: actor.tenantId,
      departmentId,
      companyId: dept.companyId,
      skills: skillIds.length,
      credentials: credentialTypes.length,
    },
  });

  revalidatePath("/franchise/diensten");
  return { ok: true, title };
}
