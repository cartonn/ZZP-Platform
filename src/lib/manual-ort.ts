// Enige bron voor de handmatige-ORT-invoer (uren per categorie zonder diensttijden). Zowel de
// server-actie (parsePerformanceInput) als de client-preview lezen hier de veldnamen, de
// canonieke volgorde en de segment-opbouw, zodat precedentie/volgorde niet uiteen kunnen drijven
// tussen wat de ZZP'er ziet en wat de server berekent. Pure functie, geen I/O; server-side blijft
// de waarheid (deze module bepaalt alleen de vorm van de invoer, niet het geld).

import { ORT_CATEGORIES, ORT_CATEGORY_LABEL } from "@/lib/config";
import { type OrtSegment, type OrtSegmentCategory } from "@/lib/ort";
import { type ManualOrtField } from "@/lib/performance-form";

export interface ManualOrtFieldDef {
  /** Formulier-veldnaam (formData key). */
  field: ManualOrtField;
  /** ORT-segmentcategorie. */
  category: OrtSegmentCategory;
  /** UI-label (NL). */
  label: string;
}

const FIELD_BY_CATEGORY: Record<OrtSegmentCategory, ManualOrtField> = {
  NORMAL: "ort_normal",
  EVENING: "ort_evening",
  NIGHT: "ort_night",
  SATURDAY: "ort_saturday",
  SUNDAY: "ort_sunday",
  HOLIDAY: "ort_holiday",
};

/** Canonieke volgorde: NORMAL eerst, daarna de toeslagcategorieën in configvolgorde. */
export const MANUAL_ORT_FIELDS: readonly ManualOrtFieldDef[] = (
  ["NORMAL", ...ORT_CATEGORIES] as OrtSegmentCategory[]
).map((category) => ({
  field: FIELD_BY_CATEGORY[category],
  category,
  label: category === "NORMAL" ? "Regulier" : ORT_CATEGORY_LABEL[category],
}));

/**
 * Bouwt ORT-segmenten uit handmatig ingevoerde uren per categorie: canonieke volgorde, alleen
 * categorieën met een eindig aantal uren > 0. Negatieve/NaN/oneindige waarden worden genegeerd
 * (defensief; computeOrt en de server-actie bewaken dit ook). Pure functie.
 */
export function manualOrtSegments(
  hoursByCategory: Partial<Record<OrtSegmentCategory, number>>,
): OrtSegment[] {
  const segments: OrtSegment[] = [];
  for (const { category } of MANUAL_ORT_FIELDS) {
    const hours = hoursByCategory[category] ?? 0;
    if (Number.isFinite(hours) && hours > 0) segments.push({ category, hours });
  }
  return segments;
}
