"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { type PlatformBillingStatus } from "@/lib/enums";
import {
  assertPlatformBillingTransition,
  PlatformBillingTransitionError,
} from "@/lib/platform-billing/billing";
import { generatePlatformBilling } from "@/lib/platform-billing/billing-run";

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
  const inv = await prisma.platformBillingInvoice.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!inv) throw new Error("Factuur niet gevonden.");

  try {
    assertPlatformBillingTransition(inv.status as PlatformBillingStatus, to);
  } catch (e) {
    if (e instanceof PlatformBillingTransitionError) throw new Error(e.message);
    throw e;
  }

  await prisma.platformBillingInvoice.update({
    where: { id },
    data: {
      status: to,
      ...(to === "SENT" ? { issuedAt: new Date() } : {}),
      ...(to === "PAID" ? { paidAt: new Date() } : {}),
    },
  });
  await audit({
    actorId: actor.id,
    action: "PLATFORM_BILLING_STATUS_SET",
    entityType: "PlatformBillingInvoice",
    entityId: id,
    metadata: { to },
  });
  revalidatePath("/admin/facturatie");
}
