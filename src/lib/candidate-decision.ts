// "Beslis nu"-signaal per kandidaat voor de opdrachtgever op /kandidaten. Spiegelbeeld van het
// wachttijd-signaal dat de ZZP'er op /reacties ziet (`application-wait.ts`), maar gewogen naar
// matchkwaliteit i.p.v. enkel de fase: een sterke kandidaat die te lang onbeslist ligt, raakt elders
// aan de slag. Concurrenten (Pidz/Temper/Zorgwerk) vullen diensten "binnen uren" door snel te
// beslissen; wij vertalen die liquiditeitsdruk naar een rustige, eerlijke nudge die het hardst is
// voor de béste kandidaten — zónder andere reacties te tonen. Puur en deterministisch, geen
// schemawijziging — afgeleid uit de onveranderlijke `Application.createdAt`, de `matchScore`-snapshot
// en de huidige `status`.

// Match-ondergrenzen per kwaliteitsklasse. Een kandidaat boven STRONG is een topmatch (de
// opdrachtgever wil hem snel binnenhalen); boven MODERATE een redelijke match; daaronder bescheiden.
export const STRONG_MATCH_MIN = 70;
export const MODERATE_MATCH_MIN = 50;

// Hoeveel dagen een nog-onbesliste reactie per kwaliteitsklasse mag liggen vóór hij aandacht verdient.
// Omgekeerd gewogen t.o.v. de fase-drempels van de ZZP'er-kant: hoe sterker de match, hoe sneller je
// moet beslissen (anders ben je hem kwijt). Een bescheiden match mag rustiger wachten.
export const DECISION_PATIENCE_DAYS = { strong: 2, moderate: 4, modest: 8 } as const;

export type CandidateTier = keyof typeof DECISION_PATIENCE_DAYS;
export type DecisionUrgency = "high" | "medium" | "low";

// Aard van het signaal. `compliance` wint van elke urgentie: een kandidaat die niet aan een
// verplicht certificaat voldoet mag je nooit "snel binnenhalen voordat hij elders start" — dat zou
// de opdrachtgever richting een onverantwoorde keuze duwen (zorg: VOG/BIG). Dan is de enige juiste
// volgende stap: eerst de compliance oplossen.
export type DecisionKind = "urgency" | "compliance";

const MS_PER_DAY = 86_400_000;

export interface CandidateDecisionInput {
  /** ApplicationStatus van de reactie. */
  status: string;
  /** Server-side matchscore-snapshot (0–100), of `null` als die ontbreekt. */
  matchScore: number | null;
  /** Aanmaakmoment van de reactie (onveranderlijk). */
  createdAt: Date;
  /** Of er al een samenwerking uit de reactie is voortgekomen. */
  hasCollaboration: boolean;
  /**
   * De kandidaat voldoet niet aan een verplicht certificaat (server-side `NON_COMPLIANT`). Dan mag er
   * geen urgentie-nudge komen; het signaal wordt een compliance-blokkade. Default `false`.
   */
  complianceBlocked?: boolean;
}

export interface CandidateDecisionSignal {
  /** Aard van het signaal: een urgentie-nudge, of een compliance-blokkade die vóórgaat. */
  kind: DecisionKind;
  /** Aantal hele dagen dat de reactie al onbeslist ligt (≥ 0). */
  daysWaiting: number;
  /** Kwaliteitsklasse uit de matchscore. */
  tier: CandidateTier;
  /** Er is iets te doen: óf de reactie ligt te lang, óf de compliance moet eerst opgelost worden. */
  attention: boolean;
  /** Hoe dringend, oplopend met de kwaliteit: high = sterke match die te lang wacht. */
  urgency: DecisionUrgency;
}

function isUndecided(status: string): status is "NEW" | "VIEWED" | "SHORTLIST" {
  return status === "NEW" || status === "VIEWED" || status === "SHORTLIST";
}

/** Vertaalt een matchscore (mogelijk `null`) naar een kwaliteitsklasse. */
export function candidateTier(matchScore: number | null): CandidateTier {
  if (matchScore != null && matchScore >= STRONG_MATCH_MIN) return "strong";
  if (matchScore != null && matchScore >= MODERATE_MATCH_MIN) return "moderate";
  return "modest";
}

const URGENCY_BY_TIER: Record<CandidateTier, DecisionUrgency> = {
  strong: "high",
  moderate: "medium",
  modest: "low",
};

/**
 * Berekent het beslis-signaal voor één reactie. Geeft `null` zodra de reactie is besloten
 * (ACCEPTED/REJECTED/WITHDRAWN) of er een samenwerking uit voortkwam — dan is beslissen niet meer aan
 * de orde. `now` wordt geïnjecteerd zodat de leeftijd reproduceerbaar is; een `createdAt` in de
 * toekomst (data-ruis) levert 0 dagen, nooit een misleidend negatief getal.
 */
export function summarizeCandidateDecision(
  input: CandidateDecisionInput,
  now: Date = new Date(),
): CandidateDecisionSignal | null {
  if (input.hasCollaboration || !isUndecided(input.status)) return null;

  const tier = candidateTier(input.matchScore);
  const daysWaiting = Math.max(
    0,
    Math.floor((now.getTime() - input.createdAt.getTime()) / MS_PER_DAY),
  );

  // Compliance gaat vóór alles: een niet-voldoende kandidaat krijgt nooit een "haal-hem-snel-binnen"-
  // nudge, maar een compliance-blokkade die de opdrachtgever naar de juiste eerste stap wijst.
  if (input.complianceBlocked) {
    return {
      kind: "compliance",
      daysWaiting,
      tier,
      attention: true,
      urgency: URGENCY_BY_TIER[tier],
    };
  }

  const attention = daysWaiting >= DECISION_PATIENCE_DAYS[tier];
  return { kind: "urgency", daysWaiting, tier, attention, urgency: URGENCY_BY_TIER[tier] };
}

/**
 * Telt hoeveel reacties uit een set een beslissing vragen (langer onbeslist dan past bij hun
 * kwaliteit), en hoeveel daarvan een sterke match zijn. Pure samenvatting voor de strip boven de
 * lijst; muteert de invoer niet.
 */
export function summarizeCandidatesAwaitingDecision(
  inputs: readonly CandidateDecisionInput[],
  now: Date = new Date(),
): { total: number; strong: number } {
  let total = 0;
  let strong = 0;
  for (const input of inputs) {
    const signal = summarizeCandidateDecision(input, now);
    // Alleen echte urgentie telt mee in de paginabrede band; compliance-blokkades hebben een eigen,
    // rij-specifieke boodschap ("eerst compliance oplossen") en horen niet in de urgentie-telling.
    if (signal?.attention && signal.kind === "urgency") {
      total += 1;
      if (signal.tier === "strong") strong += 1;
    }
  }
  return { total, strong };
}
