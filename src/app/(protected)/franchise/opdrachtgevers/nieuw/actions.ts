"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole, AuthorizationError } from "@/lib/authz";
import { assertSameTenant } from "@/lib/tenancy";
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
  if (!company) return { error: "Opdrachtgever niet gevonden." };
  try {
    assertSameTenant(actor, company.tenantId);
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }
  const parsed = afdSchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ongeldige invoer." };

  await prisma.department.create({
    data: { companyId, name: parsed.data.name, location: parsed.data.location ?? null },
  });
  revalidatePath(WIZARD);
  return {};
}

/** Stap 2: verwijder een zojuist toegevoegde afdeling. */
export async function removeAfdelingStep(departmentId: string): Promise<void> {
  const actor = await requireRole("FRANCHISER");
  const dept = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { company: { select: { tenantId: true } } },
  });
  if (!dept) return;
  assertSameTenant(actor, dept.company.tenantId);
  await prisma.department.delete({ where: { id: departmentId } });
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
