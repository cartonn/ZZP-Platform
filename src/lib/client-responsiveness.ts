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
  // Een door de ZZP'er ingetrokken reactie zegt niets over de bereidheid van de opdrachtgever en zou
  // (omdat de status niet meer NEW is) ten onrechte als "opgepakt" meetellen — daarom uit de steekproef.
  const considered = rows.filter((r) => r.status !== "WITHDRAWN");
  const sampleSize = considered.length;
  const pendingRows = considered.filter((r) => r.status === "NEW");
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

/**
 * Vertaalt het (opdrachtgever-brede) reactiebereidheid-signaal naar een korte context voor de ZZP'er
 * die nog op antwoord wacht: is het zinvol door te wachten, of pakt deze opdrachtgever reacties
 * doorgaans niet op? Spiegelt hetzelfde geaggregeerde signaal dat op de opdracht-detail staat, maar
 * gericht op de wacht-beslissing. Geeft `null` terug wanneer het signaal geen beslissingswaarde
 * toevoegt (te weinig historie → `unknown`, of `neutral` — dan is elke boodschap misleidend). Puur en
 * deterministisch. Toont uitsluitend geaggregeerde tellingen — nooit een reactie van een andere ZZP'er.
 */
export function describeApplicantResponsiveness(
  responsiveness: ClientResponsiveness,
): { tone: "good" | "warning"; label: string } | null {
  const { tone, handledPct } = responsiveness;

  if (tone === "good") {
    return { tone: "good", label: "Deze opdrachtgever pakt reacties doorgaans op." };
  }

  if (tone === "warning") {
    // De waarschuwing kan twee oorzaken hebben (zie determineTone): een lage oppak-graad óf reacties
    // die te lang blijven liggen. Laat de tekst de oorzaak volgen — "pakt reacties vaak niet op" bij
    // een hoog percentage (stale-gedreven) leest tegenstrijdig.
    const lowPickup = handledPct != null && handledPct < WARNING_MAX_HANDLED_PCT;
    if (lowPickup) {
      return {
        tone: "warning",
        label: `Deze opdrachtgever pakt reacties vaak niet op (${handledPct}% opgepakt) — overweeg ook andere opdrachten.`,
      };
    }
    // Redelijke oppak-graad maar iets blijft lang liggen (stalePending > 0).
    return {
      tone: "warning",
      label: "Deze opdrachtgever laat reacties soms lang liggen — overweeg ook andere opdrachten.",
    };
  }

  return null;
}

/**
 * Compacte chip-variant van het reactiebereidheid-signaal voor de browse-/triage-lijst (`/opdrachten`):
 * pakt deze opdrachtgever binnengekomen reacties doorgaans op, of laat hij ze liggen? De list-tegenhanger
 * van het `ClientResponsivenessBlock` dat al op de opdracht-detailpagina staat — zodat de ZZP'er dit ziet
 * vóór hij zijn tijd in een reactie steekt. Toont uitsluitend de beslis-relevante uitersten (`good`/
 * `warning`) en geeft `null` bij `neutral`/`unknown`, zodat de lijst rustig blijft. Puur en deterministisch;
 * uitsluitend geaggregeerde tellingen — nooit een reactie van een andere ZZP'er. De labels volgen de
 * module-taal ("oppakken" / "laten liggen") en spreken het detailblok dus niet tegen.
 */
export function responsivenessChip(
  responsiveness: ClientResponsiveness,
): { tone: "good" | "warning"; label: string } | null {
  if (responsiveness.tone === "good") {
    return { tone: "good", label: "Pakt reacties op" };
  }
  if (responsiveness.tone === "warning") {
    return { tone: "warning", label: "Laat reacties liggen" };
  }
  return null;
}

function determineTone(handledPct: number, stalePending: number): ResponsivenessTone {
  // Goed: bijna alles opgepakt én niets te lang laten liggen.
  if (handledPct >= GOOD_MIN_HANDLED_PCT && stalePending === 0) return "good";

  // Let op: weinig opgepakt, of reacties die te lang op NEW blijven hangen.
  if (handledPct < WARNING_MAX_HANDLED_PCT || stalePending > 0) return "warning";

  return "neutral";
}
