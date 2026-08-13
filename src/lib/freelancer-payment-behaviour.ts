// Rol-gerichte BI voor de ZZP'er: het gemeten betaalgedrag van zijn eígen opdrachtgevers, per
// opdrachtgever uitgesplitst. De cascade-motor meet dit betaalgedrag al (`computePaymentBehavior`)
// en gebruikt het stil — per openstaande factuur op `/openstaand` (verwachte-betaaldatum) en als
// chip op de opdrachtenlijst. Wat ontbrak is de directe cashflow-vraag "welke opdrachtgever betaalt
// traag, en hoeveel dagen doet hij erover?" als één overzicht. Deze module beantwoordt die vraag op
// `/inzicht`, zodat de ZZP'er weet bij wie hij scherper moet nafactureren of andere afspraken maken.
//
// Server-side waarheid: alleen tonen, nooit beslissen; geen status-/geldstroommutatie.
//
// Privacy: het betaalgedrag komt uitsluitend uit de eigen betaalde facturen van deze ZZP'er (nooit
// factuurdata van andere ZZP'ers). Er wordt geen individueel factuurbedrag getoond — enkel het
// geaggregeerde signaal per opdrachtgever (gem. betaaltijd, op-tijd-percentage, aantal betalingen).

import { prisma } from "@/lib/db";
import {
  computePaymentBehavior,
  type PaymentBehavior,
  type PaymentRow,
  PAYMENT_MIN_SAMPLE_SIZE,
} from "@/lib/payment-behavior";

/** Maximumaantal betaalde facturen dat we ophalen; ruim genoeg voor een representatief signaal. */
const MAX_PAID_INVOICES = 500;

export interface FreelancerClientPaymentRow {
  companyId: string;
  name: string;
  behavior: PaymentBehavior;
}

export interface FreelancerPaymentBehaviourBreakdown {
  /** Per opdrachtgever met een betrouwbaar signaal, meest zorgwekkende eerst. */
  rows: FreelancerClientPaymentRow[];
  /** Aantal opdrachtgevers dat structureel traag betaalt (`tone === "warning"`). */
  slowPayers: number;
}

/** Invoerrij: één betaalde factuur, gekoppeld aan de opdrachtgever (Company) via de samenwerking. */
export interface PaidInvoiceForBehaviour {
  companyId: string | null;
  companyName: string | null;
  issuedAt: Date | null;
  dueAt: Date | null;
  /** Betaalmoment — Invoice.updatedAt bij status PAID (zie payment-behavior.ts). */
  paidAt: Date | null;
}

// Sorteervolgorde op toon: eerst de opdrachtgevers waar de ZZP'er actie op wil ondernemen.
const TONE_RANK: Record<PaymentBehavior["tone"], number> = {
  warning: 0,
  neutral: 1,
  good: 2,
  unknown: 3,
};

/**
 * Pure aggregator: groepeert betaalde facturen per opdrachtgever en berekent per opdrachtgever het
 * betaalgedrag-signaal. Alleen opdrachtgevers met een **betrouwbaar** signaal (minstens
 * `PAYMENT_MIN_SAMPLE_SIZE` betalingen — `tone !== "unknown"`) komen in de lijst; met minder historie
 * is een oordeel misleidend. Gesorteerd met de meest zorgwekkende betaler eerst (traag → op tijd, dan
 * op gemiddelde betaaltijd aflopend), zodat de ZZP'er direct ziet waar het knelt. Facturen zonder
 * bekende opdrachtgever (samenwerking verwijderd) worden genegeerd.
 *
 * Puur en deterministisch — geschikt voor unit-tests zonder DB.
 */
export function buildFreelancerPaymentBehaviourBreakdown(
  invoices: readonly PaidInvoiceForBehaviour[],
): FreelancerPaymentBehaviourBreakdown {
  const byCompany = new Map<string, { name: string; rows: PaymentRow[] }>();
  for (const inv of invoices) {
    if (!inv.companyId) continue;
    let entry = byCompany.get(inv.companyId);
    if (!entry) {
      entry = { name: inv.companyName ?? "Onbekende opdrachtgever", rows: [] };
      byCompany.set(inv.companyId, entry);
    }
    entry.rows.push({ issuedAt: inv.issuedAt, dueAt: inv.dueAt, paidAt: inv.paidAt });
  }

  const rows: FreelancerClientPaymentRow[] = [];
  for (const [companyId, entry] of byCompany) {
    const behavior = computePaymentBehavior(entry.rows);
    // Zonder betrouwbaar signaal (te weinig betalingen) geen oordeel tonen.
    if (behavior.tone === "unknown") continue;
    rows.push({ companyId, name: entry.name, behavior });
  }

  rows.sort((a, b) => {
    const rank = TONE_RANK[a.behavior.tone] - TONE_RANK[b.behavior.tone];
    if (rank !== 0) return rank;
    // Binnen dezelfde toon: langzaamste betaler eerst (null achteraan).
    const da = a.behavior.avgDaysToPay;
    const db = b.behavior.avgDaysToPay;
    if (da == null && db == null) return a.name.localeCompare(b.name, "nl");
    if (da == null) return 1;
    if (db == null) return -1;
    return db - da || a.name.localeCompare(b.name, "nl");
  });

  const slowPayers = rows.filter((r) => r.behavior.tone === "warning").length;
  return { rows, slowPayers };
}

/**
 * Laadt het betaalgedrag per opdrachtgever voor de ingelogde ZZP'er. Scoping op de eigen betaalde
 * facturen (`collaboration.freelancer.userId`, status PAID) — dezelfde bron als `earnedCents` in
 * freelancer-stats.ts, dus het beeld spoort met de omzetcijfers. Begrensd op DB-niveau
 * (`take: MAX_PAID_INVOICES`) — geen onbegrensde findMany.
 */
export async function getFreelancerPaymentBehaviourBreakdown(
  userId: string,
): Promise<FreelancerPaymentBehaviourBreakdown> {
  const invoices = await prisma.invoice.findMany({
    where: {
      collaboration: { freelancer: { userId } },
      status: "PAID",
    },
    select: {
      issuedAt: true,
      dueAt: true,
      updatedAt: true, // proxy voor paidAt — zie bronkeuze in payment-behavior.ts
      collaboration: { select: { company: { select: { id: true, name: true } } } },
    },
    orderBy: { updatedAt: "desc" },
    take: MAX_PAID_INVOICES,
  });

  return buildFreelancerPaymentBehaviourBreakdown(
    invoices.map((inv) => ({
      companyId: inv.collaboration?.company.id ?? null,
      companyName: inv.collaboration?.company.name ?? null,
      issuedAt: inv.issuedAt,
      dueAt: inv.dueAt,
      paidAt: inv.updatedAt,
    })),
  );
}

// Re-export voor de kaart zodat de drempel op één plek staat.
export { PAYMENT_MIN_SAMPLE_SIZE };
