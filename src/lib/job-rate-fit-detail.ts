// Tarief-passendheid op het beslismoment: vergelijkt het gepubliceerde budget van één opdracht
// (rateMin..rateMax) met het eigen richttarief van de ZZP'er (FreelancerProfile.hourlyRate) en geeft
// een expliciet, glanceable oordeel — "betaalt dit wat ik vraag?" — vlak vóór de ZZP'er reageert.
//
// Waarom naast `jobRateFitChip` (job-rate-fit.ts): die chip voedt de find-work-lijst en blijft bewust
// STIL wanneer het tarief binnen de band valt (de lijst rustig houden). Op de detailpagina — het
// daadwerkelijke beslismoment — is die stilte juist een gat: de ZZP'er wil daar ook de geruststellende
// "past bij je tarief"-bevestiging zien, plus de concrete afstand tot het budget. Deze module geeft dus
// altijd een oordeel (drie richtingen) met een concreet verschilbedrag, en vult de effectief-na-reistijd-
// kaart aan (die alleen bij routebare reis verschijnt en over reis-drag gaat, niet over het budget).
// Benchmark: Malt/Temper houden "betaalt boven/onder je tarief" zichtbaar op het punt waar je solliciteert.
//
// Puur en deterministisch — geen I/O, geen tijd. Server-side is de waarheid (CLAUDE.md regel 1): de
// client toont het signaal, berekent het nooit zelf. Alle bedragen in hele euro's per uur.

export type JobRateFitPosition = "below" | "within" | "above";
export type JobRateFitTone = "good" | "warning" | "neutral";

export interface JobRateFitAssessment {
  /** Positie van het opdrachtbudget t.o.v. het eigen richttarief. */
  position: JobRateFitPosition;
  tone: JobRateFitTone;
  /** Korte kop, bv. "Boven je richttarief". */
  headline: string;
  /** Eén uitlegzin met het concrete verschil. */
  detail: string;
  /** Het eigen richttarief in euro/uur (voor weergave). */
  hourlyRate: number;
  /** Absoluut verschil tot de dichtstbijzijnde budgetgrens in euro/uur; 0 wanneer binnen de band. */
  deltaEuros: number;
}

/** "€ 40" of "€ 40–€ 80" — de gepubliceerde budgetgrens(en), afhankelijk van wat is ingevuld. */
function formatBudget(
  rateMin: number | null | undefined,
  rateMax: number | null | undefined,
): string {
  const lo = rateMin != null ? rateMin : null;
  const hi = rateMax != null ? rateMax : null;
  if (lo != null && hi != null) {
    return lo === hi ? `€ ${lo}` : `€ ${lo}–€ ${hi}`;
  }
  if (lo != null) return `vanaf € ${lo}`;
  if (hi != null) return `tot € ${hi}`;
  return "";
}

/**
 * Beoordeelt of een opdracht boven, onder of binnen het eigen richttarief van de ZZP'er betaalt.
 *
 * Retourneert `null` (geen kaart) wanneer:
 * - het eigen richttarief onbekend of niet-positief is;
 * - de opdracht geen enkele budgetgrens heeft (dan is er niets te vergelijken).
 *
 * Anders altijd een oordeel:
 * - `below` (warning) — het plafond (rateMax) ligt onder je richttarief: deze opdracht betaalt minder
 *   dan je vraagt. Het plafond gaat vóór de bodem: bij een defensieve/omgekeerde grensvolgorde
 *   (rateMin > rateMax) is "betaalt minder" het veiligste signaal.
 * - `above` (good) — de bodem (rateMin) ligt boven je richttarief: deze opdracht betaalt méér dan je
 *   vraagt.
 * - `within` (neutral) — je richttarief valt binnen [rateMin, rateMax] (of aan de goede kant van de
 *   enige ingevulde grens): het budget past bij wat je vraagt.
 */
export function assessJobRateFit(
  hourlyRate: number | null | undefined,
  rateMin: number | null | undefined,
  rateMax: number | null | undefined,
): JobRateFitAssessment | null {
  if (hourlyRate == null || hourlyRate <= 0) return null;
  if (rateMin == null && rateMax == null) return null;

  const budget = formatBudget(rateMin, rateMax);

  if (rateMax != null && hourlyRate > rateMax) {
    const delta = hourlyRate - rateMax;
    return {
      position: "below",
      tone: "warning",
      headline: "Onder je richttarief",
      detail: `Je richttarief (€ ${hourlyRate}) ligt € ${delta} boven het budget van deze opdracht (${budget} per uur). Overweeg te onderhandelen of over te slaan.`,
      hourlyRate,
      deltaEuros: delta,
    };
  }

  if (rateMin != null && hourlyRate < rateMin) {
    const delta = rateMin - hourlyRate;
    return {
      position: "above",
      tone: "good",
      headline: "Boven je richttarief",
      detail: `Deze opdracht biedt € ${delta} per uur méér dan je richttarief (€ ${hourlyRate}). Budget: ${budget} per uur.`,
      hourlyRate,
      deltaEuros: delta,
    };
  }

  return {
    position: "within",
    tone: "neutral",
    headline: "Past bij je richttarief",
    detail: `Je richttarief (€ ${hourlyRate}) valt binnen het budget van deze opdracht (${budget} per uur).`,
    hourlyRate,
    deltaEuros: 0,
  };
}
