// Plaatsbaarheids-signaal voor het roster-overzicht van de bemiddelaar (`/franchise/zzpers`).
// Beantwoordt op de lijst zelf de vervolgvraag ná "wie is vrij?": "wie is vrij ÉN direct plaatsbaar
// op een open dienst?". Zonder dit signaal moet de bemiddelaar elk profiel openen om te zien of er
// een dienst voor die persoon is; nu ziet hij het per kaart en filtert hij zijn bench in één oogopslag
// op wie hij vandaag nog kan voordragen (bezetting maximaliseren, benchmark Pidz/Zorgwerk).
//
// Read-only. Hergebruikt exact dezelfde matchmotor (`scoreJobForFreelancer`) én drempel
// (`DIENST_SUGGESTIE_MIN_SCORE`) als de detail-suggestiekaart (`dienst-suggesties.ts`), zodat een
// "3 passende diensten"-chip op de lijst exact overeenkomt met de rijen die de bemiddelaar op het
// detail ziet — lijst en detail spreken elkaar nooit tegen. Server-side blijft de waarheid; deze
// helper levert enkel de afgeleide presentatie (CLAUDE.md regel 1).

import {
  type JobMatchSource,
  type FreelancerMatchSource,
  scoreJobForFreelancer,
} from "@/lib/matching";
import {
  DIENST_SUGGESTIE_LIMIT,
  DIENST_SUGGESTIE_MIN_SCORE,
} from "@/lib/franchise/dienst-suggesties";

/**
 * Aantal open diensten waarop deze ZZP'er plaatsbaar is: diensten met een matchscore ≥ de drempel.
 * Dezelfde drempel en scoring als de detail-suggestiekaart. Rúwe telling (niet begrensd) — de
 * headline gebruikt alleen `> 0` en de chip-label begrenst zelf tot de kaart-limiet, zodat de chip
 * nooit méér claimt dan de bemiddelaar op het detail ziet.
 */
export function countPlaceableDiensten(
  freelancer: FreelancerMatchSource,
  jobs: readonly JobMatchSource[],
  now: Date = new Date(),
  minScore: number = DIENST_SUGGESTIE_MIN_SCORE,
): number {
  let count = 0;
  for (const job of jobs) {
    if (scoreJobForFreelancer(job, freelancer, now).score >= minScore) count += 1;
  }
  return count;
}

/**
 * Chip-label per roster-kaart: "N passende diensten". Null bij nul, zodat een vrije vakmens zónder
 * passende open dienst geen loze chip krijgt en de lijst rustig blijft. De detail-suggestiekaart
 * toont maximaal `DIENST_SUGGESTIE_LIMIT` rijen; de chip mag daarom nooit een hoger exact getal
 * claimen dan de bemiddelaar op het detail terugziet — boven de limiet toont hij "N+", zodat lijst
 * en detail elkaar nooit tegenspreken (DOEL 1b: interne consistentie van het next-action-signaal).
 */
export function placeableChipLabel(count: number): string | null {
  if (count <= 0) return null;
  if (count === 1) return "1 passende dienst";
  if (count > DIENST_SUGGESTIE_LIMIT) return `${DIENST_SUGGESTIE_LIMIT}+ passende diensten`;
  return `${count} passende diensten`;
}

/**
 * Kop boven het roster: hoeveel vrije vakmensen zijn nu direct plaatsbaar. Null (geen kop) bij nul,
 * zodat de lijst niets toont als er niets te plaatsen valt — geen ruis, alleen wat actie vraagt.
 */
export function placeableHeadline(placeableCount: number): string | null {
  if (placeableCount <= 0) return null;
  return placeableCount === 1
    ? "1 vrije vakmens is direct plaatsbaar op een open dienst"
    : `${placeableCount} vrije vakmensen zijn direct plaatsbaar op een open dienst`;
}
