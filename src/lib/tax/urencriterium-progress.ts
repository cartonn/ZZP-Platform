// Pure presentatie-helpers voor de urencriterium-voortgangskaart. Losgehouden van de React-component
// (`src/components/tax/urencriterium-progress.tsx`) zodat de kleur-/pill-keuze los testbaar is zonder
// jsdom. Eén bron van waarheid voor beide oppervlakken die de kaart tonen (/inzicht + /ontzorgd/uren).

import type { HoursPaceFeasibility } from "@/lib/tax/hours-criterion-summary";

/** Tailwind-vullingskleur van de voortgangsbalk, afhankelijk van de stand. */
export type HoursProgressTone = "bg-success" | "bg-primary" | "bg-muted-foreground";

/** Badge-variant voor de haalbaarheids-pill. */
export type HoursFeasibilityPillVariant = "accent" | "warning" | "danger";

export interface HoursFeasibilityPill {
  label: string;
  variant: HoursFeasibilityPillVariant;
}

/**
 * Haalbaarheids-pill: alleen bij achterstand (niet gehaald én prognose haalt de grens niet). Vertaalt
 * het benodigde weektempo naar een glanceable oordeel. `gehaald`/`op-koers` tonen geen pill — die
 * standen spreken al positief uit de uitlegzin.
 */
export const FEASIBILITY_PILL: Partial<Record<HoursPaceFeasibility, HoursFeasibilityPill>> = {
  haalbaar: { label: "Nog haalbaar", variant: "accent" },
  ambitieus: { label: "Ambitieus tempo", variant: "warning" },
  onhaalbaar: { label: "Dit jaar niet meer", variant: "danger" },
};

/**
 * Kleur van de voortgangsbalk: groen als het criterium al gehaald is, primair als de prognose de
 * grens nog haalt, anders neutraal (achterstand). Pure functie.
 */
export function hoursProgressTone(summary: {
  met: boolean;
  projectedMet: boolean;
}): HoursProgressTone {
  if (summary.met) return "bg-success";
  if (summary.projectedMet) return "bg-primary";
  return "bg-muted-foreground";
}

/**
 * De haalbaarheids-pill voor deze stand, of `undefined` wanneer er geen pill hoort (nog geen activiteit,
 * of een stand — `gehaald`/`op-koers` — die al positief uit de uitlegzin spreekt). Pure functie.
 */
export function hoursFeasibilityPill(summary: {
  noActivity: boolean;
  feasibility: HoursPaceFeasibility;
}): HoursFeasibilityPill | undefined {
  if (summary.noActivity) return undefined;
  return FEASIBILITY_PILL[summary.feasibility];
}
