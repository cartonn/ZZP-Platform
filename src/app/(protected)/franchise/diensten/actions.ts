"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole, AuthorizationError } from "@/lib/authz";
import { assertSameTenant, hasTenant } from "@/lib/tenancy";
import { audit } from "@/lib/audit";

const schema = z.object({
  departmentId: z.string().min(1, "Kies een afdeling."),
  title: z.string().trim().min(3, "Titel is te kort.").max(160),
  description: z.string().trim().min(10, "Geef een korte omschrijving.").max(5000),
  location: z.string().trim().max(120).optional(),
  workMode: z.enum(["REMOTE", "ONSITE", "HYBRID"]).default("ONSITE"),
  startDate: z.string().trim().optional(),
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

  const parsed = schema.safeParse({
    departmentId: formData.get("departmentId"),
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location") || undefined,
    workMode: formData.get("workMode") || "ONSITE",
    startDate: formData.get("startDate") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path[0];
      if (typeof k === "string" && !fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }
  const { departmentId, title, description, location, workMode, startDate } = parsed.data;

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
    },
  });

  await audit({
    actorId: actor.id,
    action: "FRANCHISE_DIENST_PUBLISHED",
    entityType: "Job",
    entityId: job.id,
    metadata: { tenantId: actor.tenantId, departmentId, companyId: dept.companyId },
  });

  revalidatePath("/franchise/diensten");
  return { ok: true, title };
}
