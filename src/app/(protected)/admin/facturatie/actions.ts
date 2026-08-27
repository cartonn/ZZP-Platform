"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { type PlatformBillingStatus, platformBillingStatusSchema } from "@/lib/enums";
import {
  assertPlatformBillingTransition,
  PlatformBillingTransitionError,
} from "@/lib/platform-billing/billing";
import { generatePlatformBilling } from "@/lib/platform-billing/billing-run";

/**
 * Grensvalidatie voor {@link setBillingStatusAction}. De server-action is direct aanroepbaar
 * (via `.bind` in de UI, maar ook los door elke ADMIN met geknutselde args), dus valideren we
 * `id`/`to` aan de grens vóór de DB-lookup — conform architectuurregel #2
 * (auth→rol→ownership→Zod→actie→audit), gelijk aan de zusters `changeCollaborationStatus`/
 * `judgeNoShowReport`. Een niet-enum `to` of leeg `id` wordt zo een nette weigering.
 */
const setBillingStatusInput = z.object({
  id: z.string().trim().min(1),
  to: platformBillingStatusSchema,
});

/** Bundelt alle openstaande bijdragen tot nieuwe DRAFT-facturen (idempotent). */
export async function generateBillingAction(): Promise<void> {
  const actor = await requireRole("ADMIN");
  const result = await generatePlatformBilling({});
  await audit({
    actorId: actor.id,
    action: "PLATFORM_BILLING_GENERATED",
    entityType: "PlatformBillingInvoice",
    entityId: "run",
    metadata: {
      tenantInvoices: result.tenantInvoices,
      membershipInvoices: result.membershipInvoices,
      totalCents: result.totalCents,
    },
  });
  revalidatePath("/admin/facturatie");
  // Zichtbare terugkoppeling: hoeveel facturen er zijn aangemaakt (of 0).
  const made = result.tenantInvoices + result.membershipInvoices;
  redirect(`/admin/facturatie?gegenereerd=${made}`);
}

/**
 * Zet de status van een platformfactuur (DRAFT→SENT→PAID/CANCELLED). Server-side waarheid via de
 * transitiemap; zet de bijbehorende tijdstempel. Dit is de plek waar later een Stripe/Mollie-webhook
 * op aansluit (SENT zodra verstuurd, PAID zodra de betaling binnen is).
 */
export async function setBillingStatusAction(id: string, to: PlatformBillingStatus): Promise<void> {
  const actor = await requireRole("ADMIN");

  const parsed = setBillingStatusInput.safeParse({ id, to });
  if (!parsed.success) throw new Error("Ongeldige invoer.");
  const { id: invoiceId, to: nextStatus } = parsed.data;

  const inv = await prisma.platformBillingInvoice.findUnique({
    where: { id: invoiceId },
    select: { status: true },
  });
  if (!inv) throw new Error("Factuur niet gevonden.");

  const from = inv.status as PlatformBillingStatus;
  try {
    assertPlatformBillingTransition(from, nextStatus);
  } catch (e) {
    if (e instanceof PlatformBillingTransitionError) throw new Error(e.message);
    throw e;
  }

  // CANCELLED intrekt de factuur én GEEFT de gebundelde bijdragen terug aan de facturatie-run.
  // De billing-run zet de gebundelde fees/abonnementsbijdragen op INVOICED met een `invoiceId`;
  // een volgende run pakt alleen nog `PENDING`-rijen. Zonder deze terugzet blijven de regels dus
  // hangen op een geannuleerde (niet-live) factuur en worden ze NOOIT opnieuw gefactureerd →
  // structureel omzetlek voor de franchise/het platform (geld-integriteit, CLAUDE.md regel 1: een
  // reversal draait álles terug). We doen dit atomair in één transactie, achter dezelfde
  // concurrency-guard: alleen als de factuur nog exact `from` is, en we geven alleen de rijen terug
  // die daadwerkelijk aan déze factuur gebonden zijn (`invoiceId`, status INVOICED). De append-only
  // "een fee verdwijnt nooit"-regel blijft gerespecteerd: de fee verdwijnt niet, hij keert terug
  // naar PENDING om alsnog correct gefactureerd te worden.
  if (nextStatus === "CANCELLED") {
    const released = await prisma.$transaction(async (tx) => {
      const flip = await tx.platformBillingInvoice.updateMany({
        where: { id: invoiceId, status: from },
        data: { status: nextStatus },
      });
      if (flip.count === 0) return null;
      const fees = await tx.collaborationFee.updateMany({
        where: { invoiceId, status: "INVOICED" },
        data: { invoiceId: null, status: "PENDING" },
      });
      const charges = await tx.zzpMembershipCharge.updateMany({
        where: { invoiceId, status: "INVOICED" },
        data: { invoiceId: null, status: "PENDING" },
      });
      return { fees: fees.count, charges: charges.count };
    });
    if (!released) throw new Error("Deze factuur is intussen al bijgewerkt.");
    await audit({
      actorId: actor.id,
      action: "PLATFORM_BILLING_STATUS_SET",
      entityType: "PlatformBillingInvoice",
      entityId: invoiceId,
      metadata: {
        to: nextStatus,
        releasedFees: released.fees,
        releasedCharges: released.charges,
      },
    });
    revalidatePath("/admin/facturatie");
    return;
  }

  // Concurrency-guard (zoals de verificatieflow): de overgang slaagt alleen als de status nog
  // exact `from` is. Zo kunnen twee gelijktijdige beslissingen (twee tabs, of straks een
  // betaalprovider-webhook + admin-klik) niet allebei dezelfde transitie doorzetten.
  const res = await prisma.platformBillingInvoice.updateMany({
    where: { id: invoiceId, status: from },
    data: {
      status: nextStatus,
      ...(nextStatus === "SENT" ? { issuedAt: new Date() } : {}),
      ...(nextStatus === "PAID" ? { paidAt: new Date() } : {}),
    },
  });
  if (res.count === 0) throw new Error("Deze factuur is intussen al bijgewerkt.");
  await audit({
    actorId: actor.id,
    action: "PLATFORM_BILLING_STATUS_SET",
    entityType: "PlatformBillingInvoice",
    entityId: invoiceId,
    metadata: { to: nextStatus },
  });
  revalidatePath("/admin/facturatie");
}
