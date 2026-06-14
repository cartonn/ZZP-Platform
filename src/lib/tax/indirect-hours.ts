/**
 * Indirecte uren — pure module, geen I/O.
 *
 * ZZP'ers mogen naast directe (declarabele) uren ook indirecte uren meetellen voor het
 * 1.225-uur urencriterium (zelfstandigenaftrek, art. 3.6 Wet IB 2001). Indirecte uren zijn
 * uren besteed aan acquisitie, administratie, scholing en reistijd ten behoeve van de
 * onderneming. De Belastingdienst beoordeelt de definitieve aanvaardbaarheid; het platform
 * levert registratie en bewijsmateriaal.
 *
 * Geen imports van db/prisma/server — pure bewerkingsfuncties.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Categorieën
// ---------------------------------------------------------------------------

/** Alle geldige categorieën voor indirecte uren, in canonieke volgorde. */
export const INDIRECT_HOUR_CATEGORIES = [
  "ACQUISITIE",
  "ADMINISTRATIE",
  "SCHOLING",
  "REISTIJD",
  "OVERIG",
] as const;

/** Eén indirecte-uren-categorie. */
export type IndirectHourCategory = (typeof INDIRECT_HOUR_CATEGORIES)[number];

/** Mensleesbare Nederlandse labels per categorie. */
export const INDIRECT_HOUR_CATEGORY_LABEL: Record<IndirectHourCategory, string> = {
  ACQUISITIE: "Acquisitie",
  ADMINISTRATIE: "Administratie",
  SCHOLING: "Scholing & opleiding",
  REISTIJD: "Reistijd",
  OVERIG: "Overig",
};

// ---------------------------------------------------------------------------
// Zod-schema's
// ---------------------------------------------------------------------------

/** Valideert dat een waarde een geldige IndirectHourCategory is. */
export const indirectHourCategorySchema = z.enum(INDIRECT_HOUR_CATEGORIES);

/**
 * Validatieschema voor het aanmaken van een indirecte-uren-regel.
 * Alle foutmeldingen zijn in het Nederlands (UI-taal = NL).
 */
export const indirectHoursEntrySchema = z.object({
  /**
   * Datum waarop de indirecte uren zijn gemaakt.
   * Mag niet in de toekomst liggen: indirecte uren moeten al gewerkt zijn.
   */
  workedOn: z.coerce.date().refine((d) => d <= new Date(), {
    message: "Datum mag niet in de toekomst liggen.",
  }),

  /**
   * Aantal uren, in stappen van 15 minuten (0,25 uur).
   * Minimum 0,25 uur; maximum 24 uur per dag.
   */
  hours: z.coerce
    .number({ invalid_type_error: "Voer een geldig aantal uren in." })
    .positive({ message: "Aantal uren moet groter dan 0 zijn." })
    .max(24, { message: "Meer dan 24 uur per dag is niet mogelijk." })
    .refine((v) => Math.round(v * 4) === v * 4, {
      message: "Uren in stappen van 15 minuten (0,25).",
    }),

  /** Categorie van de indirecte uren. */
  category: indirectHourCategorySchema,

  /**
   * Optionele notitie (maximaal 280 tekens).
   * Lege string wordt behandeld als geen notitie (opgeslagen als null).
   */
  note: z
    .string()
    .trim()
    .max(280, { message: "Notitie mag maximaal 280 tekens bevatten." })
    .optional()
    .or(z.literal("")),
});

// ---------------------------------------------------------------------------
// Leesvorm
// ---------------------------------------------------------------------------

/**
 * Een indirecte-uren-regel zoals gelezen uit de database (leesvorm).
 * Spiegelt de relevante velden van het IndirectHoursEntry-model.
 */
export interface IndirectHoursLogItem {
  id: string;
  workedOn: Date;
  hours: number;
  category: IndirectHourCategory;
  note: string | null;
}

// ---------------------------------------------------------------------------
// Bewerkingsfuncties
// ---------------------------------------------------------------------------

/**
 * Berekent het totaal aantal indirecte uren over een reeks regels.
 * Afgerond op 2 decimalen voor weergave- en vergelijkingsstabiliteit.
 */
export function sumIndirectHours(items: ReadonlyArray<{ hours: number }>): number {
  const raw = items.reduce((acc, item) => acc + item.hours, 0);
  return Math.round(raw * 100) / 100;
}

/**
 * Groepeert indirecte uren per categorie en berekent subtotalen.
 *
 * - Alleen categorieën met uren > 0 worden teruggegeven.
 * - De volgorde volgt INDIRECT_HOUR_CATEGORIES (canonieke volgorde).
 * - Subtotalen zijn afgerond op 2 decimalen.
 */
export function groupIndirectHoursByCategory(
  items: ReadonlyArray<{ category: IndirectHourCategory; hours: number }>,
): Array<{ category: IndirectHourCategory; label: string; hours: number }> {
  // Bouw een sommentabel op
  const totals = new Map<IndirectHourCategory, number>();
  for (const item of items) {
    totals.set(item.category, (totals.get(item.category) ?? 0) + item.hours);
  }

  // Verwerk in canonieke volgorde, sla categorieën met 0 over
  const result: Array<{ category: IndirectHourCategory; label: string; hours: number }> = [];
  for (const category of INDIRECT_HOUR_CATEGORIES) {
    const raw = totals.get(category) ?? 0;
    if (raw > 0) {
      result.push({
        category,
        label: INDIRECT_HOUR_CATEGORY_LABEL[category],
        hours: Math.round(raw * 100) / 100,
      });
    }
  }
  return result;
}
