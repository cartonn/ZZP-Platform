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
