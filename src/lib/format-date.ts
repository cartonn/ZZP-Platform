// Centrale NL-datum/tijd-formattering — één bron van waarheid. Voorkomt dat pagina's
// rauwe ISO-strings tonen (2026-05-07) of elk hun eigen formatter herhalen, en zet
// tijdstempels in Europe/Amsterdam i.p.v. UTC.
//
// Keuze per context:
// - formatDateNl      → formele documenten/detailvelden ("7 mei 2026")
// - formatDateShortNl → dichte lijsten, kaarten, periodes ("7 mei 2026", korte maand)
// - formatDateTimeNl  → tijdstempels (berichten, audit, support) — datum + lokale tijd
//
// Voor machine-output (CSV/PDF/API/<input type="date">) blijf je rauwe ISO gebruiken;
// die hoort NIET via deze helpers te lopen.

const NL = "nl-NL";
const TZ = "Europe/Amsterdam";

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Lange NL-datum voor formele documenten en detailvelden: "7 mei 2026". */
export function formatDateNl(
  value: Date | string | number | null | undefined,
  fallback = "—",
): string {
  const d = toDate(value);
  if (!d) return fallback;
  return d.toLocaleDateString(NL, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  });
}

/** Korte NL-datum voor dichte lijsten, kaarten en periodes: "7 mei 2026" (korte maand). */
export function formatDateShortNl(
  value: Date | string | number | null | undefined,
  fallback = "—",
): string {
  const d = toDate(value);
  if (!d) return fallback;
  return d.toLocaleDateString(NL, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  });
}

/** Korte NL-maand + jaar voor compacte historie-labels: "mei 2026". */
export function formatMonthYearNl(
  value: Date | string | number | null | undefined,
  fallback = "—",
): string {
  const d = toDate(value);
  if (!d) return fallback;
  return d.toLocaleDateString(NL, { month: "short", year: "numeric", timeZone: TZ });
}

/** NL datum + lokale tijd (Europe/Amsterdam) voor tijdstempels: "7 mei 2026 09:12". */
export function formatDateTimeNl(
  value: Date | string | number | null | undefined,
  fallback = "—",
): string {
  const d = toDate(value);
  if (!d) return fallback;
  const time = d.toLocaleTimeString(NL, { hour: "2-digit", minute: "2-digit", timeZone: TZ });
  return `${formatDateShortNl(d)} ${time}`;
}

/** Korte NL-periode: "16 mei – 23 mei 2026" (zelfde jaar wordt niet herhaald). */
export function formatDateRangeNl(
  start: Date | string | number | null | undefined,
  end: Date | string | number | null | undefined,
): string {
  const s = toDate(start);
  const e = toDate(end);
  if (!s && !e) return "—";
  if (!e) return formatDateShortNl(s);
  if (!s) return formatDateShortNl(e);
  const sameYear = s.getFullYear() === e.getFullYear();
  const startStr = sameYear
    ? s.toLocaleDateString(NL, { day: "numeric", month: "short", timeZone: TZ })
    : formatDateShortNl(s);
  return `${startStr} – ${formatDateShortNl(e)}`;
}
