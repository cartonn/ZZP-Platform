// Weekoverzicht ("deze week") voor een ZZP'er met meerdere actieve samenwerkingen — pure logica
// (geen I/O). De server levert de actieve Collaboration-rijen (opdrachtgever, opdracht, periode,
// tarief); deze helper bepaalt deterministisch welke samenwerkingen in de ISO-week rond een
// referentiedatum lopen, classificeert de timing (loopt door / start / eindigt deze week) en
// sorteert zo dat samenwerkingen bij dezelfde opdrachtgever bij elkaar staan.
//
// Sinds ADR-0004 draagt een samenwerking een optioneel per-dag-weekrooster (`weekdays`): de
// werkelijke "ma bij A, wo bij B"-indeling, expliciet vastgelegd — niet afgeleid. Het overzicht
// geeft het mee wanneer aanwezig en valt anders terug op de timing-classificatie.

import { type Weekday } from "@/lib/enums";

const DAY_MS = 86_400_000;

export interface WeekCollaborationInput {
  collaborationId: string;
  clientId: string;
  clientName: string;
  jobTitle: string;
  startDate: Date | null;
  endDate: Date | null;
  /** Uurtarief in centen, of null als (nog) niet vastgelegd. */
  rate: number | null;
  /**
   * Vastgelegde weekdagen voor deze samenwerking (ADR-0004), canoniek geordend. Lege/ontbrekende
   * lijst = niet vastgelegd; het overzicht valt dan terug op de timing. Optioneel zodat bestaande
   * aanroepers ongewijzigd blijven.
   */
  weekdays?: Weekday[];
}

export type WeekTiming = "ongoing" | "starts-this-week" | "ends-this-week" | "starts-and-ends";

export interface WeekCollaborationEntry extends WeekCollaborationInput {
  timing: WeekTiming;
}

export interface WeekOverview {
  /** Maandag 00:00:00.000 UTC van de ISO-week. */
  weekStart: Date;
  /** Zondag 23:59:59.999 UTC van de ISO-week. */
  weekEnd: Date;
  /** Actieve samenwerkingen die deze week lopen, gesorteerd (opdrachtgever → start → id). */
  entries: WeekCollaborationEntry[];
  /** Aantal verschillende opdrachtgevers deze week. */
  clientCount: number;
}

/** Maandag 00:00:00.000 UTC van de ISO-week die `ref` bevat. UTC houdt het tijdzone-onafhankelijk. */
export function startOfIsoWeek(ref: Date): Date {
  const midnight = Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate());
  const dow = new Date(midnight).getUTCDay(); // 0 = zondag .. 6 = zaterdag
  const isoOffset = (dow + 6) % 7; // maandag = 0 .. zondag = 6
  return new Date(midnight - isoOffset * DAY_MS);
}

function within(at: Date, start: Date, end: Date): boolean {
  return at.getTime() >= start.getTime() && at.getTime() <= end.getTime();
}

function classify(c: WeekCollaborationInput, weekStart: Date, weekEnd: Date): WeekTiming {
  const starts = c.startDate !== null && within(c.startDate, weekStart, weekEnd);
  const ends = c.endDate !== null && within(c.endDate, weekStart, weekEnd);
  if (starts && ends) return "starts-and-ends";
  if (starts) return "starts-this-week";
  if (ends) return "ends-this-week";
  return "ongoing";
}

/**
 * Bouwt het weekoverzicht voor de ISO-week rond `reference`. Een samenwerking telt mee als ze de
 * week overlapt: gestart op of voor het weekeinde én (open einde of) eindigend op of na het weekbegin.
 * Een open `startDate` (null) telt als "loopt al" en wordt meegenomen.
 */
export function weekOverview(
  collaborations: readonly WeekCollaborationInput[],
  reference: Date,
): WeekOverview {
  const weekStart = startOfIsoWeek(reference);
  const weekEnd = new Date(weekStart.getTime() + 7 * DAY_MS - 1);

  const entries = collaborations
    .filter((c) => {
      const startsBeforeEnd = c.startDate === null || c.startDate.getTime() <= weekEnd.getTime();
      const endsAfterStart = c.endDate === null || c.endDate.getTime() >= weekStart.getTime();
      return startsBeforeEnd && endsAfterStart;
    })
    .map<WeekCollaborationEntry>((c) => ({ ...c, timing: classify(c, weekStart, weekEnd) }))
    .sort((a, b) => {
      if (a.clientName !== b.clientName) return a.clientName.localeCompare(b.clientName);
      const sa = a.startDate?.getTime() ?? -Infinity;
      const sb = b.startDate?.getTime() ?? -Infinity;
      if (sa !== sb) return sa - sb;
      return a.collaborationId.localeCompare(b.collaborationId);
    });

  const clientCount = new Set(entries.map((e) => e.clientId)).size;
  return { weekStart, weekEnd, entries, clientCount };
}
