"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { AuthorizationError, requireRole } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import {
  assertInvoiceTransition,
  eurosToCents,
  formatInvoiceNumber,
  InvoiceTransitionError,
  invoiceCentsWithinInt4,
  invoiceTotalCents,
} from "@/lib/invoices";
import { type InvoiceStatus } from "@/lib/enums";
import { type InvoiceLifecycleState } from "@/lib/lifecycles";
import { invoiceLineSchema } from "@/lib/validation";
import { canSendPaymentReminder } from "@/lib/manual-payment-reminder";
import { plural } from "@/lib/plural";

export type InvoiceState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

export type ReminderState = { error?: string; message?: string } | undefined;

interface ParsedLine {
  description: string;
  quantity: number;
  unitCents: number;
  amountCents: number;
}

function parseLines(formData: FormData): { lines: ParsedLine[]; error?: string } {
  const descriptions = formData.getAll("lineDescription").map(String);
  const quantities = formData.getAll("lineQuantity").map(String);
  const units = formData.getAll("lineUnit").map(String);

  const lines: ParsedLine[] = [];
  for (let i = 0; i < descriptions.length; i++) {
    if (!descriptions[i]?.trim()) continue; // lege regel overslaan
    const unitEuros = Number(units[i]);
    const parsed = invoiceLineSchema.safeParse({
      description: descriptions[i],
      quantity: quantities[i],
      unitCents: Number.isFinite(unitEuros) ? eurosToCents(unitEuros) : NaN,
    });
    if (!parsed.success) return { lines: [], error: `Controleer regel ${i + 1}.` };
    lines.push({ ...parsed.data, amountCents: parsed.data.quantity * parsed.data.unitCents });
  }
  if (lines.length === 0) return { lines: [], error: "Voeg minstens één factuurregel toe." };
  // De losse regels blijven binnen int4 (invoiceLineSchema), maar hun som kan het plafond alsnog
  // overschrijden → klem het factuurtotaal vóór de DB-write (server-side waarheid).
  if (!invoiceCentsWithinInt4(invoiceTotalCents(lines)))
    return {
      lines: [],
      error: "Het totaalbedrag van de factuur is te hoog (maximaal € 21.474.836).",
    };
  return { lines };
}

async function loadOwnedCollaboration(actorId: string, collaborationId: string) {
  const collaboration = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    include: { freelancer: { select: { userId: true } }, company: { select: { userId: true } } },
  });
  if (!collaboration || collaboration.freelancer.userId !== actorId) return null;
  return collaboration;
}

export async function createInvoice(
  collaborationId: string,
  _prev: InvoiceState,
  formData: FormData,
): Promise<InvoiceState> {
  let actor;
  try {
    actor = await requireRole("FREELANCER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const collaboration = await loadOwnedCollaboration(actor.id, collaborationId);
  if (!collaboration) return { error: "Samenwerking niet gevonden." };

  // Dubbele-facturatie-gate (server-side waarheid): als deze samenwerking de uren-/prestatie-cascade
  // gebruikt (een prestatie of een cascade-factuur), mag er geen losse factuur bij — die loopt daar.
  const [performanceCount, cascadeInvoiceCount] = await Promise.all([
    prisma.performance.count({ where: { collaborationId } }),
    prisma.invoice.count({ where: { collaborationId, lifecycleStatus: { not: null } } }),
  ]);
  if (performanceCount > 0 || cascadeInvoiceCount > 0) {
    return {
      error:
        "Deze samenwerking factureert via de uren- en prestatieflow. Maak de factuur daar aan, niet los.",
    };
  }

  const { lines, error } = parseLines(formData);
  if (error) return { error };

  const dueRaw = String(formData.get("dueAt") ?? "");
  // Datum-only veld als einde-van-de-dag interpreteren (voorkomt een dag te vroeg "verlopen").
  const dueAt = dueRaw ? new Date(`${dueRaw}T23:59:59`) : null;
  if (dueAt && Number.isNaN(dueAt.getTime())) return { fieldErrors: { dueAt: "Ongeldige datum." } };

  const year = new Date().getFullYear();
  const lineData = lines.map((l) => ({
    description: l.description,
    quantity: l.quantity,
    unitCents: l.unitCents,
    amountCents: l.amountCents,
  }));
  const totalCents = invoiceTotalCents(lines);

  // Factuurnummer is @unique; bij gelijktijdig aanmaken kan het botsen -> retry met hertelling.
  let invoice: { id: string; number: string } | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const seq = (await prisma.invoice.count({ where: { number: { startsWith: `${year}-` } } })) + 1;
    const number = formatInvoiceNumber(year, seq);
    try {
      invoice = await prisma.invoice.create({
        data: {
          collaborationId,
          number,
          status: "DRAFT",
          dueAt,
          totalCents,
          lines: { create: lineData },
        },
        select: { id: true, number: true },
      });
      break;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" && attempt < 4)
        continue;
      throw e;
    }
  }
  if (!invoice) return { error: "Kon geen factuurnummer toewijzen. Probeer het opnieuw." };

  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "INVOICE_CREATED",
      entityType: "Invoice",
      entityId: invoice.id,
      metadata: { number: invoice.number },
    }),
  });

  revalidatePath("/facturen");
  redirect(`/facturen/${invoice.id}`);
}

async function loadInvoiceParty(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      collaboration: {
        include: {
          freelancer: { select: { userId: true } },
          company: { select: { userId: true } },
        },
      },
    },
  });
  return invoice;
}

export async function sendInvoice(invoiceId: string): Promise<void> {
  const actor = await requireRole("FREELANCER");
  const invoice = await loadInvoiceParty(invoiceId);
  if (!invoice || invoice.collaboration?.freelancer.userId !== actor.id)
    throw new Error("Factuur niet gevonden.");

  const from = invoice.status as InvoiceStatus;
  try {
    assertInvoiceTransition(from, "SENT");
  } catch (e) {
    if (e instanceof InvoiceTransitionError) throw new Error(e.message);
    throw e;
  }

  const dueAt = invoice.dueAt ?? new Date(Date.now() + 14 * 86400_000); // standaard 14 dagen
  await prisma.$transaction([
    prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "SENT", issuedAt: new Date(), dueAt },
    }),
    prisma.notification.create({
      data: {
        userId: invoice.collaboration!.company.userId,
        type: "INVOICE_SENT",
        title: "Nieuwe factuur ontvangen",
        body: `Factuur ${invoice.number}.`,
        link: "/facturen",
      },
    }),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "INVOICE_SENT",
        entityType: "Invoice",
        entityId: invoiceId,
      }),
    }),
  ]);
  revalidatePath("/facturen");
  revalidatePath(`/facturen/${invoiceId}`);
}

export async function markInvoicePaid(invoiceId: string): Promise<void> {
  const actor = await requireRole("CLIENT");
  const invoice = await loadInvoiceParty(invoiceId);
  if (!invoice || invoice.collaboration?.company.userId !== actor.id)
    throw new Error("Factuur niet gevonden.");

  const from = invoice.status as InvoiceStatus;
  // Een verlopen factuur staat in de DB nog als SENT; PAID is vanuit beide geldig.
  try {
    assertInvoiceTransition(from, "PAID");
  } catch (e) {
    if (e instanceof InvoiceTransitionError) throw new Error(e.message);
    throw e;
  }

  await prisma.$transaction([
    prisma.invoice.update({ where: { id: invoiceId }, data: { status: "PAID" } }),
    prisma.notification.create({
      data: {
        userId: invoice.collaboration!.freelancer.userId,
        type: "INVOICE_PAID",
        title: "Factuur betaald",
        body: `Factuur ${invoice.number} is als betaald gemarkeerd.`,
        link: "/facturen",
      },
    }),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "INVOICE_PAID",
        entityType: "Invoice",
        entityId: invoiceId,
      }),
    }),
  ]);
  revalidatePath("/facturen");
  revalidatePath(`/facturen/${invoiceId}`);
}

/**
 * Handmatige betaalherinnering (crediteur → opdrachtgever). De ZZP'er stuurt vanaf een openstaande,
 * verzonden factuur eenmalig per afkoelperiode een in-platform nudge — náást de automatische
 * aanmaningsladder (`payment-reminders.ts`). Keten: auth → rol (FREELANCER) → ownership (uitschrijver)
 * → server-herbevestiging dat de factuur écht op betaling wacht + afkoelperiode (uit het auditlogboek)
 * → notify + audit. Geen geldstroom (Besluit 1): status­registratie + signalering, geen incasso.
 */
export async function sendPaymentReminder(
  invoiceId: string,
  _prev: ReminderState,
  _formData: FormData,
): Promise<ReminderState> {
  let actor;
  try {
    actor = await requireRole("FREELANCER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const invoice = await loadInvoiceParty(invoiceId);
  if (!invoice || invoice.collaboration?.freelancer.userId !== actor.id)
    return { error: "Factuur niet gevonden." };

  // Afkoelperiode: het tijdstip van de laatste handmatige herinnering uit het auditlogboek
  // (de audit is de bron van waarheid, geen extra kolom nodig).
  const last = await prisma.auditLog.findFirst({
    where: { action: "INVOICE_REMINDER_SENT", entityId: invoiceId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const eligibility = canSendPaymentReminder({
    isFreelancerOwner: true,
    status: invoice.status,
    lifecycleStatus: invoice.lifecycleStatus as InvoiceLifecycleState | null,
    issuedAt: invoice.issuedAt,
    dueAt: invoice.dueAt,
    lastReminderAt: last?.createdAt ?? null,
  });
  if (!eligibility.eligible) {
    if (eligibility.reason === "cooldown" && eligibility.nextAllowedAt)
      return {
        error: `Je hebt onlangs al herinnerd. Probeer het na ${eligibility.nextAllowedAt.toLocaleDateString("nl-NL")}.`,
      };
    return { error: "Je kunt nu geen herinnering sturen voor deze factuur." };
  }

  const num = invoice.partyInvoiceNumber ?? invoice.number;
  const body =
    eligibility.daysOverdue > 0
      ? `Factuur ${num} is ${plural(eligibility.daysOverdue, "dag", "dagen")} over de vervaldag. Betaal rechtstreeks aan de ZZP'er en markeer de betaling.`
      : `Factuur ${num} staat open. Betaal rechtstreeks aan de ZZP'er en markeer de betaling.`;

  await prisma.$transaction([
    prisma.notification.create({
      data: {
        userId: invoice.collaboration.company.userId,
        type: "PAYMENT_REMINDER",
        title: "Betaalherinnering",
        body,
        link: "/facturen",
      },
    }),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "INVOICE_REMINDER_SENT",
        entityType: "Invoice",
        entityId: invoiceId,
        metadata: { daysOverdue: eligibility.daysOverdue },
      }),
    }),
  ]);

  revalidatePath("/facturen");
  revalidatePath(`/facturen/${invoiceId}`);
  return { message: "Herinnering verstuurd." };
}

export async function cancelInvoice(invoiceId: string): Promise<void> {
  const actor = await requireRole("FREELANCER");
  const invoice = await loadInvoiceParty(invoiceId);
  if (!invoice || invoice.collaboration?.freelancer.userId !== actor.id)
    throw new Error("Factuur niet gevonden.");

  const from = invoice.status as InvoiceStatus;
  try {
    assertInvoiceTransition(from, "CANCELLED");
  } catch (e) {
    if (e instanceof InvoiceTransitionError) throw new Error(e.message);
    throw e;
  }

  await prisma.$transaction([
    prisma.invoice.update({ where: { id: invoiceId }, data: { status: "CANCELLED" } }),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "INVOICE_CANCELLED",
        entityType: "Invoice",
        entityId: invoiceId,
      }),
    }),
  ]);
  revalidatePath("/facturen");
  revalidatePath(`/facturen/${invoiceId}`);
}
