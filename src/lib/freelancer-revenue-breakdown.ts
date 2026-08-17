// Rol-gerichte BI voor de ZZP'er: uitsplitsing van de betaalde omzet per opdrachtgever. Geld in
// integer-centen. Read-only inzicht; scoping via de altijd-gevulde relatie
// (`collaboration.freelancer.userId`) + `paidRevenueInvoiceWhere` — exact
// dezelfde bron als `earnedCents` in freelancer-stats.ts, dus het totaal spoort altijd. Spiegelt de
// opdrachtgever-uitsplitsing "Per ZZP'er" (client-spend-breakdown.ts) en de franchiser "Per
// opdrachtgever" (tenant-stats.ts): een afhankelijkheidssignaal — te veel omzet bij één klant is een
// bedrijfsrisico dat de ZZP'er zou moeten zien.

import { prisma } from "@/lib/db";
import { paidRevenueInvoiceWhere } from "@/lib/administration/paid-revenue";

export interface FreelancerRevenueRow {
  companyId: string;
  name: string;
  /** Som van de betaalde facturen aan deze opdrachtgever. */
  paidCents: number;
  /** Aantal samenwerkingen waarlangs betaald is (distinct collaborations). */
  placements: number;
  /** Aandeel (0–100, afgerond) van de totale betaalde omzet. */
  sharePct: number;
}

export interface FreelancerRevenueBreakdown {
  rows: FreelancerRevenueRow[];
  totalPaidCents: number;
  /**
   * Aandeel (0–100) van de grootste opdrachtgever t.o.v. de totale betaalde omzet; `null` als er nog
   * geen omzet is. Een afhankelijkheidssignaal (spreiding over klanten).
   */
  concentrationPct: number | null;
}

interface PaidInvoiceRow {
  companyId: string | null;
  companyName: string | null;
  collaborationId: string | null;
  totalCents: number | null;
}

/**
 * Pure aggregator: voegt betaalde facturen samen tot één rij per opdrachtgever (omzet + aantal
 * samenwerkingen), gesorteerd op omzet aflopend (dan op aantal samenwerkingen). Facturen zonder bekende
 * opdrachtgever (samenwerking verwijderd → `collaboration` is null) worden genegeerd. `sharePct` is het
 * aandeel van de totale betaalde omzet. Apart van de DB zodat het deterministisch te testen is.
 */
export function buildFreelancerRevenueBreakdown(
  invoices: readonly PaidInvoiceRow[],
): FreelancerRevenueBreakdown {
  const acc = new Map<string, { name: string; paidCents: number; collabs: Set<string> }>();
  let totalPaidCents = 0;

  for (const inv of invoices) {
    if (!inv.companyId) continue;
    const cents = inv.totalCents ?? 0;
    totalPaidCents += cents;
    let row = acc.get(inv.companyId);
    if (!row) {
      row = {
        name: inv.companyName ?? "Onbekende opdrachtgever",
        paidCents: 0,
        collabs: new Set(),
      };
      acc.set(inv.companyId, row);
    }
    row.paidCents += cents;
    if (inv.collaborationId) row.collabs.add(inv.collaborationId);
  }

  const rows: FreelancerRevenueRow[] = [...acc.entries()]
    .map(([companyId, r]) => ({
      companyId,
      name: r.name,
      paidCents: r.paidCents,
      placements: r.collabs.size,
      sharePct: totalPaidCents > 0 ? Math.round((r.paidCents / totalPaidCents) * 100) : 0,
    }))
    .sort((a, b) => b.paidCents - a.paidCents || b.placements - a.placements);

  const top = rows[0];
  return {
    rows,
    totalPaidCents,
    concentrationPct: top && totalPaidCents > 0 ? top.sharePct : null,
  };
}

/**
 * Betaalde omzet per opdrachtgever voor de ingelogde ZZP'er. Scoping via de altijd-gevulde relatie
 * (`collaboration.freelancer.userId`) i.p.v. de kolom `issuerUserId` (alleen door de cascade-handler
 * gezet), zodat ook legacy loose-facturen meetellen en er nooit cijfers van andere ZZP'ers lekken. De
 * canonieke `paidRevenueInvoiceWhere` dekt cascade PAID/PROCESSED én legacy PAID — exact dezelfde bron
 * als `earnedCents` in freelancer-stats.ts, dus het totaal spoort. Bij geen betaalde facturen: lege
 * uitsplitsing (totaal 0, geen concentratiesignaal).
 */
export async function getFreelancerRevenueBreakdown(
  userId: string,
): Promise<FreelancerRevenueBreakdown> {
  const invoices = await prisma.invoice.findMany({
    where: { collaboration: { freelancer: { userId } }, ...paidRevenueInvoiceWhere },
    select: {
      totalCents: true,
      collaborationId: true,
      collaboration: {
        select: {
          companyId: true,
          company: { select: { name: true } },
        },
      },
    },
  });

  return buildFreelancerRevenueBreakdown(
    invoices.map((i) => ({
      companyId: i.collaboration?.companyId ?? null,
      companyName: i.collaboration?.company?.name ?? null,
      collaborationId: i.collaborationId,
      totalCents: i.totalCents,
    })),
  );
}
