// Reactiebereidheid-signaal per opdrachtgever (Company). Derde lid van de trits opdrachtgever-
// signalen die de ZZP'er op de opdracht-detail helpt beslissen of hij reageert: `payment-behavior.ts`
// (hóe betaalt hij), `client-reliability.ts` (hoe vaak annuleert hij), en hier: pakt hij binnengekomen
// reacties überhaupt op, of laat hij ze liggen? Puur en deterministisch; geen schema-wijziging,
// alleen geaggregeerde tellingen (privacy by design — geen reactie van een andere ZZP'er zichtbaar).
//
// --- Bron ---
// Een reactie (`Application`) start op status `NEW`. Zodra de opdrachtgever er iets mee doet, gaat de
// status naar `VIEWED`/`SHORTLIST`/`REJECTED`/`ACCEPTED` (zie `APPLICATION_STATUSES`). We leiden de
// bereidheid daarom af uit de onveranderlijke `createdAt` (immutable) + de huidige `status` — geen
// afhankelijkheid van het driftgevoelige `updatedAt`. "Opgepakt" = status !== "NEW"; "blijft liggen"
// = nog steeds `NEW`, en hoe lang al (now - createdAt). Zo is het signaal exact reproduceerbaar.

export interface ResponseRow {
  /** ApplicationStatus van de binnengekomen reactie. */
  status: string;
  /** Aanmaakmoment van de reactie (Application.createdAt, onveranderlijk). */
  createdAt: Date;
}

export type ResponsivenessTone = "good" | "neutral" | "warning" | "unknown";

export interface ClientResponsiveness {
  /** Aantal beschouwde reacties (opgepakt + nog open). */
  sampleSize: number;
  /** Reacties die de opdrachtgever heeft opgepakt (status !== NEW). */
  handled: number;
  /** Reacties die nog op NEW staan. */
  pending: number;
  /** Percentage opgepakt (handled / sampleSize); null onder de steekproefgrens. */
  handledPct: number | null;
  /** Leeftijd in dagen van de oudste nog-openstaande reactie; null als er niets open is. */
  oldestPendingDays: number | null;
  /** Aantal openstaande reacties dat langer dan STALE_DAYS open staat. */
  stalePending: number;
  tone: ResponsivenessTone;
}

// Grenzen voor de toon-bepaling (gedocumenteerd zodat aanpassen traceerbaar is).
const GOOD_MIN_HANDLED_PCT = 80; // ≥ 80% opgepakt én niets te lang open = goed
const WARNING_MAX_HANDLED_PCT = 50; // < 50% opgepakt = let op
const STALE_DAYS = 14; // een reactie die > 14 dagen op NEW staat = laat liggen
const MIN_SAMPLE_SIZE = 3;

const MS_PER_DAY = 86_400_000;

/**
 * Berekent het reactiebereidheid-signaal voor een opdrachtgever uit de bij zijn opdrachten
 * binnengekomen reacties. Puur en deterministisch; geschikt voor unit-tests zonder DB.
 *
 * `now` wordt geïnjecteerd zodat de leeftijd van openstaande reacties reproduceerbaar is.
 */
export function computeClientResponsiveness(
  rows: ResponseRow[],
  now: Date = new Date(),
): ClientResponsiveness {
  const sampleSize = rows.length;
  const pendingRows = rows.filter((r) => r.status === "NEW");
  const pending = pendingRows.length;
  const handled = sampleSize - pending;

  if (sampleSize < MIN_SAMPLE_SIZE) {
    return {
      sampleSize,
      handled,
      pending,
      handledPct: null,
      oldestPendingDays: null,
      stalePending: 0,
      tone: "unknown",
    };
  }

  const handledPct = Math.round((handled / sampleSize) * 100);

  // Leeftijd van openstaande reacties; negatieve waarden (createdAt in de toekomst = data-ruis)
  // worden op 0 geklemd zodat de leeftijd nooit misleidend negatief is.
  const pendingAges = pendingRows.map((r) =>
    Math.max(0, Math.floor((now.getTime() - r.createdAt.getTime()) / MS_PER_DAY)),
  );
  const oldestPendingDays = pendingAges.length > 0 ? Math.max(...pendingAges) : null;
  const stalePending = pendingAges.filter((d) => d >= STALE_DAYS).length;

  const tone = determineTone(handledPct, stalePending);

  return { sampleSize, handled, pending, handledPct, oldestPendingDays, stalePending, tone };
}

function determineTone(handledPct: number, stalePending: number): ResponsivenessTone {
  // Goed: bijna alles opgepakt én niets te lang laten liggen.
  if (handledPct >= GOOD_MIN_HANDLED_PCT && stalePending === 0) return "good";

  // Let op: weinig opgepakt, of reacties die te lang op NEW blijven hangen.
  if (handledPct < WARNING_MAX_HANDLED_PCT || stalePending > 0) return "warning";

  return "neutral";
}
