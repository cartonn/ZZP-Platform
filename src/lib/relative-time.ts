import { formatDateShortNl } from "@/lib/format-date";

/** Vertaalfunctie-vorm (server `getTranslator().t` of client `useT()`). */
export type RelativeTimeTranslator = (source: string) => string;

/**
 * Korte relatieve-tijd-tekst: "zojuist" / "N min geleden" / "N uur geleden", en vanaf 24 uur de
 * korte datum. Gedeeld door /notificaties en /reacties zodat recency overal hetzelfde leest.
 * Vertaalbaar via `t` (de teksten staan in het i18n-woordenboek). `now` injecteerbaar voor tests.
 */
export function relativeTime(d: Date, t: RelativeTimeTranslator, now: number = Date.now()): string {
  const min = Math.floor((now - d.getTime()) / 60000);
  if (min < 1) return t("zojuist");
  if (min < 60) return `${min} ${t("min geleden")}`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ${t("uur geleden")}`;
  return formatDateShortNl(d);
}
