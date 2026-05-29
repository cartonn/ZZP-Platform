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
  CascadeError,
} from "@/lib/cascade/commands";
import { prisma } from "@/lib/db";
import { eurosToCents } from "@/lib/invoices";

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

  try {
    // Snapshot het uurtarief uit de samenwerking (server-side waarheid).
    const col = await prisma.collaboration.findUnique({ where: { id: collaborationId }, select: { rate: true } });
    const rateCents = col?.rate != null ? col.rate * 100 : null;

    const id = await createPerformance(actor, {
      collaborationId,
      type,
      hours: type === "HOURS" ? Number(formData.get("hours") ?? 0) : null,
      rateCents: type === "HOURS" ? rateCents : null,
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
