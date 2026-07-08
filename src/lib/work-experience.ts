// Werkervaring op het ZZP-profiel — pure logica (validatie, sortering, periode-formattering).
//
// Zelf-gerapporteerde eerdere rollen/opdrachten die de ZZP'er naast de servergeverifieerde
// certificaten toont (benchmark: Malt/LinkedIn "work experience"). Puur self-reported en dus
// niet geverifieerd; de UI benoemt dat expliciet. Jaar-granulariteit; `endYear === null` = "heden".
//
// Geen I/O, geen Prisma — alleen datatransformatie zodat dit deterministisch te testen is.

import { z } from "zod";

export const WORK_EXPERIENCE_ROLE_MAX = 120;
export const WORK_EXPERIENCE_ORG_MAX = 160;
export const WORK_EXPERIENCE_DESC_MAX = 600;
export const WORK_EXPERIENCE_MIN_YEAR = 1970;
// Ruime bovengrens (geen `now` in de schema → deterministisch); een verre-toekomst-jaar is
// onzinnig maar niet gevaarlijk, en de sortering/weergave blijven correct.
export const WORK_EXPERIENCE_MAX_YEAR = 2100;
export const WORK_EXPERIENCE_MAX_PER_PROFILE = 30;

const yearField = z.coerce
  .number()
  .int("Vul een geldig jaartal in.")
  .min(WORK_EXPERIENCE_MIN_YEAR, `Jaartal moet ${WORK_EXPERIENCE_MIN_YEAR} of later zijn.`)
  .max(WORK_EXPERIENCE_MAX_YEAR, "Jaartal is ongeldig.");

/**
 * Zod-schema voor één werkervaring-invoer. `endYear` mag leeg zijn (= heden) en moet, indien
 * ingevuld, ≥ `startYear` zijn. Server-side de enige bron van waarheid.
 */
export const workExperienceSchema = z
  .object({
    role: z.string().trim().min(1, "Rol is verplicht.").max(WORK_EXPERIENCE_ROLE_MAX),
    organization: z
      .string()
      .trim()
      .min(1, "Organisatie is verplicht.")
      .max(WORK_EXPERIENCE_ORG_MAX),
    startYear: yearField,
    endYear: z
      .union([z.literal(""), yearField])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : (v as number))),
    description: z
      .string()
      .trim()
      .max(WORK_EXPERIENCE_DESC_MAX)
      .optional()
      .transform((v) => (v ? v : null)),
  })
  .superRefine((d, ctx) => {
    if (d.endYear !== null && d.endYear < d.startYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Eindjaar kan niet vóór het startjaar liggen.",
        path: ["endYear"],
      });
    }
  });

export type WorkExperienceInput = z.infer<typeof workExperienceSchema>;

export interface WorkExperienceLike {
  id: string;
  role: string;
  organization: string;
  startYear: number;
  endYear: number | null;
  description: string | null;
  createdAt?: Date;
}

/**
 * Menselijke periode-omschrijving:
 * - lopend (endYear null)      → "2019 – heden"
 * - één jaar (start === end)   → "2019"
 * - bereik                     → "2019 – 2022"
 */
export function formatWorkPeriod(startYear: number, endYear: number | null): string {
  if (endYear === null) return `${startYear} – heden`;
  if (endYear === startYear) return `${startYear}`;
  return `${startYear} – ${endYear}`;
}

/**
 * Sorteert werkervaring van recent naar oud voor weergave: lopende ervaring (geen eindjaar)
 * bovenaan, daarna op effectief eindjaar aflopend, dan startjaar aflopend. Deterministische
 * tiebreak op `id` zodat de volgorde stabiel is (géén mutatie van de invoer).
 */
export function sortWorkExperiences<T extends WorkExperienceLike>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    const aEnd = a.endYear ?? Number.POSITIVE_INFINITY;
    const bEnd = b.endYear ?? Number.POSITIVE_INFINITY;
    if (aEnd !== bEnd) return bEnd - aEnd;
    if (a.startYear !== b.startYear) return b.startYear - a.startYear;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}
