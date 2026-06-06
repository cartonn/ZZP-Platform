"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole, AuthorizationError } from "@/lib/authz";
import { assertSameTenant, hasTenant } from "@/lib/tenancy";
import { audit } from "@/lib/audit";
import { generateTempPassword } from "@/lib/onboarding/password";
import { createFranchiseDienst } from "@/lib/franchise/dienst";

const createSchema = z.object({
  companyName: z.string().trim().min(2, "Naam is te kort.").max(160),
  contactName: z.string().trim().min(2, "Contactnaam is te kort.").max(120),
  email: z.string().trim().toLowerCase().email("Ongeldig e-mailadres."),
  location: z.string().trim().max(120).optional(),
  departments: z.string().max(2000).optional(), // één afdeling per regel
});

export type OpdrachtgeverState =
  | { ok: true; email: string; tempPassword: string; companyName: string; companyId: string }
  | { error: string; fieldErrors?: Record<string, string> }
  | undefined;

/** Franchiser brengt een opdrachtgever (CLIENT) + bedrijf (+ optionele afdelingen) in zijn tenant. */
export async function createOpdrachtgever(
  _prev: OpdrachtgeverState,
  formData: FormData,
): Promise<OpdrachtgeverState> {
  let actor;
  try {
    actor = await requireRole("FRANCHISER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }
  if (!hasTenant(actor)) return { error: "Geen franchise gekoppeld." };

  const parsed = createSchema.safeParse({
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    location: formData.get("location") || undefined,
    departments: formData.get("departments") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path[0];
      if (typeof k === "string" && !fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }
  const { companyName, contactName, email, location, departments } = parsed.data;

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return { error: "Er bestaat al een account met dit e-mailadres.", fieldErrors: { email: "Al in gebruik." } }; // prettier-ignore
  }

  const deptNames = (departments ?? "")
    .split("\n")
    .map((d) => d.trim())
    .filter(Boolean)
    .slice(0, 30);

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const tenantId = actor.tenantId;

  const created = await prisma.user.create({
    data: {
      name: contactName,
      email,
      passwordHash,
      role: "CLIENT",
      status: "ACTIVE",
      mustChangePassword: true,
      tenantId,
      company: {
        create: {
          name: companyName,
          location: location ?? null,
          tenantId,
          departments: deptNames.length
            ? { create: deptNames.map((name) => ({ name })) }
            : undefined,
        },
      },
    },
    select: { company: { select: { id: true } } },
  });
  const companyId = created.company!.id;

  await audit({
    actorId: actor.id,
    action: "FRANCHISE_CLIENT_ADDED",
    entityType: "Company",
    entityId: companyId,
    metadata: { tenantId, companyName, departments: deptNames.length },
  });

  revalidatePath("/franchise/opdrachtgevers");
  return { ok: true, email, tempPassword, companyName, companyId };
}

const deptSchema = z.object({
  name: z.string().trim().min(2, "Naam is te kort.").max(120),
  location: z.string().trim().max(120).optional(),
});
export type DepartmentState = { error?: string } | undefined;

/** Voeg een afdeling toe aan een opdrachtgever binnen de eigen tenant. */
export async function addDepartment(
  companyId: string,
  _prev: DepartmentState,
  formData: FormData,
): Promise<DepartmentState> {
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
  const parsed = deptSchema.safeParse({
    name: formData.get("name"),
    location: formData.get("location") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ongeldige invoer." };

  await prisma.department.create({
    data: { companyId, name: parsed.data.name, location: parsed.data.location ?? null },
  });
  revalidatePath(`/franchise/opdrachtgevers/${companyId}`);
  return {};
}

/** Verwijder een afdeling (de bijbehorende diensten verliezen hun afdeling, niet de opdracht zelf). */
export async function removeDepartment(departmentId: string): Promise<void> {
  const actor = await requireRole("FRANCHISER");
  const dept = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { companyId: true, company: { select: { tenantId: true } } },
  });
  if (!dept) return;
  assertSameTenant(actor, dept.company.tenantId);
  await prisma.department.delete({ where: { id: departmentId } });
  revalidatePath(`/franchise/opdrachtgevers/${dept.companyId}`);
}

export type DienstInlineState =
  | { ok: true; title: string }
  | { error: string; fieldErrors?: Record<string, string> }
  | undefined;

/**
 * Zet vanuit de opdrachtgever-cockpit een dienst (opdracht) uit op één afdeling. Deelt de volledige
 * dienst-logica (validatie, skills, certificaten, tarief) met de diensten-pagina via
 * createFranchiseDienst en hervalideert de opdrachtgever-detailpagina.
 */
export async function publishDienst(
  departmentId: string,
  _prev: DienstInlineState,
  formData: FormData,
): Promise<DienstInlineState> {
  let actor;
  try {
    actor = await requireRole("FRANCHISER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const res = await createFranchiseDienst({ actor, departmentId, formData });
  if ("error" in res) return res;

  revalidatePath(`/franchise/opdrachtgevers/${res.companyId}`);
  revalidatePath("/franchise/diensten");
  return { ok: true, title: res.title };
}
