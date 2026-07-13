// Opdracht-kwaliteitsmeter — puur, deterministisch. Beoordeelt een opdrachtplaatsing
// op concrete volledigheid/aantrekkelijkheid en geeft de opdrachtgever gerichte tips
// vóór publicatie. Heldere, complete opdrachten krijgen meer en betere reacties
// (liquiditeit); dit vertaalt de "coaching op plaatsingskwaliteit" van marktplaatsen naar
// onze verklaarbare, server-berekende matching. Geen score bepaalt de zichtbaarheid —
// het is puur advies. Leunt op de bestaande markt-mediaan voor de tarief-check.

/** Ondergrens voor een concrete functietitel (tekens, na trim). */
export const JOB_TITLE_MIN_LENGTH = 8;
/** Ondergrens voor een inhoudelijke omschrijving (tekens, na trim). */
export const JOB_DESCRIPTION_MIN_LENGTH = 160;
/** Vanaf deze score noemen we de plaatsing sterk. */
export const JOB_QUALITY_STRONG = 80;
/** Onder deze score is de plaatsing te mager. */
export const JOB_QUALITY_THIN = 55;
/** Maximaal aantal tips dat we tonen (rust boven volledigheid). */
export const JOB_QUALITY_MAX_TIPS = 4;

export interface JobQualityInput {
  title: string;
  description: string;
  /** Minimumtarief in hele euro's; null als leeg/ongeldig. */
  rateMinEuro: number | null;
  industryId: string;
  location: string;
  /** ONSITE | HYBRID | REMOTE (of leeg). */
  workMode: string;
  /** Startdatum als string; leeg betekent niet gezet. */
  startDate: string;
  /** Aantal vereiste skills dat is aangevinkt. */
  requiredSkillCount: number;
  /**
   * Markt-mediaan (hele euro) voor de gekozen branche, met platform-terugval; null als
   * onbekend. Alleen dan telt de "concurrerend tarief"-check mee.
   */
  marketMedianEuro: number | null;
}

export type JobQualityLevel = "strong" | "ok" | "thin";

export interface JobQualityCheck {
  /** Stabiele code voor tests/telemetrie. */
  code: string;
  /** Korte Nederlandse omschrijving van wat gecheckt wordt. */
  label: string;
  /** Voldaan? */
  done: boolean;
  /** Gewicht in de score. */
  weight: number;
  /** Concrete tip zolang niet voldaan; null zodra voldaan. */
  tip: string | null;
}

export interface JobQuality {
  /** 0–100, gewogen over de van-toepassing-zijnde checks. */
  score: number;
  level: JobQualityLevel;
  checks: JobQualityCheck[];
  /** Openstaande tips, sterkste eerst, begrensd tot JOB_QUALITY_MAX_TIPS. */
  tips: string[];
  /** Aantal voldane checks / totaal van-toepassing. */
  doneCount: number;
  applicableCount: number;
}

function trimmedLength(value: string): number {
  return value.trim().length;
}

/**
 * Beoordeel een opdrachtplaatsing. Pure functie: dezelfde invoer levert altijd hetzelfde
 * resultaat, zodat de meter live in het formulier én in tests deterministisch is.
 */
export function assessJobQuality(input: JobQualityInput): JobQuality {
  const rateMin = input.rateMinEuro;
  const median = input.marketMedianEuro;

  // De "concurrerend tarief"-check telt alleen mee als er zowel een tarief als een
  // markt-mediaan is — anders zou een ontbrekend tarief dubbel afstraffen (via de
  // tarief-check) en zou een onbekende markt een valse tip geven.
  const rateCompetitiveApplicable = rateMin !== null && median !== null && median > 0;

  const checks: (JobQualityCheck | null)[] = [
    {
      code: "title",
      label: "Concrete functietitel",
      done: trimmedLength(input.title) >= JOB_TITLE_MIN_LENGTH,
      weight: 10,
      tip: "Geef een concrete functietitel, bijv. 'Wijkverpleegkundige, regio Utrecht'.",
    },
    {
      code: "description",
      label: "Inhoudelijke omschrijving",
      done: trimmedLength(input.description) >= JOB_DESCRIPTION_MIN_LENGTH,
      weight: 25,
      tip: "Beschrijf taken, team en verwachtingen in een paar zinnen — heldere opdrachten krijgen meer en betere reacties.",
    },
    {
      code: "industry",
      label: "Branche gekozen",
      done: input.industryId.trim() !== "",
      weight: 10,
      tip: "Kies een branche — dit verbetert de match en het markttarief-inzicht.",
    },
    {
      code: "rate",
      label: "Tarief vermeld",
      done: rateMin !== null && rateMin > 0,
      weight: 15,
      tip: "Vermeld een minimumtarief — opdrachten zonder tarief worden vaak overgeslagen.",
    },
    rateCompetitiveApplicable
      ? {
          code: "rateCompetitive",
          label: "Concurrerend tarief",
          done: (rateMin as number) >= (median as number),
          weight: 15,
          tip: `Je minimum ligt onder het marktmediaan (€${median}/uur) — overweeg te verhogen om sterkere ZZP'ers aan te trekken.`,
        }
      : null,
    {
      code: "skills",
      label: "Vereiste skills",
      done: input.requiredSkillCount >= 1,
      weight: 15,
      tip: "Voeg minstens één vereiste skill toe — dit stuurt de match en de compliance-check.",
    },
    {
      code: "startDate",
      label: "Startdatum gezet",
      done: input.startDate.trim() !== "",
      weight: 10,
      tip: "Zet een startdatum zodat ZZP'ers hun beschikbaarheid kunnen inschatten.",
    },
    {
      code: "location",
      label: "Locatie of op afstand",
      done: input.location.trim() !== "" || input.workMode === "REMOTE",
      weight: 10,
      tip: "Vul een locatie in of markeer de opdracht als op afstand.",
    },
  ];

  const applicable = checks.filter((c): c is JobQualityCheck => c !== null);

  const totalWeight = applicable.reduce((sum, c) => sum + c.weight, 0);
  const doneWeight = applicable.reduce((sum, c) => (c.done ? sum + c.weight : sum), 0);
  const score = totalWeight === 0 ? 0 : Math.round((doneWeight / totalWeight) * 100);

  const level: JobQualityLevel =
    score >= JOB_QUALITY_STRONG ? "strong" : score >= JOB_QUALITY_THIN ? "ok" : "thin";

  // Voldane checks dragen geen tip meer; sluit ze af (tip = null).
  const resolved = applicable.map((c) => ({ ...c, tip: c.done ? null : c.tip }));

  const tips = resolved
    .filter((c) => !c.done)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, JOB_QUALITY_MAX_TIPS)
    .map((c) => c.tip as string);

  return {
    score,
    level,
    checks: resolved,
    tips,
    doneCount: applicable.filter((c) => c.done).length,
    applicableCount: applicable.length,
  };
}
