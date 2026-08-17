// Rol-gerichte BI voor de opdrachtgever: uitsplitsing van de betaalde uitgaven per ZZP'er. Geld in
// integer-centen. Read-only inzicht; scoping via de altijd-gevulde relatie
// (`collaboration.company.userId`) + `paidRevenueInvoiceWhere` —
// exact dezelfde bron als `spentCents` in client-stats.ts, dus het totaal spoort altijd. Spiegelt de
// franchiser-uitsplitsing "Per opdrachtgever" (tenant-stats.ts) en de ZZP-opdrachtgever-spreiding.

import { prisma } from "@/lib/db";
import { paidRevenueInvoiceWhere } from "@/lib/administration/paid-revenue";

export interface ClientSpendRow {
  freelancerId: string;
  name: string;
  /** Som van de betaalde facturen aan deze ZZP'er. */
  paidCents: number;
  /** Aantal samenwerkingen waarlangs betaald is (distinct collaborations). */
  placements: number;
  /** Aandeel (0–100, afgerond) van de totale betaalde uitgaven. */
  sharePct: number;
}

export interface ClientSpendBreakdown {
  rows: ClientSpendRow[];
  totalPaidCents: number;
  /**
   * Aandeel (0–100) van de grootste ZZP'er t.o.v. de totale betaalde uitgaven; `null` als er nog geen
   * uitgaven zijn. Een afhankelijkheidssignaal (spreiding over leveranciers).
   */
  concentrationPct: number | null;
}

interface PaidInvoiceRow {
  freelancerId: string | null;
  freelancerName: string | null;
  collaborationId: string | null;
  totalCents: number | null;
}

/**
 * Pure aggregator: voegt betaalde facturen samen tot één rij per ZZP'er (uitgaven + aantal
 * samenwerkingen), gesorteerd op uitgaven aflopend (dan op aantal samenwerkingen). Facturen zonder
 * bekende ZZP'er (samenwerking verwijderd → `collaboration` is null) worden genegeerd. `sharePct` is
 * het aandeel van de totale betaalde uitgaven. Apart van de DB zodat het deterministisch te testen is.
 */
export function buildClientSpendBreakdown(
  invoices: readonly PaidInvoiceRow[],
): ClientSpendBreakdown {
  const acc = new Map<string, { name: string; paidCents: number; collabs: Set<string> }>();
  let totalPaidCents = 0;

  for (const inv of invoices) {
    if (!inv.freelancerId) continue;
    const cents = inv.totalCents ?? 0;
    totalPaidCents += cents;
    let row = acc.get(inv.freelancerId);
    if (!row) {
      row = { name: inv.freelancerName ?? "Onbekende ZZP'er", paidCents: 0, collabs: new Set() };
      acc.set(inv.freelancerId, row);
    }
    row.paidCents += cents;
    if (inv.collaborationId) row.collabs.add(inv.collaborationId);
  }

  const rows: ClientSpendRow[] = [...acc.entries()]
    .map(([freelancerId, r]) => ({
      freelancerId,
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
 * Betaalde uitgaven per ZZP'er voor de ingelogde opdrachtgever. Scoping via de altijd-gevulde relatie
 * (`collaboration.company.userId`) i.p.v. de kolom `counterpartyUserId` (alleen door de cascade-handler
 * gezet), zodat ook legacy loose-facturen meetellen en er nooit cijfers van andere opdrachtgevers
 * lekken. De canonieke `paidRevenueInvoiceWhere` dekt cascade PAID/PROCESSED én legacy PAID — exact
 * dezelfde bron als `spentCents` in client-stats.ts, dus het totaal spoort. Bij geen betaalde facturen:
 * lege uitsplitsing (totaal 0, geen concentratiesignaal).
 */
export async function getClientSpendBreakdown(userId: string): Promise<ClientSpendBreakdown> {
  const invoices = await prisma.invoice.findMany({
    where: { collaboration: { company: { userId } }, ...paidRevenueInvoiceWhere },
    select: {
      totalCents: true,
      collaborationId: true,
      collaboration: {
        select: {
          freelancerId: true,
          freelancer: { select: { user: { select: { name: true } } } },
        },
      },
    },
  });

  return buildClientSpendBreakdown(
    invoices.map((i) => ({
      freelancerId: i.collaboration?.freelancerId ?? null,
      freelancerName: i.collaboration?.freelancer?.user?.name ?? null,
      collaborationId: i.collaborationId,
      totalCents: i.totalCents,
    })),
  );
}
