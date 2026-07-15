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

export interface JobAvailabilityChip {
  readonly label: string;
  /**
   * `block` = de ZZP'er heeft zich onbeschikbaar gemaakt (zwaarste signaal, waarschuwingskleur);
   * `limited` = beperkt beschikbaar (rustige let-op-kleur).
   */
  readonly tone: "block" | "limited";
}

/**
 * Compacte lijst-chip voor het beschikbaarheidssignaal op de browse-lijst. Vertaalt het
 * detail-signaal (`assessJobStartAvailability`) naar één korte NL-label + toon, zodat de ZZP'er
 * al bij het triageren ziet dat een opdracht botst met zijn eigen agenda — vóór hij zijn tijd in
 * een reactie steekt. `null` als er geen relevant venster is (dan blijft de lijst rustig).
 */
export function jobAvailabilityChip(
  signal: JobAvailabilitySignal | null,
): JobAvailabilityChip | null {
  if (!signal) return null;
  return signal.windowType === "UNAVAILABLE"
    ? { label: "Je bent dan niet beschikbaar", tone: "block" }
    : { label: "Dan beperkt beschikbaar", tone: "limited" };
}
