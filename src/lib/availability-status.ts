// Snelle beschikbaarheidsstatus — pure presentatie-/validatielogica voor de één-klik-toggle
// op /beschikbaarheid. De ZZP'er zet zijn persistente `availability`-status (op het profiel)
// zonder het volledige profielformulier te openen. Server-side waarheid: de UI toont alleen,
// de server valideert en schrijft. Pure functies, geen I/O — getest.

import { z } from "zod";
import { type Availability } from "@/lib/enums";

// UNKNOWN is een impliciete begintoestand, geen keuze die de ZZP'er zelf zet. De toggle biedt
// daarom uitsluitend de drie betekenisvolle statussen aan.
export const SELECTABLE_AVAILABILITIES = ["AVAILABLE", "LIMITED", "UNAVAILABLE"] as const;
export type SelectableAvailability = (typeof SELECTABLE_AVAILABILITIES)[number];

/** Zod-schema voor de statuskeuze — weigert UNKNOWN en elke onbekende waarde. */
export const availabilityStatusSchema = z.enum(SELECTABLE_AVAILABILITIES);

export interface AvailabilityStatusOption {
  value: SelectableAvailability;
  /** Korte knop-tekst. */
  label: string;
  /** Toelichting onder de keuze / voor schermlezers. */
  hint: string;
  tone: "success" | "warning" | "muted";
}

// Bron van waarheid voor de knoplabels + tonen. Sluit aan op AvailabilityBadge (zelfde labels
// en tonen), zodat de badge en de toggle nooit uiteenlopen.
export const AVAILABILITY_STATUS_OPTIONS: readonly AvailabilityStatusOption[] = [
  {
    value: "AVAILABLE",
    label: "Beschikbaar",
    hint: "Je staat open voor nieuwe opdrachten.",
    tone: "success",
  },
  {
    value: "LIMITED",
    label: "Beperkt beschikbaar",
    hint: "Je neemt selectief nog opdrachten aan.",
    tone: "warning",
  },
  {
    value: "UNAVAILABLE",
    label: "Niet beschikbaar",
    hint: "Je bent nu niet inzetbaar voor nieuwe opdrachten.",
    tone: "muted",
  },
];

/** Type-guard: is de waarde een geldige, door de ZZP'er kiesbare status? */
export function isSelectableAvailability(value: unknown): value is SelectableAvailability {
  return (
    typeof value === "string" && (SELECTABLE_AVAILABILITIES as readonly string[]).includes(value)
  );
}

/** NL-label voor een status (val terug op "Onbekend" bij UNKNOWN of onbekend). */
export function availabilityStatusLabel(value: Availability | string): string {
  const opt = AVAILABILITY_STATUS_OPTIONS.find((o) => o.value === value);
  return opt ? opt.label : "Onbekend";
}

/** De huidige status normaliseren naar een kiesbare (UNKNOWN → geen selectie). */
export function selectedAvailability(
  current: Availability | string | null | undefined,
): SelectableAvailability | null {
  return isSelectableAvailability(current) ? current : null;
}
