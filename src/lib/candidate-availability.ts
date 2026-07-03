// Beschikbaarheid van een kandidaat op de startdatum van één specifieke opdracht. Beslis-hulp voor
// de opdrachtgever op /kandidaten en /kandidaten/vergelijk: niet "heeft deze ZZP'er een agenda
// gedeeld?" maar "kan hij starten wanneer ik hem nodig heb?". Pidz/Temper/Zorgwerk gaten hier hard
// op; wij vertalen dat naar onze bestaande, gedeelde beschikbaarheidsvensters.
//
// Puur en deterministisch: geen DB, geen tijd van zichzelf, muteert niets. Leunt volledig op
// `availabilityOnDate` (één bron voor de inclusieve-einddatum-logica).

import { availabilityOnDate, type WindowLike } from "@/lib/availability";

export type StartFit = "available" | "limited" | "blocked" | "none" | "unknown";

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
