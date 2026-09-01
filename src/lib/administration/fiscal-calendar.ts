// Fiscale kalender — één bron van waarheid voor de periode-indeling van een boeking.
//
// Nederlandse fiscale periodes (BTW-kwartaal, belastingjaar, jaaroverzicht) lopen op de
// **burgerlijke kalender in Europe/Amsterdam**, niet in UTC. Een `occurredAt` wordt als UTC-instant
// opgeslagen; het jaar/kwartaal/de maand waarin die boeking valt moet daarom in Amsterdamse tijd
// worden bepaald. Op een UTC-server (Railway) landt een boeking vlak na middernacht NL-tijd anders
// één dag/periode te vroeg (bv. 1 jan 00:30 Amsterdam = 31 dec 23:30 UTC → verkeerd kwartaal/jaar).
//
// Dezelfde tijdzone-basis als de trend-modules (`revenue.ts`, `expense-trend.ts`, …), die al in
// Europe/Amsterdam per maand groeperen. Puur, geen I/O, deterministisch.

export type Quarter = 1 | 2 | 3 | 4;

const TZ = "Europe/Amsterdam";

// Eén formatter die de burgerlijke datum-/tijddelen in Amsterdam teruggeeft. `hourCycle: "h23"`
// voorkomt de "24"-middernacht-quirk van sommige runtimes; we normaliseren die alsnog defensief.
const PARTS_FORMAT = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

interface AmsterdamParts {
  year: number;
  month: number; // 1–12
  day: number; // 1–31
  hour: number; // 0–23
  minute: number;
  second: number;
}

/** De burgerlijke datum-/tijddelen van een instant in Europe/Amsterdam. */
function amsterdamParts(d: Date): AmsterdamParts {
  const parts = PARTS_FORMAT.formatToParts(d);
  const value = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((p) => p.type === type);
    return part ? Number(part.value) : 0;
  };
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour") % 24, // normaliseer een eventuele "24:00" naar 0
    minute: value("minute"),
    second: value("second"),
  };
}

/** Het kalenderjaar in Europe/Amsterdam waarin een boeking valt. */
export function fiscalYearOf(d: Date): number {
  return amsterdamParts(d).year;
}

/** De maand (0–11) in Europe/Amsterdam waarin een boeking valt. */
export function fiscalMonthOf(d: Date): number {
  return amsterdamParts(d).month - 1;
}

/** Het kalenderkwartaal (1–4) in Europe/Amsterdam waarin een boeking valt. */
export function fiscalQuarterOf(d: Date): Quarter {
  return (Math.floor((amsterdamParts(d).month - 1) / 3) + 1) as Quarter;
}

// De offset van Europe/Amsterdam t.o.v. UTC (in ms) op een gegeven instant: +1u in de wintertijd,
// +2u in de zomertijd. Afgeleid door dezelfde instant als Amsterdamse wandklok te lezen en het
// verschil met de echte instant te nemen.
function amsterdamOffsetMs(instant: Date): number {
  const p = amsterdamParts(instant);
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asIfUtc - instant.getTime();
}

/**
 * De UTC-instant die overeenkomt met middernacht (00:00) op de burgerlijke Amsterdamse dag
 * (`year`, `month` 1–12, `day`). Gebruikt om query-grenzen op `occurredAt` (opgeslagen als
 * UTC-instant) exact te laten samenvallen met de burgerlijke periode-indeling hierboven.
 *
 * Kwartaal-/jaargrenzen (1 jan/apr/jul/okt) vallen nooit op een zomertijd-omschakeldag (laatste
 * zondag van maart/oktober), dus één offset-correctie is exact voor deze grenzen.
 */
export function amsterdamCivilDayStart(year: number, month: number, day: number): Date {
  const guessUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
  const offset = amsterdamOffsetMs(new Date(guessUtc));
  return new Date(guessUtc - offset);
}

/** Start-instant (inclusief) van een kalenderkwartaal in Amsterdamse burgerlijke tijd. */
export function quarterStartInstant(year: number, quarter: Quarter): Date {
  return amsterdamCivilDayStart(year, (quarter - 1) * 3 + 1, 1);
}

/** Start-instant (inclusief) van een kalenderjaar in Amsterdamse burgerlijke tijd. */
export function yearStartInstant(year: number): Date {
  return amsterdamCivilDayStart(year, 1, 1);
}

/**
 * De kalenderdag van een instant in Europe/Amsterdam, uitgedrukt als UTC-middernacht-epoch (ms).
 * Bedoeld voor hele-dagen-aftellingen tot een deadline: normaliseert "nu" naar de Amsterdamse
 * burgerlijke dag, zodat een deadline om 23:30 UTC (= 00:30 NL de dag erna) correct als verstreken
 * telt.
 */
export function amsterdamCivilDayMs(d: Date): number {
  const p = amsterdamParts(d);
  return Date.UTC(p.year, p.month - 1, p.day);
}
