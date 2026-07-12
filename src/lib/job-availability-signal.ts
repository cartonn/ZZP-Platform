import { type AvailabilityWindowType } from "@/lib/enums";

/**
 * Beschikbaarheidssignaal op de opdracht-detail: valt de startdatum van een opdracht in een periode
 * die de ZZP'er zelf op onbeschikbaar of beperkt heeft gezet? Zo ja, dan waarschuwen we vóór het
 * reageren — de ZZP'er voorkomt dat hij zich op een klus vastlegt die botst met zijn eigen agenda.
 *
 * Server-side waarheid: de vensters komen uit `AvailabilityWindow` (eigen profiel); deze helper is
 * puur en beslist niets over toegang — het is een advies-signaal.
 */

export interface AvailabilityWindowInput {
  readonly startDate: Date;
  readonly endDate: Date;
  readonly type: AvailabilityWindowType;
  readonly note?: string | null;
}

export interface JobAvailabilitySignal {
  /** UNAVAILABLE weegt zwaarder (blokkerend gevoel) dan LIMITED (let-op). */
  readonly windowType: "UNAVAILABLE" | "LIMITED";
  readonly windowStart: Date;
  readonly windowEnd: Date;
  readonly note: string | null;
}

/**
 * Bepaalt of `startDate` binnen een UNAVAILABLE- of LIMITED-venster valt. AVAILABLE-vensters en
 * vensters die volledig in het verleden liggen tellen niet mee. Bij meerdere overlappende vensters
 * wint UNAVAILABLE boven LIMITED (zwaarste signaal eerst); daarbinnen het venster met de vroegste
 * startdatum voor determinisme. Geeft `null` als er geen relevant venster is (geen startdatum,
 * geen vensters, of alles op AVAILABLE).
 */
export function assessJobStartAvailability(
  startDate: Date | null | undefined,
  windows: readonly AvailabilityWindowInput[],
  now: Date = new Date(),
): JobAvailabilitySignal | null {
  if (!startDate) return null;

  const start = startDate.getTime();

  const matches = windows.filter((w) => {
    if (w.type !== "UNAVAILABLE" && w.type !== "LIMITED") return false;
    // Voorbije vensters zijn niet relevant meer voor een aankomende opdracht.
    if (w.endDate.getTime() < now.getTime()) return false;
    // Inclusief bereik: [windowStart, windowEnd] bevat de startdatum.
    return w.startDate.getTime() <= start && start <= w.endDate.getTime();
  });

  if (matches.length === 0) return null;

  // UNAVAILABLE eerst; daarbinnen de vroegste start. Zo krijgt de ZZP'er het zwaarste signaal.
  const rank = (t: AvailabilityWindowType) => (t === "UNAVAILABLE" ? 0 : 1);
  matches.sort((a, b) => {
    const byType = rank(a.type) - rank(b.type);
    if (byType !== 0) return byType;
    return a.startDate.getTime() - b.startDate.getTime();
  });

  const best = matches[0];
  if (!best) return null;
  return {
    windowType: best.type as "UNAVAILABLE" | "LIMITED",
    windowStart: best.startDate,
    windowEnd: best.endDate,
    note: best.note ?? null,
  };
}
