// Nabijheids-/reistijdsignaal per kandidaat voor de opdrachtgever op /kandidaten. Voor een opdracht
// op locatie (ONSITE/HYBRID) is "hoe ver reist deze kandidaat?" een concrete keuzefactor: dichtbij
// betekent betrouwbaarder opdagen en minder reisbelasting. Spiegelt het reistijdsignaal dat de ZZP'er
// al op de opdracht-detailpagina ziet, nu naar de opdrachtgever. Pure functie, geen I/O; hergebruikt
// de bestaande estimateTravelMinutes-stub (mensenwerk vervangt die later door een echte
// routing-provider — het aangrijpingspunt blijft dan gelijk).

import { estimateTravelMinutes } from "@/lib/services/travel-distance";

export type ProximityLevel = "near" | "moderate" | "far";

export interface CandidateProximity {
  /** Geschatte reistijd enkele reis, in minuten. */
  minutes: number;
  level: ProximityLevel;
}

// Drempels (minuten enkele reis). Grove, uitlegbare buckets — geen schijnprecisie.
export const PROXIMITY_NEAR_MAX = 30;
export const PROXIMITY_MODERATE_MAX = 75;

/**
 * Bepaalt het reistijdsignaal van een kandidaat naar de opdracht, of `null` (geen chip) wanneer het
 * niet relevant of niet te schatten is:
 * - een volledig remote opdracht (`REMOTE`): reistijd is niet van belang;
 * - een onbekende plaats aan één van beide kanten (`estimateTravelMinutes` → null).
 * Zo tonen we nooit een misleidend of irrelevant signaal.
 */
export function classifyCandidateProximity(input: {
  jobWorkMode: string;
  jobLocation: string | null | undefined;
  candidateLocation: string | null | undefined;
}): CandidateProximity | null {
  if (input.jobWorkMode === "REMOTE") return null;
  const minutes = estimateTravelMinutes(input.candidateLocation, input.jobLocation);
  if (minutes == null) return null;
  const level: ProximityLevel =
    minutes <= PROXIMITY_NEAR_MAX ? "near" : minutes <= PROXIMITY_MODERATE_MAX ? "moderate" : "far";
  return { minutes, level };
}

export const PROXIMITY_LABEL: Record<ProximityLevel, string> = {
  near: "Dichtbij",
  moderate: "Reistijd",
  far: "Ver weg",
};

export const PROXIMITY_VARIANT: Record<ProximityLevel, "success" | "muted" | "warning"> = {
  near: "success",
  moderate: "muted",
  far: "warning",
};

// Tekstkleur voor een compacte inline-chip (bv. de metadata-regel van de opdrachtenlijst), waar een
// vol Badge te zwaar is. Spiegelt PROXIMITY_VARIANT: dichtbij is een pluspunt (success), ver weg vraagt
// aandacht (warning), reistijd ertussenin blijft neutraal (geen extra kleur → erft muted-tekst).
export const PROXIMITY_TONE_CLASS: Record<ProximityLevel, string> = {
  near: "text-success",
  moderate: "",
  far: "text-warning",
};

/** Volledig chip-label incl. geschatte minuten, bv. "Dichtbij · ~18 min". */
export function proximityLabel(p: CandidateProximity): string {
  return `${PROXIMITY_LABEL[p.level]} · ~${p.minutes} min`;
}
