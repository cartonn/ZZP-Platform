// Rol-gerichte BI voor de ZZP'er: betaalgedrag per opdrachtgever — hoe snel en hoe betrouwbaar
// betaalt elke klant de eigen facturen. De tegenhanger van "Omzet per opdrachtgever"
// (freelancer-revenue-breakdown.ts): dáár zie je van wíe je omzet komt, hier zie je wíe die omzet
// ook op tijd overmaakt. Traag betalende klanten zijn de cashflow-hefboom die een ZZP'er wil zien
// (nabellen, of voortaan liever bij de snelle betalers werken).
//
// Read-only inzicht; scoping op de eigen facturen (`issuerUserId`, status PAID) — exact dezelfde
// bron als `earnedCents`/de omzet-uitsplitsing, dus het spoort met wat de ZZP'er elders ziet.
// Hergebruikt de pure `computePaymentBehavior` (payment-behavior.ts) per opdrachtgever, zodat het
// oordeel niet kan driften van het betaalgedrag-blok op de opdracht-detailpagina. Toont uitsluitend
// geaggregeerde statistieken over de eigen betaalrelatie — geen individuele factuurbedragen.

import { prisma } from "@/lib/db";
import {
  computePaymentBehavior,
  PAYMENT_MIN_SAMPLE_SIZE,
  type PaymentBehavior,
  type PaymentRow,
  type PaymentTone,
} from "@/lib/payment-behavior";

export interface PayerBehaviorRow {
  companyId: string;
  name: string;
  behavior: PaymentBehavior;
}

/** Eén invoerrij: een betaalde eigen factuur, gekoppeld aan de opdrachtgever die 'm betaalde. */
export interface PayerInvoiceRow {
  companyId: string | null;
  companyName: string | null;
  issuedAt: Date | null;
  dueAt: Date | null;
  /** Betaalmoment — Invoice.updatedAt bij status PAID (zie payment-behavior.ts voor de bronkeuze). */
  paidAt: Date | null;
}

// Sorteervolgorde: de opdrachtgevers waar de ZZP'er iets mee moet (traag/onbetrouwbaar) bovenaan.
const TONE_RANK: Record<PaymentTone, number> = {
  warning: 0,
  neutral: 1,
  good: 2,
  unknown: 3,
};

/**
 * Pure aggregator: groepeert de betaalde eigen facturen per opdrachtgever en berekent per klant het
 * betaalgedrag via `computePaymentBehavior`. Facturen zonder bekende opdrachtgever (samenwerking
 * verwijderd → `companyId` null) worden genegeerd. Alleen opdrachtgevers met genoeg betaalhistorie
 * voor een betekenisvol signaal (`sampleSize >= PAYMENT_MIN_SAMPLE_SIZE`, d.w.z. `tone !== "unknown"`)
 * komen in de lijst — zo blijft de kaart rustig en spiegelt hij de drempel van het betaalgedrag-blok.
 * Gesorteerd op toon (waarschuwing eerst), dan op gemiddelde betaaltijd aflopend (traagste eerst),
 * dan op naam. Apart van de DB zodat het deterministisch te testen is.
 */
export function buildFreelancerPayerBehavior(
  invoices: readonly PayerInvoiceRow[],
): PayerBehaviorRow[] {
  const acc = new Map<string, { name: string; rows: PaymentRow[] }>();

  for (const inv of invoices) {
    if (!inv.companyId) continue;
    let entry = acc.get(inv.companyId);
    if (!entry) {
      entry = { name: inv.companyName ?? "Onbekende opdrachtgever", rows: [] };
      acc.set(inv.companyId, entry);
    }
    entry.rows.push({ issuedAt: inv.issuedAt, dueAt: inv.dueAt, paidAt: inv.paidAt });
  }

  return [...acc.entries()]
    .map(([companyId, entry]) => ({
      companyId,
      name: entry.name,
      behavior: computePaymentBehavior(entry.rows),
    }))
    .filter((r) => r.behavior.sampleSize >= PAYMENT_MIN_SAMPLE_SIZE)
    .sort(
      (a, b) =>
        TONE_RANK[a.behavior.tone] - TONE_RANK[b.behavior.tone] ||
        (b.behavior.avgDaysToPay ?? -1) - (a.behavior.avgDaysToPay ?? -1) ||
        a.name.localeCompare(b.name, "nl"),
    );
}

/**
 * Betaalgedrag per opdrachtgever voor de ingelogde ZZP'er. Scoping op de eigen facturen
 * (`issuerUserId`, status PAID), zodat er nooit betaaldata van andere ZZP'ers meetelt. Bij te weinig
 * betaalhistorie: lege lijst (de UI toont dan een empty-state).
 */
export async function getFreelancerPayerBehavior(userId: string): Promise<PayerBehaviorRow[]> {
  const invoices = await prisma.invoice.findMany({
    where: { issuerUserId: userId, status: "PAID" },
    select: {
      issuedAt: true,
      dueAt: true,
      updatedAt: true, // proxy voor paidAt — zie bronkeuze in payment-behavior.ts
      collaboration: {
        select: {
          companyId: true,
          company: { select: { name: true } },
        },
      },
    },
  });

  return buildFreelancerPayerBehavior(
    invoices.map((i) => ({
      companyId: i.collaboration?.companyId ?? null,
      companyName: i.collaboration?.company?.name ?? null,
      issuedAt: i.issuedAt,
      dueAt: i.dueAt,
      paidAt: i.updatedAt,
    })),
  );
}
