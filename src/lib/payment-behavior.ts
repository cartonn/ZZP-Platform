// Betaalgedrag-signaal per opdrachtgever (Company). Puur berekend uit de cascade-facturen;
// geen schema-wijziging nodig, geen individuele factuur-data van anderen getoond (privacy).
//
// --- Gekozen betaal-tijdstip-bron ---
// Het Invoice-model heeft geen expliciete `paidAt`-kolom. Wanneer betaling wordt bevestigd
// (cascade Event E, `confirmPayment`) roept `planPaymentConfirmedEvent` de applier aan die
// `status: "PAID"` zet via `updateMany`. Prisma's `@updatedAt` springt dan automatisch mee.
// Daarmee is `updatedAt` van een invoice met `status = "PAID"` de meest betrouwbare proxy
// voor het betaalmoment. De `DomainEvent`-tabel bevat het event `PAYMENT_CONFIRMED` met
// `occurredAt`, maar dat vereist een join en de timing is gelijk aan `updatedAt`. We kiezen
// `updatedAt` als directe, enkelvoudige bron op de Invoice-rij zelf.
//
// Invoer-rij: `{ issuedAt, dueAt, paidAt }` (paidAt = Invoice.updatedAt bij status PAID).

export interface PaymentRow {
  /** Factuurdatum — wanneer de factuur is ingediend (Invoice.issuedAt). */
  issuedAt: Date | null;
  /** Vervaldatum — wanneer betaling uiterlijk verwacht was (Invoice.dueAt). */
  dueAt: Date | null;
  /**
   * Betaalmoment — zie bronkeuze hierboven. In de query gemapt op Invoice.updatedAt
   * voor facturen met status = "PAID".
   */
  paidAt: Date | null;
}

export type PaymentTone = "good" | "neutral" | "warning" | "unknown";

export interface PaymentBehavior {
  sampleSize: number;
  /** Gemiddeld aantal dagen van issuedAt tot paidAt; null als niet te berekenen. */
  avgDaysToPay: number | null;
  /** Percentage facturen betaald op of vóór dueAt; null als niet te berekenen. */
  onTimePct: number | null;
  tone: PaymentTone;
}

// Grenzen voor de toon-bepaling (gedocumenteerd zodat aanpassen traceerbaar is).
const GOOD_MAX_DAYS = 14;
const GOOD_MIN_ON_TIME_PCT = 90;
const WARNING_MIN_DAYS = 30;
const WARNING_MAX_ON_TIME_PCT = 60;
/** Minimum aantal betalingen voor een betrouwbaar betaalgedrag-signaal (gedeeld met de UI-kaart). */
export const PAYMENT_MIN_SAMPLE_SIZE = 3;

/**
 * Berekent het betaalgedrag-signaal voor een opdrachtgever op basis van zijn betalingshistorie.
 * Puur en deterministisch; geschikt voor unit-tests zonder DB.
 *
 * Definitie van "op tijd": paidAt <= dueAt. Rijen zonder paidAt worden niet als betaald
 * beschouwd en vallen buiten de steekproef (alleen al betaalde facturen zijn relevant).
 * Rijen met paidAt maar zonder dueAt tellen mee voor avgDaysToPay maar niet voor onTimePct.
 */
export function computePaymentBehavior(rows: PaymentRow[]): PaymentBehavior {
  // Alleen rijen met een betaalmoment zijn relevant voor de analyse.
  const paid = rows.filter((r) => r.paidAt != null);
  const sampleSize = paid.length;

  if (sampleSize < PAYMENT_MIN_SAMPLE_SIZE) {
    return { sampleSize, avgDaysToPay: null, onTimePct: null, tone: "unknown" };
  }

  // Gemiddeld aantal dagen van issuedAt → paidAt.
  const daysToPayValues: number[] = [];
  for (const r of paid) {
    // paidAt is gecontroleerd niet-null door het filter hierboven.
    const paidAt = r.paidAt!;
    const anchor = r.issuedAt ?? r.dueAt;
    if (anchor != null) {
      const diffMs = paidAt.getTime() - anchor.getTime();
      // Negatieve waarde (paidAt vóór issuedAt) duidt op data-ruis; sla over.
      if (diffMs >= 0) {
        daysToPayValues.push(diffMs / 86_400_000);
      }
    }
  }

  const avgDaysToPay =
    daysToPayValues.length > 0
      ? Math.round(daysToPayValues.reduce((s, d) => s + d, 0) / daysToPayValues.length)
      : null;

  // Op-tijd-percentage: alleen rijen met zowel paidAt als dueAt.
  const withDueDate = paid.filter((r) => r.dueAt != null);
  const onTimePct =
    withDueDate.length > 0
      ? Math.round(
          (withDueDate.filter((r) => r.paidAt!.getTime() <= r.dueAt!.getTime()).length /
            withDueDate.length) *
            100,
        )
      : null;

  const tone = determineTone(avgDaysToPay, onTimePct);

  return { sampleSize, avgDaysToPay, onTimePct, tone };
}

export type PaymentTrustChipTone = "good" | "warning";

export interface PaymentTrustChip {
  /** Compacte tekst voor de lijstweergave, bv. "Betaalt op tijd" of "Betaalt vaak laat". */
  label: string;
  /** Toon-emfase: "good" (betrouwbare betaler) | "warning" (betaalt structureel laat). */
  tone: PaymentTrustChipTone;
}

/**
 * Compacte lijst-chip afgeleid uit het betaalgedrag-signaal. Bedoeld voor de opdrachtenlijst waar de
 * ZZP'er triageert bij welke opdrachtgever het zin heeft te reageren, zonder elke opdracht te openen:
 * "krijg ik op tijd betaald?" is het diepste vertrouwenssignaal. Toont uitsluitend de beslis-relevante
 * uitersten (`good`/`warning`) en geeft bij `neutral`/`unknown` `null` terug, zodat de lijst rustig
 * blijft (geen ruis op elke opdrachtgever zonder uitgesproken betaalreputatie; de volledige cijfers
 * staan op de detailpagina). Puur en deterministisch; toont alleen het geaggregeerde oordeel — nooit
 * een individuele factuur of het bedrag ervan.
 */
export function paymentTrustChip(behavior: PaymentBehavior): PaymentTrustChip | null {
  if (behavior.tone === "good") {
    return { label: "Betaalt op tijd", tone: "good" };
  }
  if (behavior.tone === "warning") {
    return { label: "Betaalt vaak laat", tone: "warning" };
  }
  return null;
}

/**
 * Badge-variant voor een `PaymentTrustChip` in een lijstweergave die de gedeelde `Badge` gebruikt (bv.
 * de bemiddelaar-opdrachtgeverslijst): `good` → `success`, `warning` → `warning`. Eén bron zodat de
 * chip-toon niet driftet van de betekenis in `paymentTrustChip`. Puur en totaal (elke chip-toon maakt).
 */
export function paymentTrustChipBadgeVariant(chip: PaymentTrustChip): "success" | "warning" {
  return chip.tone === "good" ? "success" : "warning";
}

function determineTone(avgDaysToPay: number | null, onTimePct: number | null): PaymentTone {
  // Goed: snel betaald (≤14 dagen) of bijna altijd op tijd (≥90%).
  if (
    (avgDaysToPay != null && avgDaysToPay <= GOOD_MAX_DAYS) ||
    (onTimePct != null && onTimePct >= GOOD_MIN_ON_TIME_PCT)
  ) {
    return "good";
  }

  // Waarschuwing: traag betaald (>30 dagen) of vaak te laat (<60%).
  if (
    (avgDaysToPay != null && avgDaysToPay > WARNING_MIN_DAYS) ||
    (onTimePct != null && onTimePct < WARNING_MAX_ON_TIME_PCT)
  ) {
    return "warning";
  }

  return "neutral";
}
