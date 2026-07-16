// Vooruitblik-bench voor de bemiddelaar (franchiser) op `/franchise/zzpers`. Het
// capaciteitsoverzicht (`roster-capacity.ts`) beantwoordt "wie kan ik NU inzetten?"; deze module
// beantwoordt de planvraag ernaast: "wie komt BINNENKORT vrij?" — welke nu-ingezette vakmensen
// ronden hun opdracht af en worden weer plaatsbaar. Zo kan de bemiddelaar herplaatsing vóóruit
// plannen i.p.v. te schrikken als iemand plots vrij valt (benchmark: staffing-planning Pidz/
// Zorgwerk). Pure, deterministische afleiding over de al tenant-gescopet opgehaalde lopende
// (ACTIVE) samenwerkingen — geen I/O, los getest. De server bepaalt de waarheid (CLAUDE.md regel 1).

import { plural } from "@/lib/plural";
import { formatDateShortNl } from "@/lib/format-date";

/** Planhorizon: verder vooruit tonen we niet — te ver weg is geen actie. */
export const FORECAST_HORIZON_DAYS = 30;
/** "Deze week"-grens: extra urgentie binnen dit venster. */
export const FORECAST_SOON_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Wanneer een nu-ingezette ZZP'er weer vrij komt: het láátste einde van al zijn lopende (ACTIVE)
 * samenwerkingen — hij blijft bezet tot de laatste eindigt. `null` als hij niet is ingezet (lege
 * lijst), of als één lopende samenwerking geen einddatum heeft (open einde = geen bekende
 * vrijkomdatum → niet voorspelbaar, dus niet meetellen).
 */
export function freeDateFromActiveCollaborations(
  endDates: readonly (Date | null | undefined)[],
): Date | null {
  if (endDates.length === 0) return null;
  let latest: Date | null = null;
  for (const d of endDates) {
    if (d == null) return null; // open-einde → geen bekende vrijkomdatum
    if (latest === null || d.getTime() > latest.getTime()) latest = d;
  }
  return latest;
}

/** Hele dagen tot `freeDate` t.o.v. `now` (naar boven afgerond op dagbasis, minimaal 0). */
export function daysUntilFree(freeDate: Date, now: Date): number {
  const diff = freeDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / DAY_MS));
}

/**
 * Kaart-chip voor een nu-ingezette ZZP'er die binnen de horizon vrij komt. `null` zonder bekende
 * vrijkomdatum, in het verleden/vandaag (dan is de samenwerking feitelijk al (bijna) afgelopen — dat
 * hoort bij de capaciteit, niet bij de vooruitblik) of buiten de horizon (te ver weg om nu te
 * plannen). Binnen de weekgrens telt de resterende looptijd; daarbuiten de exacte einddatum.
 */
export function forecastChipLabel(freeDate: Date | null, now: Date): string | null {
  if (freeDate === null) return null;
  if (freeDate.getTime() <= now.getTime()) return null;
  const days = daysUntilFree(freeDate, now);
  if (days > FORECAST_HORIZON_DAYS) return null;
  if (days <= FORECAST_SOON_DAYS) {
    return `Komt vrij over ${plural(days, "dag", "dagen")}`;
  }
  return `Komt vrij op ${formatDateShortNl(freeDate)}`;
}

/** Eén nu-ingezette ZZP'er als forecast-invoer. */
export interface RosterForecastInput {
  /** Vrijkomdatum (laatste ACTIVE-einddatum), of `null` als onbekend/niet ingezet. */
  freeDate: Date | null;
}

export interface RosterForecastSummary {
  /** Nu-ingezette vakmensen die binnen de horizon weer vrij komen. */
  soon: number;
  /** Daarvan binnen `FORECAST_SOON_DAYS` (deze week). */
  thisWeek: number;
  /** Dagen tot de eerstvolgende vrijkomt; `null` als niemand binnen de horizon vrij komt. */
  earliestDays: number | null;
}

/**
 * Aggregeert de vrijkomdata tot een planbeeld. Dezelfde grenzen als de kaart-chip
 * (`forecastChipLabel`), zodat de kop nooit iets telt dat niet ook als chip verschijnt: alleen een
 * bekende vrijkomdatum in de toekomst en binnen de horizon telt mee.
 */
export function summarizeRosterForecast(
  items: readonly RosterForecastInput[],
  now: Date,
): RosterForecastSummary {
  let soon = 0;
  let thisWeek = 0;
  let earliestDays: number | null = null;
  for (const it of items) {
    const fd = it.freeDate;
    if (fd === null || fd.getTime() <= now.getTime()) continue;
    const days = daysUntilFree(fd, now);
    if (days > FORECAST_HORIZON_DAYS) continue;
    soon += 1;
    if (days <= FORECAST_SOON_DAYS) thisWeek += 1;
    if (earliestDays === null || days < earliestDays) earliestDays = days;
  }
  return { soon, thisWeek, earliestDays };
}

/**
 * Eén verklarende regel voor de vooruitblik. `null` als er niemand binnen de horizon vrij komt —
 * dan toont de pagina niets (rustige lijst).
 */
export function rosterForecastHeadline(summary: RosterForecastSummary): string | null {
  if (summary.soon === 0) return null;
  const base = `${plural(summary.soon, "vakmens", "vakmensen")} ${
    summary.soon === 1 ? "komt" : "komen"
  } binnen ${FORECAST_HORIZON_DAYS} dagen vrij`;
  if (summary.thisWeek > 0) {
    return `${base} — ${summary.thisWeek} deze week. Plan herplaatsing vast vooruit.`;
  }
  return `${base}. Plan herplaatsing vast vooruit.`;
}
