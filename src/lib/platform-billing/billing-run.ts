// Facturatie-run: bundelt de openstaande (PENDING) bijdragen tot DRAFT-platformfacturen — per
// franchise(-owner) voor de tenant-fees, per ZZP'er voor het abonnement. De gebundelde bijdragen
// krijgen `invoiceId` + status INVOICED, zodat een volgende run ze niet opnieuw pakt (idempotent).
// Er wordt nog NIETS geïncasseerd: de facturen blijven DRAFT tot een mens/provider ze verstuurt.

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatPlatformInvoiceNumber, summarizeBillingLines } from "@/lib/platform-billing/billing";
import { monthKey } from "@/lib/zzp-membership";

export interface PlatformBillingRunResult {
  tenantInvoices: number;
  membershipInvoices: number;
  totalCents: number;
}

async function nextNumber(tx: Prisma.TransactionClient, year: number): Promise<string> {
  const count = await tx.platformBillingInvoice.count({
    where: { number: { startsWith: `PF-${year}-` } },
  });
  return formatPlatformInvoiceNumber(year, count + 1);
}

export async function generatePlatformBilling(opts?: {
  now?: Date;
}): Promise<PlatformBillingRunResult> {
  const now = opts?.now ?? new Date();
  const year = now.getUTCFullYear();
  const periodLabel = `t/m ${monthKey(now)}`;
  const result: PlatformBillingRunResult = {
    tenantInvoices: 0,
    membershipInvoices: 0,
    totalCents: 0,
  };

  // --- TENANT_FEE: één factuur per franchise met openstaande fees ---
  const tenants = await prisma.collaborationFee.findMany({
    where: { status: "PENDING" },
    select: { tenantId: true },
    distinct: ["tenantId"],
  });
  for (const { tenantId } of tenants) {
    try {
      const created = await prisma.$transaction(async (tx) => {
        const fees = await tx.collaborationFee.findMany({
          where: { tenantId, status: "PENDING" },
          select: { id: true, feeCents: true, vatCents: true },
        });
        if (fees.length === 0) return null;
        const tenant = await tx.tenant.findUnique({
          where: { id: tenantId },
          select: { ownerUserId: true },
        });
        if (!tenant) return null;
        const totals = summarizeBillingLines(
          fees.map((f) => ({ subtotalCents: f.feeCents, vatCents: f.vatCents })),
        );
        const invoice = await tx.platformBillingInvoice.create({
          data: {
            number: await nextNumber(tx, year),
            kind: "TENANT_FEE",
            payerUserId: tenant.ownerUserId,
            tenantId,
            periodLabel,
            subtotalCents: totals.subtotalCents,
            vatCents: totals.vatCents,
            totalCents: totals.totalCents,
            status: "DRAFT",
          },
        });
        await tx.collaborationFee.updateMany({
          where: { id: { in: fees.map((f) => f.id) }, status: "PENDING" },
          data: { invoiceId: invoice.id, status: "INVOICED" },
        });
        return invoice;
      });
      if (created) {
        result.tenantInvoices += 1;
        result.totalCents += created.totalCents;
      }
    } catch {
      // Nummer-botsing of race: sla deze over; een volgende run pakt de resterende fees op.
    }
  }

  // --- ZZP_MEMBERSHIP: één factuur per ZZP'er met openstaande maandbijdragen ---
  const users = await prisma.zzpMembershipCharge.findMany({
    where: { status: "PENDING" },
    select: { userId: true },
    distinct: ["userId"],
  });
  for (const { userId } of users) {
    try {
      const created = await prisma.$transaction(async (tx) => {
        const charges = await tx.zzpMembershipCharge.findMany({
          where: { userId, status: "PENDING" },
          select: { id: true, priceCents: true, vatCents: true },
        });
        if (charges.length === 0) return null;
        const totals = summarizeBillingLines(
          charges.map((c) => ({ subtotalCents: c.priceCents, vatCents: c.vatCents })),
        );
        const invoice = await tx.platformBillingInvoice.create({
          data: {
            number: await nextNumber(tx, year),
            kind: "ZZP_MEMBERSHIP",
            payerUserId: userId,
            periodLabel,
            subtotalCents: totals.subtotalCents,
            vatCents: totals.vatCents,
            totalCents: totals.totalCents,
            status: "DRAFT",
          },
        });
        await tx.zzpMembershipCharge.updateMany({
          where: { id: { in: charges.map((c) => c.id) }, status: "PENDING" },
          data: { invoiceId: invoice.id, status: "INVOICED" },
        });
        return invoice;
      });
      if (created) {
        result.membershipInvoices += 1;
        result.totalCents += created.totalCents;
      }
    } catch {
      // idem: overslaan, volgende run pakt de rest.
    }
  }

  return result;
}
