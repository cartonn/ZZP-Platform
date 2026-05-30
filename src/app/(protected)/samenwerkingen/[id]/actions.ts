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
import { type OrtCategory } from "@/lib/config";

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

export async function logAndSubmitPerformanceAction(collaborationId: string, formData: FormData): Promise<void> {
  const actor = await requireActor();
  const type = formData.get("type") === "MILESTONE" ? "MILESTONE" : "HOURS";
  const description = String(formData.get("description") ?? "").slice(0, 500);

  const periodStartRaw = type === "HOURS" ? String(formData.get("periodStart") ?? "").trim() : "";
  const periodEndRaw = type === "HOURS" ? String(formData.get("periodEnd") ?? "").trim() : "";
  const periodStart = periodStartRaw ? new Date(periodStartRaw) : null;
  const periodEnd = periodEndRaw ? new Date(periodEndRaw) : null;

  // ORT-segmenten (zorg): uren per tijdscategorie. Leeg/0 → geen segment.
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

  try {
    // Snapshot het uurtarief uit de samenwerking (server-side waarheid).
    const col = await prisma.collaboration.findUnique({ where: { id: collaborationId }, select: { rate: true } });
    const rateCents = col?.rate != null ? col.rate * 100 : null;

    const id = await createPerformance(actor, {
      collaborationId,
      type,
      // Bij ORT is het totaal de som van de segment-uren; anders het ingevoerde urenveld.
      hours: type === "HOURS" ? (useOrt ? ortSegments.reduce((s, x) => s + x.hours, 0) : Number(formData.get("hours") ?? 0)) : null,
      rateCents: type === "HOURS" ? rateCents : null,
      ortSegments: useOrt ? ortSegments : null,
      periodStart: type === "HOURS" ? periodStart : null,
      periodEnd: type === "HOURS" ? periodEnd : null,
      amountCents: type === "MILESTONE" ? eurosToCents(Number(formData.get("amount") ?? 0)) : null,
      milestoneTitle: type === "MILESTONE" ? String(formData.get("milestoneTitle") ?? "") : null,
      description,
    });
    await submitPerformance(actor, id);
  } catch (e) {
    toMessage(e);
  }
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
