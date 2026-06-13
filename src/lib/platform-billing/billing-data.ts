// Read-only data voor de admin-facturatie-cockpit: de platformfacturen met betaler/tenant-naam, en de
// regels van één factuur (gereconstrueerd uit de gekoppelde bijdragen). Geld in integer-centen.

import { prisma } from "@/lib/db";

export interface BillingInvoiceRow {
  id: string;
  number: string;
  kind: string;
  payerName: string;
  tenantName: string | null;
  periodLabel: string;
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  status: string;
  providerRef: string | null;
  createdAt: Date;
  issuedAt: Date | null;
}

export async function listPlatformBillingInvoices(): Promise<BillingInvoiceRow[]> {
  const rows = await prisma.platformBillingInvoice.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      number: true,
      kind: true,
      tenantId: true,
      periodLabel: true,
      subtotalCents: true,
      vatCents: true,
      totalCents: true,
      status: true,
      providerRef: true,
      createdAt: true,
      issuedAt: true,
      payer: { select: { name: true } },
    },
  });

  const tenantIds = [...new Set(rows.flatMap((r) => (r.tenantId ? [r.tenantId] : [])))];
  const tenants =
    tenantIds.length > 0
      ? await prisma.tenant.findMany({
          where: { id: { in: tenantIds } },
          select: { id: true, name: true },
        })
      : [];
  const tenantName = new Map(tenants.map((t) => [t.id, t.name]));

  return rows.map((r) => ({
    id: r.id,
    number: r.number,
    kind: r.kind,
    payerName: r.payer.name ?? "—",
    tenantName: r.tenantId ? (tenantName.get(r.tenantId) ?? null) : null,
    periodLabel: r.periodLabel,
    subtotalCents: r.subtotalCents,
    vatCents: r.vatCents,
    totalCents: r.totalCents,
    status: r.status,
    providerRef: r.providerRef,
    createdAt: r.createdAt,
    issuedAt: r.issuedAt,
  }));
}

export interface BillingPdfLine {
  description: string;
  subtotalCents: number;
  vatCents: number;
}

export interface BillingInvoiceDetail {
  number: string;
  kind: string;
  payerName: string;
  periodLabel: string;
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  vatRegime: string;
  issuedAtYmd: string;
  lines: BillingPdfLine[];
}

const ymd = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

/** Eén factuur met regels, gereconstrueerd uit de gekoppelde (INVOICED) bijdragen. */
export async function getPlatformBillingInvoiceDetail(
  id: string,
): Promise<BillingInvoiceDetail | null> {
  const inv = await prisma.platformBillingInvoice.findUnique({
    where: { id },
    select: {
      number: true,
      kind: true,
      periodLabel: true,
      subtotalCents: true,
      vatCents: true,
      totalCents: true,
      vatRegime: true,
      issuedAt: true,
      createdAt: true,
      payer: { select: { name: true } },
    },
  });
  if (!inv) return null;

  let lines: BillingPdfLine[] = [];
  if (inv.kind === "TENANT_FEE") {
    const fees = await prisma.collaborationFee.findMany({
      where: { invoiceId: id },
      select: {
        feeCents: true,
        vatCents: true,
        collaboration: { select: { job: { select: { title: true } } } },
      },
    });
    lines = fees.map((f) => ({
      description: `Bemiddelingsfee — ${f.collaboration?.job?.title ?? "samenwerking"}`,
      subtotalCents: f.feeCents,
      vatCents: f.vatCents,
    }));
  } else {
    const charges = await prisma.zzpMembershipCharge.findMany({
      where: { invoiceId: id },
      orderBy: { period: "asc" },
      select: { period: true, priceCents: true, vatCents: true },
    });
    lines = charges.map((c) => ({
      description: `Platformabonnement ${c.period}`,
      subtotalCents: c.priceCents,
      vatCents: c.vatCents,
    }));
  }

  return {
    number: inv.number,
    kind: inv.kind,
    payerName: inv.payer.name ?? "—",
    periodLabel: inv.periodLabel,
    subtotalCents: inv.subtotalCents,
    vatCents: inv.vatCents,
    totalCents: inv.totalCents,
    vatRegime: inv.vatRegime,
    issuedAtYmd: ymd(inv.issuedAt ?? inv.createdAt),
    lines,
  };
}
