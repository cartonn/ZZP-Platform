// CSV-export van het betaalgedrag-per-opdrachtgever-overzicht op /inzicht (ZZP'er): één rij per
// opdrachtgever met gemiddelde betaaltijd, op-tijd-percentage, aantal betalingen en het oordeel —
// de debiteuren-betrouwbaarheidslijst die een ZZP'er (of zijn boekhouder/factoringpartner) naast het
// omzet-per-relatie-register (@/lib/relation-breakdown-csv) wil hebben om te beslissen wie na te bellen
// of bij wie voortaan liever te werken. Toont uitsluitend geaggregeerde statistiek — nooit een
// individueel factuurbedrag (privacy, gelijk aan de kaart op het scherm).
//
// Pure functie: bouwt de CSV-tekst; de route levert hem als download. De rijen komen al in de
// scherm-volgorde (waarschuwing eerst) uit `buildFreelancerPayerBehavior` → geen scherm↔export-drift.
// Scheidingsteken ';' (gangbaar voor NL-Excel) via de gedeelde CSV-primitieven, inclusief de
// formule-injectie-beveiliging (CWE-1236) op vrije tekst (bedrijfsnamen van derden).

import { toCsv } from "@/lib/administration/csv";
import type { PayerBehaviorRow } from "@/lib/freelancer-payer-behavior";
import type { PaymentTone } from "@/lib/payment-behavior";

// Oordeel-tekst per toon — spiegelt de badge-taal van de kaart (PAYER_TONE_BADGE op /inzicht) zodat
// de export precies leest zoals het scherm.
const TONE_LABEL: Record<PaymentTone, string> = {
  good: "Betaalt op tijd",
  neutral: "Gemiddeld",
  warning: "Betaalt vaak laat",
  unknown: "Onbekend",
};

/**
 * Betaalgedrag-rijen → CSV met een vaste kop. Behoudt de aangeleverde volgorde (waarschuwing eerst,
 * zoals op het scherm). Een niet-berekenbare betaaltijd of op-tijd-percentage wordt een lege cel
 * (nooit een verzonnen "0"). Muteert de invoer niet.
 */
export function payerBehaviorCsv(rows: readonly PayerBehaviorRow[]): string {
  const header = [
    "Opdrachtgever",
    "Gemiddelde betaaltijd (dagen)",
    "Op tijd (%)",
    "Aantal betalingen",
    "Beoordeling",
  ];
  const body = rows.map(({ name, behavior }) => [
    name,
    behavior.avgDaysToPay != null ? String(behavior.avgDaysToPay) : "",
    behavior.onTimePct != null ? String(behavior.onTimePct) : "",
    String(behavior.sampleSize),
    TONE_LABEL[behavior.tone],
  ]);
  return toCsv([header, ...body]);
}
