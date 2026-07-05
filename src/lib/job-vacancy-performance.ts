// Vacaturetempo-signaal voor de OPDRACHTGEVER: hoe presteert een gepubliceerde opdracht in de tijd —
// hoe lang staat hij open, hoeveel reacties per week trekt hij, hoe snel kwam de eerste reactie en is
// er nog momentum? Waar `job-reach.ts` de potentie samenvat (hoeveel passende ZZP'ers de opdracht kán
// bereiken) en `job-pipeline.ts` de stand per reactie-status telt, vat dit de doorlooptijd/snelheid
// samen zodat de opdrachtgever ziet of hij moet bijsturen (tarief, eisen, zichtbaarheid) i.p.v. blind
// te wachten. Spiegelbeeld van het ZZP'er-signaal `job-competition.ts`, en de on-screen tegenhanger
// van de notificatie-only `job-engagement.ts` (koude-opdracht-planner) — dezelfde koud-drempels, maar
// nu zichtbaar op het scherm. Pure, deterministische functies (getest). Server-side is de waarheid
// (CLAUDE.md regel 1): de client toont het signaal, berekent het nooit zelf. Toont uitsluitend
// geaggregeerde tellingen — nooit de identiteit van kandidaten.

/** Reacties/week vanaf wanneer het tempo "sterk" is. */
export const VACANCY_STRONG_PER_WEEK = 3;
/** Reacties/week vanaf wanneer het tempo "gestaag" is. */
export const VACANCY_STEADY_PER_WEEK = 1;
/** Minimale leeftijd (dagen open) voordat een opdracht als "koud" telt (gelijk aan job-engagement). */
export const VACANCY_COLD_MIN_AGE_DAYS = 7;
/** Maximaal aantal reacties waaronder een opdracht koud is (gelijk aan job-engagement, "< 3"). */
export const VACANCY_COLD_MAX_APPLICATIONS = 2;
/** Venster (dagen) waarin een reactie als "recent" telt voor het momentum. */
export const VACANCY_MOMENTUM_WINDOW_DAYS = 7;
/** Onder deze leeftijd (dagen) is het tempo nog niet betrouwbaar; de opdracht is "net geplaatst". */
export const VACANCY_FRESH_MAX_DAYS = 2;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type VacancyPace = "strong" | "steady" | "slow" | "cold";
export type VacancyMomentum = "fresh" | "active" | "quiet";
export type VacancyTone = "positive" | "neutral" | "warning";

export interface VacancyPerformanceInput {
  /** Publicatiemoment; de caller valt terug op `createdAt` wanneer dit ontbreekt. null → daagteller 0. */
  publishedAt: Date | null;
  now: Date;
  /** `createdAt` van de actieve (niet-ingetrokken) reacties op de opdracht. */
  applicationDates: Date[];
}

export interface VacancyPerformanceSummary {
  daysOpen: number;
  applicationCount: number;
  /** Reacties per week over de openstaande periode, afgerond op 1 decimaal (0 zonder reacties). */
  perWeek: number;
  /** Dagen tot de eerste reactie; null zonder reacties of zonder ankermoment. */
  firstResponseDays: number | null;
  /** Reacties in het momentum-venster (laatste `VACANCY_MOMENTUM_WINDOW_DAYS` dagen). */
  recentCount: number;
  pace: VacancyPace;
  momentum: VacancyMomentum;
  tone: VacancyTone;
  /** Korte kop, bv. "Sterk tempo". */
  headline: string;
  /** Uitleg + sturingstip. */
  hint: string;
  /** Of bijsturen loont (koud, of stil gevallen met weinig reacties). */
  attention: boolean;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** NL-notatie voor een tempo: hele getallen zonder decimaal, anders één decimaal met komma. */
function formatRate(n: number): string {
  return (Number.isInteger(n) ? String(n) : n.toFixed(1)).replace(".", ",");
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/**
 * Vat het tempo/de doorlooptijd van een gepubliceerde opdracht samen voor de eigenaar. Puur en
 * deterministisch: leidt alles af uit het publicatiemoment, `now` en de reactie-tijdstempels. Voor
 * een verse opdracht (< `VACANCY_FRESH_MAX_DAYS`) wordt het tempo bewust terughoudend getoond, zodat
 * één vroege reactie geen misleidend "sterk" oplevert. De koud-drempels zijn gelijk aan
 * `job-engagement.ts`, zodat het scherm en het achtergrondsignaal elkaar niet tegenspreken.
 */
export function summarizeVacancyPerformance({
  publishedAt,
  now,
  applicationDates,
}: VacancyPerformanceInput): VacancyPerformanceSummary {
  const anchorMs = publishedAt ? publishedAt.getTime() : null;
  const elapsedMs = anchorMs != null ? Math.max(0, now.getTime() - anchorMs) : 0;
  const daysOpen = Math.floor(elapsedMs / MS_PER_DAY);

  const dates = applicationDates
    .filter((d) => d instanceof Date && !Number.isNaN(d.getTime()) && d.getTime() <= now.getTime())
    .sort((a, b) => a.getTime() - b.getTime());
  const applicationCount = dates.length;

  // Tempo over de openstaande periode; minstens 1 dag zodat een net-gepubliceerde opdracht geen
  // absurd hoog per-week-tempo toont.
  const rateDays = Math.max(elapsedMs / MS_PER_DAY, 1);
  const perWeek = applicationCount === 0 ? 0 : round1((applicationCount / rateDays) * 7);

  const firstDate = dates[0];
  const firstResponseDays =
    anchorMs != null && firstDate
      ? Math.max(0, Math.floor((firstDate.getTime() - anchorMs) / MS_PER_DAY))
      : null;

  const windowStart = now.getTime() - VACANCY_MOMENTUM_WINDOW_DAYS * MS_PER_DAY;
  const recentCount = dates.filter((d) => d.getTime() >= windowStart).length;

  const momentum: VacancyMomentum =
    daysOpen < VACANCY_FRESH_MAX_DAYS ? "fresh" : recentCount > 0 ? "active" : "quiet";

  let pace: VacancyPace;
  if (daysOpen >= VACANCY_COLD_MIN_AGE_DAYS && applicationCount <= VACANCY_COLD_MAX_APPLICATIONS) {
    pace = "cold";
  } else if (momentum === "fresh") {
    // Te vers voor een betrouwbaar tempo: enige respons = gestaag, geen respons = traag.
    pace = applicationCount > 0 ? "steady" : "slow";
  } else if (perWeek >= VACANCY_STRONG_PER_WEEK) {
    pace = "strong";
  } else if (perWeek >= VACANCY_STEADY_PER_WEEK) {
    pace = "steady";
  } else {
    pace = "slow";
  }

  const perWeekText = perWeek > 0 ? `${formatRate(perWeek)} per week` : "nog geen reacties";

  let headline: string;
  let hint: string;
  let tone: VacancyTone;

  if (momentum === "fresh") {
    headline = "Net geplaatst";
    tone = applicationCount > 0 ? "positive" : "neutral";
    hint =
      applicationCount > 0
        ? `${applicationCount} ${plural(applicationCount, "reactie", "reacties")} kort na plaatsing — een goed begin. Reacties komen doorgaans de eerste dagen op gang.`
        : `Deze opdracht staat ${daysOpen === 0 ? "sinds vandaag" : "net"} online. Reacties komen doorgaans na een paar dagen op gang.`;
  } else if (pace === "cold") {
    headline = "Weinig respons";
    tone = "warning";
    hint = `${daysOpen} dagen open met ${applicationCount} ${plural(applicationCount, "reactie", "reacties")}. Overweeg het tarief, de eisen of de zichtbaarheid bij te stellen om meer kandidaten te bereiken.`;
  } else if (pace === "strong") {
    headline = "Sterk tempo";
    tone = "positive";
    hint = `Deze opdracht trekt goed reacties (${perWeekText}). Beoordeel de kandidaten op tijd zodat je de sterkste niet verliest.`;
  } else if (pace === "steady") {
    headline = "Gestaag tempo";
    tone = "positive";
    hint = `Een gezonde stroom reacties (${perWeekText}).`;
  } else {
    headline = "Traag tempo";
    tone = "warning";
    hint = `${perWeekText === "nog geen reacties" ? "Nog geen reacties" : `Weinig reacties (${perWeekText})`} in ${daysOpen} dagen. Een scherper tarief of een concretere omschrijving kan meer kandidaten trekken.`;
  }

  // Momentum-notitie: al een tijd geen nieuwe reactie terwijl de opdracht nog niet koud is.
  if (momentum === "quiet" && pace !== "cold") {
    hint += ` Geen nieuwe reacties in de afgelopen ${VACANCY_MOMENTUM_WINDOW_DAYS} dagen.`;
  }
  // Eerste-reactie-context bij een gezond/sterk tempo.
  if (
    firstResponseDays != null &&
    (pace === "strong" || pace === "steady") &&
    momentum !== "fresh"
  ) {
    hint += ` Eerste reactie na ${
      firstResponseDays === 0
        ? "minder dan een dag"
        : `${firstResponseDays} ${plural(firstResponseDays, "dag", "dagen")}`
    }.`;
  }

  const attention = pace === "cold" || (momentum === "quiet" && applicationCount < 3);

  return {
    daysOpen,
    applicationCount,
    perWeek,
    firstResponseDays,
    recentCount,
    pace,
    momentum,
    tone,
    headline,
    hint,
    attention,
  };
}
