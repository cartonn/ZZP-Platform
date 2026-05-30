"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/authz";
import {
  signContract,
  createPerformance,
  submitPerformance,
  approvePerformance,
  rejectPerformance,
  submitInvoice,
  approveInvoice,
  rejectInvoice,
  confirmPayment,
  creditInvoice,
  openDispute,
  resolveDispute,
  CascadeError,
} from "@/lib/cascade/commands";
import { prisma } from "@/lib/db";
import { eurosToCents } from "@/lib/invoices";
import { type OrtSegment } from "@/lib/ort";
import { type OrtCategory, ORT_SECTORS, type OrtSector } from "@/lib/config";
import { validatePerformanceForm, type PerformanceFormData } from "@/lib/validation";

/** Vertaalt een CascadeError/transitiefout naar een leesbare melding; hergooit de rest. */
function toMessage(e: unknown): never {
  if (e instanceof CascadeError) throw new Error(e.message);
  if (e instanceof Error) throw new Error(e.message);
  throw e;
}

function refresh(collaborationId: string) {
  revalidatePath(`/samenwerkingen/${collaborationId}`);
  revalidatePath("/samenwerkingen");
  revalidatePath("/facturen");
}

export async function signContractAction(collaborationId: string): Promise<void> {
  const actor = await requireActor();
  try {
    await signContract(actor, collaborationId);
  } catch (e) {
    toMessage(e);
  }
  refresh(collaborationId);
}

export async function logAndSubmitPerformanceAction(
  collaborationId: string,
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const actor = await requireActor();
  const type = formData.get("type") === "MILESTONE" ? "MILESTONE" : "HOURS";
  const description = String(formData.get("description") ?? "").slice(0, 500);

  const periodStartRaw = type === "HOURS" ? String(formData.get("periodStart") ?? "").trim() : "";
  const periodEndRaw = type === "HOURS" ? String(formData.get("periodEnd") ?? "").trim() : "";
  const periodStart = periodStartRaw ? new Date(periodStartRaw) : null;
  const periodEnd = periodEndRaw ? new Date(periodEndRaw) : null;

  const ortFields: Array<["NORMAL" | OrtCategory, string]> = [
    ["NORMAL", "ort_normal"],
    ["EVENING", "ort_evening"],
    ["NIGHT", "ort_night"],
    ["SATURDAY", "ort_saturday"],
    ["SUNDAY", "ort_sunday"],
    ["HOLIDAY", "ort_holiday"],
  ];
  const ortSegments: OrtSegment[] = ortFields
    .map(([category, field]) => ({ category, hours: Number(formData.get(field) ?? 0) }))
    .filter((s) => s.hours > 0);
  const useOrt = type === "HOURS" && ortSegments.length > 0;

  // Snapshot het uurtarief uit de samenwerking (server-side waarheid).
  const col = await prisma.collaboration.findUnique({ where: { id: collaborationId }, select: { rate: true } });
  const rateCents = col?.rate != null ? col.rate * 100 : null;

  const hours = type === "HOURS" ? (useOrt ? ortSegments.reduce((s, x) => s + x.hours, 0) : Number(formData.get("hours") ?? 0)) : 0;
  const amount = Number(formData.get("amount") ?? 0);
  const milestoneTitle = String(formData.get("milestoneTitle") ?? "");

  const validationError = validatePerformanceForm({
    type,
    hours,
    ortTotal: useOrt ? ortSegments.reduce((s, x) => s + x.hours, 0) : 0,
    hasOrt: useOrt,
    amount,
    milestoneTitle,
    periodStartRaw,
    periodEndRaw,
    rateCents,
  } satisfies PerformanceFormData);
  if (validationError) return validationError;

  try {
    const id = await createPerformance(actor, {
      collaborationId,
      type,
      hours: type === "HOURS" ? hours : null,
      rateCents: type === "HOURS" ? rateCents : null,
      ortSegments: useOrt ? ortSegments : null,
      periodStart: type === "HOURS" ? periodStart : null,
      periodEnd: type === "HOURS" ? periodEnd : null,
      amountCents: type === "MILESTONE" ? eurosToCents(amount) : null,
      milestoneTitle: type === "MILESTONE" ? milestoneTitle : null,
      description,
    });
    await submitPerformance(actor, id);
  } catch (e) {
    if (e instanceof CascadeError) return e.message;
    if (e instanceof Error) return e.message;
    return "Er is een fout opgetreden. Probeer het opnieuw.";
  }
  refresh(collaborationId);
  return null;
}

/**
 * Stelt het ORT-sectorprofiel van de samenwerking in (zorg-CAO). Alleen de opdrachtgever of
 * admin bepaalt de toeslagen (server-side waarheid); de ZZP'er kan ze niet zelf wijzigen.
 * "DEFAULT" wordt als null opgeslagen zodat de berekening op de standaardtarieven terugvalt.
 */
export async function setOrtProfileAction(collaborationId: string, formData: FormData): Promise<void> {
  const actor = await requireActor();
  const raw = String(formData.get("ortProfile") ?? "DEFAULT");
  const sector: OrtSector = (ORT_SECTORS as readonly string[]).includes(raw) ? (raw as OrtSector) : "DEFAULT";

  const col = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    select: { company: { select: { userId: true } } },
  });
  if (!col) throw new Error("Samenwerking niet gevonden.");
  if (actor.role !== "ADMIN" && actor.id !== col.company.userId) {
    throw new Error("Alleen de opdrachtgever kan het ORT-profiel instellen.");
  }

  await prisma.collaboration.update({
    where: { id: collaborationId },
    data: { ortProfile: sector === "DEFAULT" ? null : sector },
  });
  refresh(collaborationId);
}

export async function approvePerformanceAction(performanceId: string, collaborationId: string): Promise<void> {
  const actor = await requireActor();
  try {
    await approvePerformance(actor, performanceId);
  } catch (e) {
    toMessage(e);
  }
  refresh(collaborationId);
}

export async function rejectPerformanceAction(performanceId: string, collaborationId: string, formData: FormData): Promise<void> {
  const actor = await requireActor();
  try {
    await rejectPerformance(actor, performanceId, String(formData.get("reason") ?? ""));
  } catch (e) {
    toMessage(e);
  }
  refresh(collaborationId);
}

export async function submitInvoiceAction(invoiceId: string, collaborationId: string): Promise<void> {
  const actor = await requireActor();
  try {
    await submitInvoice(actor, invoiceId);
  } catch (e) {
    toMessage(e);
  }
  refresh(collaborationId);
}

export async function approveInvoiceAction(invoiceId: string, collaborationId: string): Promise<void> {
  const actor = await requireActor();
  try {
    await approveInvoice(actor, invoiceId);
  } catch (e) {
    toMessage(e);
  }
  refresh(collaborationId);
}

export async function rejectInvoiceAction(invoiceId: string, collaborationId: string, formData: FormData): Promise<void> {
  const actor = await requireActor();
  try {
    await rejectInvoice(actor, invoiceId, String(formData.get("reason") ?? ""));
  } catch (e) {
    toMessage(e);
  }
  refresh(collaborationId);
}

export async function confirmPaymentAction(invoiceId: string, collaborationId: string): Promise<void> {
  const actor = await requireActor();
  try {
    await confirmPayment(actor, invoiceId);
  } catch (e) {
    toMessage(e);
  }
  refresh(collaborationId);
}

export async function creditInvoiceAction(invoiceId: string, collaborationId: string, formData: FormData): Promise<void> {
  const actor = await requireActor();
  try {
    await creditInvoice(actor, invoiceId, String(formData.get("reason") ?? ""));
  } catch (e) {
    toMessage(e);
  }
  refresh(collaborationId);
}

export async function openDisputeAction(collaborationId: string, formData: FormData): Promise<void> {
  const actor = await requireActor();
  try {
    await openDispute(actor, collaborationId, String(formData.get("reason") ?? ""));
  } catch (e) {
    toMessage(e);
  }
  refresh(collaborationId);
}

export async function resolveDisputeAction(collaborationId: string): Promise<void> {
  const actor = await requireActor();
  try {
    await resolveDispute(actor, collaborationId);
  } catch (e) {
    toMessage(e);
  }
  refresh(collaborationId);
}
