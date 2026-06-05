// Per-dag-weekrooster op een samenwerking (ADR-0004). Pure (de)serialisatie + formattering rond het
// optionele `Collaboration.weekdays`-veld: een JSON-array van Weekday-codes ("MON".."SUN"), null als
// niet vastgelegd. Alle functies normaliseren naar de canonieke ISO-volgorde (maandag eerst) en
// ontdubbelen, zodat de UI en het weekoverzicht dezelfde, voorspelbare reeks krijgen. Geen I/O.

import { WEEKDAYS, weekdaySchema, type Weekday } from "@/lib/enums";

/** Korte Nederlandse labels (maandag eerst), voor compacte weergave: "ma, wo, vr". */
export const WEEKDAY_LABEL_SHORT: Record<Weekday, string> = {
  MON: "ma",
  TUE: "di",
  WED: "wo",
  THU: "do",
  FRI: "vr",
  SAT: "za",
  SUN: "zo",
};

/** Volledige Nederlandse labels, voor toelichting/toegankelijkheid. */
export const WEEKDAY_LABEL_FULL: Record<Weekday, string> = {
  MON: "maandag",
  TUE: "dinsdag",
  WED: "woensdag",
  THU: "donderdag",
  FRI: "vrijdag",
  SAT: "zaterdag",
  SUN: "zondag",
};

/** Sorteer een set weekdagen naar de canonieke ISO-volgorde (maandag → zondag), ontdubbeld. */
export function canonicalizeWeekdays(days: readonly Weekday[]): Weekday[] {
  const set = new Set(days);
  return WEEKDAYS.filter((d) => set.has(d));
}

/**
 * Parseert het opgeslagen `weekdays`-veld (JSON-array-string) tot een gevalideerde, canoniek
 * geordende, ontdubbelde lijst. Robuust: null/lege/ongeldige invoer → lege lijst (geen throw),
 * zodat een verouderd of corrupt veld nooit de pagina laat crashen.
 */
export function parseWeekdays(json: string | null | undefined): Weekday[] {
  if (!json) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];
  const valid = raw.filter((v): v is Weekday => weekdaySchema.safeParse(v).success);
  return canonicalizeWeekdays(valid);
}

/**
 * Serialiseert een set weekdagen naar het opslagformaat: canoniek geordende JSON-array-string, of
 * `null` wanneer er geen dag gekozen is (= "niet vastgelegd", de standaardtoestand).
 */
export function serializeWeekdays(days: readonly Weekday[]): string | null {
  const canon = canonicalizeWeekdays(days);
  return canon.length > 0 ? JSON.stringify(canon) : null;
}

/** Compacte, leesbare weergave: "ma, wo, vr". Lege lijst → lege string (de UI toont dan een fallback). */
export function formatWeekdays(days: readonly Weekday[]): string {
  return canonicalizeWeekdays(days)
    .map((d) => WEEKDAY_LABEL_SHORT[d])
    .join(", ");
}
