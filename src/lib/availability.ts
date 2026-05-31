// Beschikbaarheids-logica: pure helpers voor het samenvatten van beschikbaarheidsvensters.
// Server-side waarheid; UI toont alleen. Pure functies, getest.

import { type AvailabilityWindowType } from "@/lib/enums";

export interface WindowLike {
  startDate: Date;
  endDate: Date;
  type: AvailabilityWindowType;
}

/** Vensters die nu of in de toekomst eindigen, oplopend op startdatum. */
export function upcomingWindows<T extends WindowLike>(
  windows: readonly T[],
  now: Date = new Date(),
): T[] {
  return windows
    .filter((w) => w.endDate.getTime() >= now.getTime())
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

/** Het venster dat `now` dekt, of anders het eerstvolgende — alleen AVAILABLE/LIMITED telt als "inzetbaar". */
export function currentOrNextAvailable<T extends WindowLike>(
  windows: readonly T[],
  now: Date = new Date(),
): T | null {
  const usable = upcomingWindows(windows, now).filter((w) => w.type !== "UNAVAILABLE");
  const covering = usable.find(
    (w) => w.startDate.getTime() <= now.getTime() && w.endDate.getTime() >= now.getTime(),
  );
  return covering ?? usable[0] ?? null;
}

const fmt = (d: Date) => d.toISOString().slice(0, 10);

/** Korte NL-samenvatting van de beschikbaarheid, of `null` als er niets inzetbaars is. */
export function summarizeAvailability(
  windows: readonly WindowLike[],
  now: Date = new Date(),
): string | null {
  const w = currentOrNextAvailable(windows, now);
  if (!w) return null;
  const label = w.type === "LIMITED" ? "Beperkt beschikbaar" : "Beschikbaar";
  const isNow = w.startDate.getTime() <= now.getTime();
  return isNow ? `${label} t/m ${fmt(w.endDate)}` : `${label} vanaf ${fmt(w.startDate)}`;
}
