// Beschikbaarheid van een kandidaat op de startdatum van één specifieke opdracht. Beslis-hulp voor
// de opdrachtgever op /kandidaten en /kandidaten/vergelijk: niet "heeft deze ZZP'er een agenda
// gedeeld?" maar "kan hij starten wanneer ik hem nodig heb?". Pidz/Temper/Zorgwerk gaten hier hard
// op; wij vertalen dat naar onze bestaande, gedeelde beschikbaarheidsvensters.
//
// Puur en deterministisch: geen DB, geen tijd van zichzelf, muteert niets. Leunt volledig op
// `availabilityOnDate` (één bron voor de inclusieve-einddatum-logica).

import { availabilityOnDate, type WindowLike } from "@/lib/availability";
import { formatDateShortNl } from "@/lib/format-date";

export type StartFit = "available" | "limited" | "blocked" | "none" | "unknown";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Classificeert of een kandidaat beschikbaar is op de startdatum van de opdracht.
 *
 * - `unknown`   — de opdracht heeft geen startdatum, óf de ZZP'er heeft geen agenda gedeeld
 *                 (geen oordeel mogelijk; toon niets i.p.v. iets misleidends).
 * - `blocked`   — een UNAVAILABLE-venster dekt de startdatum (expliciet niet beschikbaar).
 * - `available` — een AVAILABLE-venster dekt de startdatum.
 * - `limited`   — alleen een LIMITED-venster dekt de startdatum (beperkt inzetbaar).
 * - `none`      — er is wel een agenda, maar geen venster dekt de startdatum.
 */
export function classifyStartFit(
  windows: readonly WindowLike[],
  jobStart: Date | null | undefined,
): StartFit {
  if (!jobStart) return "unknown";
  if (windows.length === 0) return "unknown";
  switch (availabilityOnDate(windows, jobStart)) {
    case "AVAILABLE":
      return "available";
    case "LIMITED":
      return "limited";
    case "UNAVAILABLE":
      return "blocked";
    case "NONE":
      return "none";
  }
}

export const START_FIT_LABEL: Record<Exclude<StartFit, "unknown">, string> = {
  available: "Beschikbaar op de startdatum",
  limited: "Beperkt beschikbaar op de startdatum",
  blocked: "Niet beschikbaar op de startdatum",
  none: "Geen agenda rond de startdatum",
};

/** Compact label voor de vergelijk-tabel (de startdatum staat al in de context). */
export const START_FIT_SHORT_LABEL: Record<Exclude<StartFit, "unknown">, string> = {
  available: "Beschikbaar",
  limited: "Beperkt",
  blocked: "Niet beschikbaar",
  none: "Geen agenda",
};

export type StartFitVariant = "success" | "warning" | "danger" | "muted";

export const START_FIT_VARIANT: Record<Exclude<StartFit, "unknown">, StartFitVariant> = {
  available: "success",
  limited: "warning",
  blocked: "danger",
  none: "muted",
};

/** Hoe ver vooruit we naar een eerstvolgende vrije dag zoeken (kalenderdagen). */
export const NEXT_FIT_HORIZON_DAYS = 90;

export interface NextFit {
  /** De eerstvolgende dag (op/ná de startdatum) waarop de kandidaat inzetbaar is (UTC-middernacht). */
  date: Date;
  /** Inzetbaarheid op die dag: volledig of beperkt. */
  fit: "available" | "limited";
  /** Hele dagen ná de startdatum (0 = de startdatum zelf). */
  daysFromStart: number;
}

/**
 * Zoekt de eerstvolgende dag op of ná `jobStart` waarop de kandidaat inzetbaar is (AVAILABLE of
 * LIMITED), binnen een horizon van `horizonDays` kalenderdagen. Bedoeld voor het geval de kandidaat
 * op de startdatum zélf niet inzetbaar is (`blocked`/`none`): dan kan de opdrachtgever/bemiddelaar de
 * startdatum bijstellen of vooruit plannen i.p.v. een sterke match af te schrijven.
 *
 * Puur en deterministisch: geen DB, geen eigen klok, muteert niets. Scant per kalenderdag en
 * hergebruikt `availabilityOnDate`, zodat het oordeel exact strookt met `classifyStartFit` (één bron
 * van waarheid). Geeft `null` als er geen startdatum/agenda is of binnen de horizon geen inzetbare dag.
 */
export function nextFitAfterStart(
  windows: readonly WindowLike[],
  jobStart: Date | null | undefined,
  horizonDays: number = NEXT_FIT_HORIZON_DAYS,
): NextFit | null {
  if (!jobStart) return null;
  if (windows.length === 0) return null;
  // Normaliseer naar UTC-middernacht zodat de dagstappen op de venster-granulariteit vallen (de
  // vensters komen uit een <input type=date> → middernacht UTC).
  const startMs = Date.UTC(
    jobStart.getUTCFullYear(),
    jobStart.getUTCMonth(),
    jobStart.getUTCDate(),
  );
  const horizon = Math.max(0, Math.floor(horizonDays));
  for (let i = 0; i <= horizon; i++) {
    const day = new Date(startMs + i * DAY_MS);
    const a = availabilityOnDate(windows, day);
    if (a === "AVAILABLE" || a === "LIMITED") {
      return { date: day, fit: a === "AVAILABLE" ? "available" : "limited", daysFromStart: i };
    }
  }
  return null;
}

/** Kort NL-label voor het eerstvolgende-vrije-dag-signaal, bv. "Vrij vanaf 15 jul". */
export function nextFitLabel(next: NextFit): string {
  const prefix = next.fit === "limited" ? "Beperkt vrij vanaf" : "Vrij vanaf";
  return `${prefix} ${formatDateShortNl(next.date)}`;
}
