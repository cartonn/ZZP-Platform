// Annuleringsbetrouwbaarheid-signaal per opdrachtgever (Company). Spiegelbeeld van het
// betaalgedrag-signaal (`payment-behavior.ts`): waar dat laat zien hóe een opdrachtgever betaalt,
// laat dit zien hoe betrouwbaar de opdrachtgever zich aan afspraken houdt — hoe vaak hij agreed
// werk annuleert, en hoe vaak last-minute (de chargeable 7-dagen-snapshot). Puur en deterministisch;
// geen schema-wijziging, alleen geaggregeerde statistieken (privacy by design).
//
// --- Attributie ("byClient") ---
// Annuleren is symmetrisch: beide partijen kunnen annuleren (`Collaboration.cancelledById`). Een
// annulering telt alleen mee voor de betrouwbaarheid van de opdrachtgever als die door de
// opdrachtgever zelf is gestart. De data-laag bepaalt dat (`cancelledById === company.userId`,
// of definitioneel via de chargeable-snapshot die alleen bij een opdrachtgever-annulering wordt
// gezet) en levert het hier als boolean aan, zodat deze module vrij blijft van DB-kennis.

export interface CancellationRow {
  /** CollaborationStatus van de (afgewikkelde) samenwerking. */
  status: string;
  /** Annuleermoment; null = niet geannuleerd. */
  cancelledAt: Date | null;
  /** Door de opdrachtgever zelf gestart (zie attributie hierboven). */
  byClient: boolean;
  /** Last-minute: de chargeable 7-dagen-snapshot stond aan op het annuleermoment. */
  chargeable: boolean;
}

export type ReliabilityTone = "good" | "neutral" | "warning" | "unknown";

export interface ClientReliability {
  /** Aantal afgewikkelde toezeggingen (de noemer): afgerond + door de opdrachtgever geannuleerd. */
  sampleSize: number;
  /** Aantal door de opdrachtgever gestarte annuleringen (de teller). */
  cancellations: number;
  /** Deelverzameling daarvan die last-minute (chargeable) was. */
  lastMinute: number;
  /** Annuleringspercentage (cancellations / sampleSize); null onder de steekproefgrens. */
  cancelRate: number | null;
  tone: ReliabilityTone;
}

// Grenzen voor de toon-bepaling (gedocumenteerd zodat aanpassen traceerbaar is).
const WARNING_MIN_CANCEL_RATE = 25; // > 25% van de toezeggingen geannuleerd = let op
const MIN_SAMPLE_SIZE = 3;

/** Minimum-steekproef voordat een annuleringspercentage betrouwbaar is (gedeeld met de reputatie-kaart). */
export const RELIABILITY_MIN_SAMPLE_SIZE = MIN_SAMPLE_SIZE;

/**
 * Berekent het annuleringsbetrouwbaarheid-signaal voor een opdrachtgever uit zijn afgewikkelde
 * samenwerkingen. Puur en deterministisch; geschikt voor unit-tests zonder DB.
 *
 * Noemer ("sampleSize") = de toezeggingen die de opdrachtgever zelf heeft afgewikkeld: afgeronde
 * samenwerkingen plus zijn eigen annuleringen. Annuleringen door de ZZP'er tellen niet mee — die
 * zeggen niets over de betrouwbaarheid van de opdrachtgever en blijven dus buiten teller én noemer.
 */
export function computeClientReliability(rows: CancellationRow[]): ClientReliability {
  // Door de opdrachtgever zelf gestarte annuleringen vormen de teller.
  const clientCancellations = rows.filter((r) => r.byClient && r.cancelledAt != null);
  const cancellations = clientCancellations.length;
  const lastMinute = clientCancellations.filter((r) => r.chargeable).length;

  // Noemer: afgeronde samenwerkingen + de eigen annuleringen van de opdrachtgever. Defensief:
  // een rij die zowel COMPLETED is als een eigen annulering draagt mag niet dubbel tellen (in de
  // noemer via `completed` én via `cancellations`) — annulering wint, zodat de noemer klopt.
  const completed = rows.filter(
    (r) => r.status === "COMPLETED" && !(r.byClient && r.cancelledAt != null),
  ).length;
  const sampleSize = completed + cancellations;

  if (sampleSize < MIN_SAMPLE_SIZE) {
    return { sampleSize, cancellations, lastMinute, cancelRate: null, tone: "unknown" };
  }

  const cancelRate = Math.round((cancellations / sampleSize) * 100);
  const tone = determineTone(cancellations, lastMinute, cancelRate);

  return { sampleSize, cancellations, lastMinute, cancelRate, tone };
}

/**
 * Wat de opdrachtgever-facing UI mag tonen, afgeleid uit één bron van waarheid:
 *
 * - `"insufficient"` — onder de steekproefgrens (`tone === "unknown"`, d.w.z. `sampleSize < 3`):
 *   toon GEEN enkel ruw getal (geen `cancellations`/`lastMinute`/`sampleSize`), alleen een neutrale
 *   "te weinig data"-tekst. Dit is de k-anonimiteit-/dataminimalisatie-poort (AVG art. 5(1)(c)): een
 *   ZZP'er mag het annuleringsgedrag van een opdrachtgever niet op individueel niveau afleiden.
 * - `"clean"` — genoeg data én nooit geannuleerd: toon alleen de (geaggregeerde) steekproefomvang.
 * - `"stats"` — genoeg data mét annuleringen: toon het percentage + evt. last-minute + steekproef.
 *
 * De render-poort mag ALLEEN op deze functie leunen (nooit direct op ruwe velden), zodat een
 * refactor de privacy-poort niet stil kan loskoppelen van de sub-steekproefstaat. Bewust puur en
 * los unit-getest — de render-branch is daarmee deterministisch geborgd (rood→groen).
 */
export type ReliabilityDisplayMode = "insufficient" | "clean" | "stats";

export function reliabilityDisplayMode(reliability: ClientReliability): ReliabilityDisplayMode {
  // Sleutel op `tone === "unknown"` — exact equivalent aan `sampleSize < MIN_SAMPLE_SIZE` (zie
  // computeClientReliability): boven de grens levert determineTone nooit "unknown". Nooit op ruwe
  // getallen sleutelen: een sub-steekproefobject met cancellations > 0 hoort óók onderdrukt te worden.
  if (reliability.tone === "unknown") return "insufficient";
  if (reliability.cancellations === 0) return "clean";
  return "stats";
}

function determineTone(
  cancellations: number,
  lastMinute: number,
  cancelRate: number,
): ReliabilityTone {
  // Goed: nooit geannuleerd.
  if (cancellations === 0) return "good";

  // Let op: ooit last-minute geannuleerd, of een hoog annuleringspercentage.
  if (lastMinute > 0 || cancelRate > WARNING_MIN_CANCEL_RATE) return "warning";

  return "neutral";
}
