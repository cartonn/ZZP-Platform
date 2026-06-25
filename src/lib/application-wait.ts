// Wachttijd-signaal per eigen reactie voor de ZZP'er. Beantwoordt op /reacties de kernvraag bij een
// nog-onbesliste reactie: "ligt mijn reactie nog, hoe lang al, en moet ik iets doen of gewoon
// afwachten?" Concurrenten (Malt/Temper/Deel) tonen kandidaten de versheid van hun sollicitatie en
// nudgen tot her-engagement; wij maken dat fase-bewust en eerlijk. Puur en deterministisch, geen
// schemawijziging — afgeleid uit de onveranderlijke `Application.createdAt` + de huidige `status`.

// Drempel in dagen waarboven een nog-onbesliste reactie per fase "aandacht" verdient. Een reactie die
// nog niet eens bekeken is (NEW) mag sneller opvallen dan een die al in behandeling is; eenmaal op de
// shortlist hoort wat meer geduld, want daar zit de opdrachtgever doorgaans nog te wikken.
export const WAIT_ATTENTION_DAYS = { NEW: 7, VIEWED: 14, SHORTLIST: 21 } as const;

export type WaitStage = keyof typeof WAIT_ATTENTION_DAYS;

const MS_PER_DAY = 86_400_000;

export interface ApplicationWaitInput {
  /** ApplicationStatus van de eigen reactie. */
  status: string;
  /** Aanmaakmoment van de reactie (onveranderlijk). */
  createdAt: Date;
  /** Of er al een samenwerking uit de reactie is voortgekomen. */
  hasCollaboration: boolean;
}

export interface ApplicationWait {
  /** Aantal hele dagen dat de reactie al onbeslist ligt (≥ 0). */
  daysWaiting: number;
  stage: WaitStage;
  /** De reactie ligt langer dan gebruikelijk voor deze fase. */
  attention: boolean;
}

function isWaitingStage(status: string): status is WaitStage {
  return status === "NEW" || status === "VIEWED" || status === "SHORTLIST";
}

/**
 * Berekent het wachttijd-signaal voor één eigen reactie. Geeft `null` terug zodra de reactie is
 * besloten (REJECTED/ACCEPTED/WITHDRAWN) of er een samenwerking uit voortkwam — dan is afwachten niet
 * meer aan de orde. `now` wordt geïnjecteerd zodat de leeftijd reproduceerbaar is. Een `createdAt` in
 * de toekomst (data-ruis) levert 0 dagen, nooit een misleidend negatief getal.
 */
export function summarizeApplicationWait(
  input: ApplicationWaitInput,
  now: Date = new Date(),
): ApplicationWait | null {
  if (input.hasCollaboration || !isWaitingStage(input.status)) return null;

  const stage = input.status;
  const daysWaiting = Math.max(
    0,
    Math.floor((now.getTime() - input.createdAt.getTime()) / MS_PER_DAY),
  );

  return { daysWaiting, stage, attention: daysWaiting >= WAIT_ATTENTION_DAYS[stage] };
}

/**
 * Telt hoeveel reacties uit een set aandacht vragen (langer dan gebruikelijk onbeslist). Pure
 * samenvatting voor de strip boven de lijst; muteert de invoer niet.
 */
export function countApplicationsAwaitingAttention(
  inputs: readonly ApplicationWaitInput[],
  now: Date = new Date(),
): number {
  let count = 0;
  for (const input of inputs) {
    if (summarizeApplicationWait(input, now)?.attention) count += 1;
  }
  return count;
}
