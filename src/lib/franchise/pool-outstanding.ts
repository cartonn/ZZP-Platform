// Pool-brede openstaand-cashflow voor het bemiddelaar-startscherm. Het dashboard van de bemiddelaar
// is volledig telling-gebaseerd (opdrachtgevers, ZZP'ers, open diensten, samenwerkingen) — er staat
// nergens een geldcijfer, terwijl de FREELANCER/CLIENT-dashboards al een geld-glance dragen. De
// concrete vraag "hoeveel staat er nú open bij mijn pool ZZP'ers, en hoeveel daarvan is te laat?"
// is voor een pool-manager het kern-cashflowsignaal en hoort op de plek waar hij de dag begint.
//
// Hergebruikt bewust de al-geteste pool-openstaand-motor (`clientOutstandingByCompany` +
// `poolOutstandingTotals`, canonieke aging via `buildAgingReport`) en de canonieke openstaand-regel
// (`outstandingInvoiceWhere`) — dezelfde bron als `/franchise/opdrachtgevers` en `/openstaand`, dus
// geen tweede definitie en geen drift. Server-side is de waarheid (CLAUDE.md regel 1): de client toont
// het bedrag, berekent het nooit zelf.

import { prisma } from "@/lib/db";
import { outstandingInvoiceWhere } from "@/lib/administration/outstanding";
import {
  clientOutstandingByCompany,
  poolOutstandingTotals,
  type PoolOutstandingTotals,
} from "./client-outstanding";

/** Glance-vorm voor de KPI-tegel: de pool-totalen plus de afgeleide toon (te laat = waarschuwing). */
export interface PoolOutstandingGlance {
  totalOpenCents: number;
  overdueCents: number;
  overdueCount: number;
  /** Aantal opdrachtgevers met ≥1 te late openstaande post. */
  clientsOverdue: number;
  /** "warning" zodra er iets te laat is, anders "neutral" — de tegel kleurt mee. */
  tone: "neutral" | "warning";
}

/**
 * Pure presenter: vertaalt de pool-totalen naar de glance-vorm. Retourneert `null` wanneer er niets
 * openstaat (bedrag 0) zodat het startscherm rustig blijft — een lege geld-KPI is ruis. De toon volgt
 * uitsluitend het te-late bedrag: één te late post → waarschuwing.
 */
export function buildPoolOutstandingGlance(
  totals: PoolOutstandingTotals,
): PoolOutstandingGlance | null {
  if (totals.totalOpenCents <= 0) return null;
  return {
    totalOpenCents: totals.totalOpenCents,
    overdueCents: totals.overdueCents,
    overdueCount: totals.overdueCount,
    clientsOverdue: totals.clientsOverdue,
    tone: totals.overdueCents > 0 ? "warning" : "neutral",
  };
}

/**
 * Loader: haalt de tenant-gescopet openstaande facturen op (via de samenwerking → opdrachtgever →
 * tenant), draait ze door de canonieke aging-motor en levert de glance. `now` wordt geïnjecteerd zodat
 * de te-laat-rollup deterministisch is. `null` tenant of niets openstaand → `null` (geen tegel).
 */
export async function getPoolOutstandingGlance(
  tenantId: string | null,
  now: Date,
): Promise<PoolOutstandingGlance | null> {
  if (!tenantId) return null;
  // unbounded-allow: franchise-tenant-gescopete openstaande facturen; beheerbaar volume, geaggregeerd.
  const invoices = await prisma.invoice.findMany({
    where: { ...outstandingInvoiceWhere, collaboration: { company: { tenantId } } },
    select: {
      totalCents: true,
      dueAt: true,
      collaboration: { select: { companyId: true } },
    },
  });
  const byCompany = clientOutstandingByCompany(
    invoices.flatMap((inv) =>
      inv.collaboration
        ? [
            {
              companyId: inv.collaboration.companyId,
              amountCents: inv.totalCents,
              dueAt: inv.dueAt,
            },
          ]
        : [],
    ),
    now,
  );
  return buildPoolOutstandingGlance(poolOutstandingTotals(byCompany));
}
