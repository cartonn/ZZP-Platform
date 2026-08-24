// Financiële relatie met één opdrachtgever, voor het bemiddelaar-detail
// (`/franchise/opdrachtgevers/[id]`). Pure, deterministische compositie van twee bestaande
// canonieke signalen — openstaand/te-laat (`ClientOutstanding`, uit de aging-motor) en het
// betaalgedrag-oordeel (`PaymentBehavior`) — tot één view-model. De lijst toont per klant al de
// chip + het te-laat-bedrag; het detail liet die context wegvallen terwijl `paymentTrustChip` in
// zijn eigen docstring "de volledige cijfers staan op de detailpagina" belooft. Deze module levert
// die cijfers, drift-vrij (geen tweede definitie van openstaand of betaalgedrag) en los testbaar.

import { type AgingBucketKey } from "@/lib/administration/aging";
import { type ClientOutstanding } from "@/lib/franchise/client-outstanding";
import {
  paymentTrustChip,
  PAYMENT_MIN_SAMPLE_SIZE,
  type PaymentBehavior,
  type PaymentTrustChip,
} from "@/lib/payment-behavior";

/**
 * Badge-toon voor een aging-bucket: hoe verder over de vervaldatum, hoe zwaarder. Identiek aan de
 * mapping op de opdrachtgeverslijst en het `/openstaand`-paneel — hier los zodat het detail dezelfde
 * toon toont zonder de administratie-motor (`aging.ts`, beschermd) te wijzigen. Puur en totaal.
 */
export function agingBucketBadgeVariant(key: AgingBucketKey): "muted" | "warning" | "danger" {
  if (key === "d61_90" || key === "d90plus") return "danger";
  if (key === "d0_30" || key === "d31_60") return "warning";
  return "muted";
}

/**
 * Concrete betaalhistorie-zin uit het geaggregeerde betaalgedrag: gemiddeld aantal dagen tot betaling
 * en/of het op-tijd-percentage, met de steekproefgrootte als context. `null` bij een te kleine
 * steekproef (`< PAYMENT_MIN_SAMPLE_SIZE`) of wanneer er geen bruikbaar cijfer is — dan blijft het
 * detail rustig i.p.v. een misleidend precies getal op één of twee facturen te tonen. Alleen
 * geaggregeerde cijfers; nooit een individuele factuur of bedrag.
 */
export function paymentHistorySentence(behavior: PaymentBehavior): string | null {
  if (behavior.sampleSize < PAYMENT_MIN_SAMPLE_SIZE) return null;
  if (behavior.avgDaysToPay == null && behavior.onTimePct == null) return null;

  const parts: string[] = [];
  if (behavior.avgDaysToPay != null) {
    const d = behavior.avgDaysToPay;
    parts.push(`gemiddeld ${d} ${d === 1 ? "dag" : "dagen"} na factuurdatum betaald`);
  }
  if (behavior.onTimePct != null) {
    parts.push(`${behavior.onTimePct}% op tijd`);
  }
  const facturen = `${behavior.sampleSize} ${behavior.sampleSize === 1 ? "factuur" : "facturen"}`;
  return `${parts.join(" · ")} (over ${facturen})`;
}

/** Samengesteld financieel-relatie-beeld voor het opdrachtgever-detail. */
export interface ClientFinancialRelation {
  totalOpenCents: number;
  overdueCents: number;
  overdueCount: number;
  /** Zwaarste te-late bucket; `null` wanneer er niets openstaat. */
  worstBucket: AgingBucketKey | null;
  /** Kwalitatieve reputatiechip (op tijd / vaak laat); `null` bij neutraal/onbekend. */
  paymentChip: PaymentTrustChip | null;
  /** Concrete cijferzin, of `null` bij te weinig historie. */
  historySentence: string | null;
  /** Staat er nu geld open bij deze klant? */
  hasOutstanding: boolean;
  /**
   * Is er überhaupt iets financieels te tonen? False → render de kaart niet (rustig blijven voor een
   * verse klant zonder facturen of betaalhistorie).
   */
  hasAny: boolean;
}

/**
 * Bouwt het financiële-relatie-beeld uit het (mogelijk lege) openstaand-signaal en het betaalgedrag.
 * Puur en deterministisch. `outstanding` is `null`/nul-bedrag wanneer er niets openstaat; `behavior`
 * geeft bij te weinig historie een `unknown`-toon → geen chip, geen zin.
 */
export function buildClientFinancialRelation(
  outstanding: ClientOutstanding | null,
  behavior: PaymentBehavior,
): ClientFinancialRelation {
  const totalOpenCents = outstanding?.totalOpenCents ?? 0;
  const hasOutstanding = totalOpenCents > 0;
  const paymentChip = paymentTrustChip(behavior);
  const historySentence = paymentHistorySentence(behavior);

  return {
    totalOpenCents,
    overdueCents: outstanding?.overdueCents ?? 0,
    overdueCount: outstanding?.overdueCount ?? 0,
    worstBucket: hasOutstanding ? (outstanding?.worstBucket ?? null) : null,
    paymentChip,
    historySentence,
    hasOutstanding,
    hasAny: hasOutstanding || paymentChip != null || historySentence != null,
  };
}
