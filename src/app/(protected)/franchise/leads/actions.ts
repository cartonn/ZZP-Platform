"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, AuthorizationError } from "@/lib/authz";
import { assertSameTenant, hasTenant } from "@/lib/tenancy";
import { audit } from "@/lib/audit";
import { leadStatusSchema, type LeadStatus } from "@/lib/enums";
import { canLeadTransition, leadStatusRequiresReason, LEAD_STATUS_LABEL } from "@/lib/leads";

export type LeadFormState =
  | { ok: true; leadId: string }
  | { error: string; fieldErrors?: Record<string, string> }
  | undefined;

const createSchema = z.object({
  organizationName: z.string().trim().min(2, "Naam is te kort.").max(160),
  contactName: z.string().trim().max(120).optional(),
  email: z
    .union([z.literal(""), z.string().trim().toLowerCase().email("Ongeldig e-mailadres.")])
    .optional()
    .transform((v) => (v ? v : undefined)),
  phone: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(2000).optional(),
});

function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const i of error.issues) {
    const k = i.path[0];
    if (typeof k === "string" && !fieldErrors[k]) fieldErrors[k] = i.message;
  }
  return fieldErrors;
}

/** Franchiser legt een nieuwe acquisitie-lead vast in zijn eigen franchise. */
export async function createLead(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  let actor;
  try {
    actor = await requireRole("FRANCHISER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }
  if (!hasTenant(actor)) return { error: "Geen franchise gekoppeld." };

  const parsed = createSchema.safeParse({
    organizationName: formData.get("organizationName"),
    contactName: formData.get("contactName") || undefined,
    email: formData.get("email") ?? undefined,
    phone: formData.get("phone") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors: fieldErrorsFrom(parsed.error) }; // prettier-ignore
  }
  const { organizationName, contactName, email, phone, notes } = parsed.data;

  const lead = await prisma.lead.create({
    data: {
      tenantId: actor.tenantId,
      organizationName,
      contactName: contactName ?? null,
      email: email ?? null,
      phone: phone ?? null,
      notes: notes ?? null,
    },
    select: { id: true },
  });
  await audit({
    actorId: actor.id,
    action: "LEAD_CREATED",
    entityType: "Lead",
    entityId: lead.id,
    metadata: { tenantId: actor.tenantId, organizationName },
  });

  revalidatePath("/franchise/leads");
  return { ok: true, leadId: lead.id };
}

const reasonSchema = z.string().trim().min(4, "Geef een korte reden.").max(500);

/**
 * Verzet de status van een lead via de expliciete overgangsmap. Afvallen (NO_DEAL) vereist een
 * reden (server-side afgedwongen). Elke geldige overgang belandt als regel in het contactlogboek,
 * zodat de tijdlijn de acquisitie-geschiedenis volledig vertelt. Tenant-scoped.
 */
export async function setLeadStatus(leadId: string, formData: FormData): Promise<void> {
  const actor = await requireRole("FRANCHISER");
  const parsed = leadStatusSchema.safeParse(formData.get("status"));
  if (!parsed.success) return;
  const next = parsed.data;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { status: true, tenantId: true, organizationName: true },
  });
  if (!lead) return; // verwijderd of onbekend id — nette no-op
  assertSameTenant(actor, lead.tenantId);

  const current = lead.status as LeadStatus;
  if (current === next || !canLeadTransition(current, next)) return; // ongeldige sprong → no-op

  let reason: string | null = null;
  if (leadStatusRequiresReason(next)) {
    const r = reasonSchema.safeParse(formData.get("reason"));
    if (!r.success) return; // geen reden → geen afvallen (de UI vraagt erom)
    reason = r.data;
  }

  const logBody = reason
    ? `Status: ${LEAD_STATUS_LABEL[next]} — ${reason}`
    : `Status: ${LEAD_STATUS_LABEL[next]}`;

  await prisma.$transaction([
    prisma.lead.update({ where: { id: leadId }, data: { status: next } }),
    prisma.leadContact.create({ data: { leadId, body: logBody, createdById: actor.id } }),
  ]);
  await audit({
    actorId: actor.id,
    action: "LEAD_STATUS_SET",
    entityType: "Lead",
    entityId: leadId,
    metadata: { from: current, to: next, ...(reason ? { reason } : {}) },
  });

  revalidatePath("/franchise/leads");
  revalidatePath(`/franchise/leads/${leadId}`);
}

const contactSchema = z.string().trim().min(2, "Schrijf een korte notitie.").max(2000);

/**
 * Leest de optionele opvolgdatum uit het formulier. `undefined` = veld niet aanwezig (niet
 * aanraken); `null` = leeg ingevuld (opvolging wissen); een `Date` = nieuwe opvolgdatum. Een
 * ongeldige waarde wordt genegeerd (undefined).
 */
function parseNextFollowUp(formData: FormData): Date | null | undefined {
  if (!formData.has("nextFollowUp")) return undefined;
  const raw = String(formData.get("nextFollowUp") ?? "").trim();
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Voeg een regel toe aan het contactlogboek van een lead (belletje, mail, gesprek). Tenant-scoped. */
export async function addLeadContact(leadId: string, formData: FormData): Promise<void> {
  const actor = await requireRole("FRANCHISER");
  const parsed = contactSchema.safeParse(formData.get("body"));
  if (!parsed.success) return;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { tenantId: true },
  });
  if (!lead) return;
  assertSameTenant(actor, lead.tenantId);

  const nextFollowUp = parseNextFollowUp(formData);
  await prisma.$transaction([
    prisma.leadContact.create({
      data: { leadId, body: parsed.data, createdById: actor.id },
    }),
    ...(nextFollowUp !== undefined
      ? [prisma.lead.update({ where: { id: leadId }, data: { nextFollowUp } })]
      : []),
  ]);
  await audit({
    actorId: actor.id,
    action: "LEAD_CONTACT_ADDED",
    entityType: "Lead",
    entityId: leadId,
  });

  revalidatePath("/franchise/leads");
  revalidatePath(`/franchise/leads/${leadId}`);
}
