"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole, AuthorizationError } from "@/lib/authz";
import { ownsViaTenant } from "@/lib/tenancy";
import { audit } from "@/lib/audit";
import { createFranchiseDienst } from "@/lib/franchise/dienst";

// De wizard heeft eigen acties zodat ze de wizard-route hervalideren (de gedeelde cockpit-acties
// hervalideren de detailpagina). De onderliggende logica (afdeling-create, dienst-create) is
// hergebruikt — geen tweede waarheid.
const WIZARD = "/franchise/opdrachtgevers/nieuw";

const afdSchema = z.object({
  name: z.string().trim().min(2, "Naam is te kort.").max(120),
  location: z.string().trim().max(120).optional(),
});

export type WizardAfdelingState = { error?: string } | undefined;

/** Stap 2: voeg een afdeling toe aan de opdrachtgever in onboarding. */
export async function addAfdelingStep(
  companyId: string,
  _prev: WizardAfdelingState,
  formData: FormData,
): Promise<WizardAfdelingState> {
  let actor;
  try {
    actor = await requireRole("FRANCHISER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { tenantId: true },
  });
  // Onbekend id én een opdrachtgever van een ándere tenant geven exact dezelfde melding: zo lekt het
  // verschil "bestaat niet" vs. "bestaat, andere bemiddeling" niet (geen existence-oracle, CWE-203).
  // Spiegelt `addDepartment`/`removeDepartment` in ../actions.ts.
  if (!company || !ownsViaTenant(actor, company.tenantId)) {
    return { error: "Opdrachtgever niet gevonden." };
  }
  const parsed = afdSchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ongeldige invoer." };

  const dept = await prisma.department.create({
    data: { companyId, name: parsed.data.name, location: parsed.data.location ?? null },
  });
  await audit({
    actorId: actor.id,
    action: "FRANCHISE_DEPARTMENT_ADDED",
    entityType: "Department",
    entityId: dept.id,
    metadata: { companyId, tenantId: company.tenantId, name: parsed.data.name },
  });
  revalidatePath(WIZARD);
  return {};
}

/** Stap 2: verwijder een zojuist toegevoegde afdeling. */
export async function removeAfdelingStep(departmentId: string): Promise<void> {
  const actor = await requireRole("FRANCHISER");
  const dept = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { companyId: true, company: { select: { tenantId: true } } },
  });
  // Onbekend id én cross-tenant id → dezelfde stille no-op (geen existence-oracle, geen uncaught
  // AuthorizationError/500). Spiegelt `removeDepartment` in ../actions.ts.
  if (!dept || !ownsViaTenant(actor, dept.company.tenantId)) return;
  await prisma.department.delete({ where: { id: departmentId } });
  await audit({
    actorId: actor.id,
    action: "FRANCHISE_DEPARTMENT_REMOVED",
    entityType: "Department",
    entityId: departmentId,
    metadata: { companyId: dept.companyId, tenantId: dept.company.tenantId },
  });
  revalidatePath(WIZARD);
}

export type WizardDienstState =
  | { ok: true; title: string }
  | { error: string; fieldErrors?: Record<string, string> }
  | undefined;

/** Stap 3: zet een dienst uit (live/PUBLISHED) op een gekozen afdeling van deze opdrachtgever. */
export async function addDienstStep(
  _prev: WizardDienstState,
  formData: FormData,
): Promise<WizardDienstState> {
  let actor;
  try {
    actor = await requireRole("FRANCHISER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }
  const departmentId = String(formData.get("departmentId") ?? "");
  if (!departmentId) {
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors: { departmentId: "Kies een afdeling." } }; // prettier-ignore
  }
  const res = await createFranchiseDienst({ actor, departmentId, formData });
  if ("error" in res) return res;

  revalidatePath(WIZARD);
  return { ok: true, title: res.title };
}
