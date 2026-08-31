// Beschikbaarheids-logica: pure helpers voor het samenvatten van beschikbaarheidsvensters.
// Server-side waarheid; UI toont alleen. Pure functies, getest.

import { type AvailabilityWindowType } from "@/lib/enums";
import { formatDateShortNl } from "@/lib/format-date";

export interface WindowLike {
  startDate: Date;
  endDate: Date;
  type: AvailabilityWindowType;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// De einddatum is INCLUSIEF ("Tot en met"); een <input type=date> levert hem als middernacht UTC.
// Het venster dekt dus de hele einddag — effectief tot de eerstvolgende middernacht (exclusief).
// Zonder dit verdween een venster dat "t/m vandaag" liep al om 00:00 op de laatste dag.
function inclusiveEndMs(w: WindowLike): number {
  return w.endDate.getTime() + DAY_MS;
}
function covers(w: WindowLike, nowMs: number): boolean {
  return w.startDate.getTime() <= nowMs && inclusiveEndMs(w) > nowMs;
}

/** Vensters die nu of in de toekomst eindigen (einddatum inclusief), oplopend op startdatum. */
export function upcomingWindows<T extends WindowLike>(
  windows: readonly T[],
  now: Date = new Date(),
): T[] {
  return windows
    .filter((w) => inclusiveEndMs(w) > now.getTime())
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

/**
 * Het venster dat `now` dekt, of anders het eerstvolgende — alleen AVAILABLE/LIMITED telt als
 * "inzetbaar". Een UNAVAILABLE-venster dat `now` dekt DOMINEERT: de ZZP'er heeft zich expliciet
 * onbeschikbaar gemaakt, ook al overlapt er een ruimer inzetbaar venster → dan niets inzetbaars nu.
 */
export function currentOrNextAvailable<T extends WindowLike>(
  windows: readonly T[],
  now: Date = new Date(),
): T | null {
  const nowMs = now.getTime();
  const up = upcomingWindows(windows, now);
  const blockedNow = up.some((w) => w.type === "UNAVAILABLE" && covers(w, nowMs));
  const usable = up.filter((w) => w.type !== "UNAVAILABLE");
  const covering = blockedNow ? undefined : usable.find((w) => covers(w, nowMs));
  // Geen dekkend inzetbaar venster nu → het eerstvolgende dat ná nu start (niet een venster dat nu
  // overlapt maar geblokkeerd is door een UNAVAILABLE-periode).
  const next = usable.find((w) => w.startDate.getTime() > nowMs);
  return covering ?? next ?? null;
}

/**
 * Beschikbaarheid op één specifieke datum (bv. de startdatum van een opdracht). Een
 * UNAVAILABLE-venster dat de datum dekt DOMINEERT (de ZZP'er heeft zich expliciet
 * onbeschikbaar gemaakt), ook als er een ruimer inzetbaar venster overlapt. Anders wint
 * AVAILABLE boven LIMITED. Dekt geen enkel venster de datum → "NONE".
 */
export function availabilityOnDate(
  windows: readonly WindowLike[],
  date: Date,
): "AVAILABLE" | "LIMITED" | "UNAVAILABLE" | "NONE" {
  const dateMs = date.getTime();
  const covering = windows.filter((w) => covers(w, dateMs));
  if (covering.some((w) => w.type === "UNAVAILABLE")) return "UNAVAILABLE";
  if (covering.some((w) => w.type === "AVAILABLE")) return "AVAILABLE";
  if (covering.some((w) => w.type === "LIMITED")) return "LIMITED";
  return "NONE";
}

/** Korte NL-samenvatting van de beschikbaarheid, of `null` als er niets inzetbaars is. */
export function summarizeAvailability(
  windows: readonly WindowLike[],
  now: Date = new Date(),
): string | null {
  const w = currentOrNextAvailable(windows, now);
  if (!w) return null;
  const label = w.type === "LIMITED" ? "Beperkt beschikbaar" : "Beschikbaar";
  const isNow = w.startDate.getTime() <= now.getTime();
  return isNow
    ? `${label} t/m ${formatDateShortNl(w.endDate)}`
    : `${label} vanaf ${formatDateShortNl(w.startDate)}`;
}

/**
 * De inclusieve einddatum van de afwezigheid wanneer `now` in een UNAVAILABLE-venster valt —
 * het venster met de láátste einddatum wint (aaneengesloten of overlappende vakantieperiodes tellen
 * als één afwezigheid t/m de verste datum). `null` als de ZZP'er nu niet expliciet onbeschikbaar is.
 *
 * Dit is de tegenhanger van `summarizeAvailability` voor het gat dat die openlaat: zit iemand nu in
 * een "niet beschikbaar"-periode zónder later inzetbaar venster, dan geeft `summarizeAvailability`
 * `null` en verdween de vakantie stil van de opdrachtgever-schermen. `awayUntil` maakt die afwezigheid
 * expliciet zichtbaar ("Afwezig t/m X") i.p.v. ononderscheidbaar van "geen agenda gedeeld".
 */
export function awayUntil(windows: readonly WindowLike[], now: Date = new Date()): Date | null {
  const nowMs = now.getTime();
  const covering = windows.filter((w) => w.type === "UNAVAILABLE" && covers(w, nowMs));
  if (covering.length === 0) return null;
  return covering.reduce((latest, w) =>
    w.endDate.getTime() > latest.endDate.getTime() ? w : latest,
  ).endDate;
}

/**
 * Korte NL-samenvatting van de afwezigheid ("Afwezig t/m 15 aug 2026"), of `null` als de ZZP'er nu
 * niet expliciet onbeschikbaar is. Bedoeld als muted signaal náást (niet vermengd met) de groene
 * `summarizeAvailability`: een afwezige ZZP'er is géén "beschikbaar"-signaal.
 */
export function summarizeAway(
  windows: readonly WindowLike[],
  now: Date = new Date(),
): string | null {
  const until = awayUntil(windows, now);
  return until ? `Afwezig t/m ${formatDateShortNl(until)}` : null;
}

/** Of de ZZP'er meetelt als "beschikbaar" op de opdrachtgever-schermen, plus de afwezigheid-samenvatting. */
export interface UsableAvailability {
  /**
   * Telt de ZZP'er nú mee bij het "Alleen beschikbaar"-filter/sortering: een inzetbaar venster, óf de
   * scalaire fallback (AVAILABLE/LIMITED) — maar NIET wanneer hij nu in een afwezigheidsvenster zit.
   */
  hasAvailability: boolean;
  /** "Afwezig t/m …" wanneer hij nú weg is (en geen inzetbaar venster dekt); anders `null`. */
  awaySummary: string | null;
}

/**
 * Bepaalt of een profiel als "beschikbaar" bovenkomt op de opdrachtgever-vindoppervlakken, exact zoals
 * `freelancer-search.ts` het `availabilitySummary`-veld afleidt: een inzetbaar venster wint; anders valt
 * het terug op het scalaire veld (AVAILABLE/LIMITED) — TENZIJ de ZZP'er nu in een expliciet
 * "niet beschikbaar"-venster zit (vakantie). In dat afwezigheidsgeval onderdrukt de zoeklijst de
 * scalar-fallback (`availabilitySummary` wordt `null`, hij valt uit "Alleen beschikbaar"); deze helper
 * spiegelt dat zodat afgeleide UI (bv. de vindbaarheid-kaart) niet ten onrechte "beschikbaar" claimt
 * terwijl de ZZP'er weg is. Puur — `now` en het scalar-signaal worden geïnjecteerd.
 *
 * @param scalarAvailable of het scalaire `availability`-veld AVAILABLE of LIMITED is (de fallback-bron).
 */
export function usableAvailability(
  windows: readonly WindowLike[],
  scalarAvailable: boolean,
  now: Date = new Date(),
): UsableAvailability {
  const windowSummary = summarizeAvailability(windows, now);
  if (windowSummary !== null) return { hasAvailability: true, awaySummary: null };
  const awaySummary = summarizeAway(windows, now);
  return {
    // Afwezig nu → geen "beschikbaar"-signaal (spiegelt de away-suppressie in freelancer-search.ts).
    hasAvailability: awaySummary === null && scalarAvailable,
    awaySummary,
  };
}

/** Versheid van de gedeelde beschikbaarheidsagenda. */
export type AvailabilityFreshnessStatus = "fresh" | "expired" | "empty";

export interface AvailabilityFreshness {
  /**
   * - `fresh`   : minstens één venster dekt nu of de toekomst — opdrachtgevers zien wanneer de ZZP'er kan.
   * - `expired` : er zijn wél vensters, maar alle einddata liggen in het verleden — de agenda is verouderd
   *               en zegt opdrachtgevers niets meer over toekomstige inzet.
   * - `empty`   : er is nooit een venster gedeeld.
   */
  status: AvailabilityFreshnessStatus;
  /** Totaal aantal vensters (vers of verlopen). */
  total: number;
}

/**
 * Duidt of de gedeelde beschikbaarheidsagenda nog toekomstwaarde heeft. Puur afgeleid uit de
 * einddata (inclusief, zie `inclusiveEndMs`) — het `type` doet er niet toe: ook een toekomstig
 * UNAVAILABLE-venster betekent dat de ZZP'er de agenda actueel houdt. Basis voor de "werk je
 * beschikbaarheid bij"-nudge: alleen een `expired`-agenda is misleidend (opdrachtgevers zien geen
 * enkele toekomstige inzetperiode meer), terwijl `empty` een onboarding-/compleetheidsvraag is.
 */
export function summarizeAvailabilityFreshness(
  windows: readonly WindowLike[],
  now: Date = new Date(),
): AvailabilityFreshness {
  const total = windows.length;
  if (total === 0) return { status: "empty", total: 0 };
  const hasUpcoming = upcomingWindows(windows, now).length > 0;
  return { status: hasUpcoming ? "fresh" : "expired", total };
}
