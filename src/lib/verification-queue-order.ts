// Urgentie-ordening voor de admin-verificatiewachtrij (`/admin/verificaties`).
//
// De wachtrij toont per ingediend certificaat (status SUBMITTED) al een rij triage-signalen als badges —
// blokkeert-lopende-inzet, reeds-verlopen, te-lang-wachtend, verloopt-binnenkort, open-opdracht-vraag en
// herindiening — maar de LIJST zelf bleef strikt FIFO (oudste indientijd eerst). Daardoor kan het meest
// urgente item (een certificaat dat een draaiende inzet blokkeert) diep onder een stapel verse, triviale
// inzendingen verdwijnen; de admin moet dan scrollen om te vinden wat écht eerst moet.
//
// Deze module fuseert de bestaande signalen tot één deterministische prioriteitsscore en een comparator,
// zodat de wachtrij het dringendste bovenaan zet. De FIFO-eerlijkheid blijft intact als TIE-BREAK: bij
// gelijke urgentie wint nog steeds de oudste inzending. Wanneer geen enkel item een signaal heeft (score 0),
// is de volgorde identiek aan de oude pure FIFO — de ordening tilt alleen urgente items omhoog.
//
// Puur en deterministisch: geen db-/auth-import, geen schemawijziging. De aanroeper levert de reeds
// berekende signalen aan (server-side is de waarheid, CLAUDE.md regel 1). De gewichten staan in gescheiden
// grootteordes zodat een hogere tier ALTIJD elke combinatie van lagere tiers verslaat — zie de test.

/** Reeds berekende triage-signalen van één ingediende (SUBMITTED) verificatie-inzending. */
export interface VerificationQueuePrioritySignals {
  /** Aantal draaiende (ACTIVE) inzetten dat dit certificaattype verplicht vereist maar nog mist (0 = geen). */
  blocksActivePlacement: number;
  /** `expiresAt` ligt op of vóór nu — goedkeuren levert een direct ongeldige credential op. */
  alreadyExpired: boolean;
  /** Nog geldig, maar verloopt binnen het bijna-verloopvenster. */
  expiringSoon: boolean;
  /** Wacht al >= VERIFICATION_STALE_DAYS hele dagen. */
  stale: boolean;
  /** Aantal open (gepubliceerde) opdrachten dat dit certificaattype (verplicht) vereist. */
  openJobDemand: number;
  /** Deze inzending is een herindiening na een eerdere afwijzing. */
  resubmission: boolean;
}

// Vanaf hoeveel vragende open opdrachten de vraag "hoog" is — gedeeld met `verification-impact.ts`.
import { CREDENTIAL_DEMAND_HIGH_MIN } from "@/lib/verification-impact";

/**
 * Prioriteitsgewichten in gescheiden grootteordes. Elk gewicht overtreft de SOM van alle strikt lagere
 * gewichten, dus een signaal in een hogere tier wint gegarandeerd van elke mix van lagere signalen.
 * Vraag is bewust vlak (hoog/enig), niet geschaald op het aantal, zodat een grote vraagtelling nooit
 * een echte kwaliteits-/compliance-tier kan overstijgen.
 */
export const VERIFICATION_PRIORITY_WEIGHT = {
  blocksActivePlacement: 1_000_000,
  alreadyExpired: 100_000,
  stale: 10_000,
  expiringSoon: 1_000,
  demandHigh: 300,
  demandSome: 100,
  resubmission: 10,
} as const;

/**
 * Bereken de urgentiescore van één inzending uit de reeds berekende signalen. Hoger = urgenter.
 * Score 0 betekent "geen enkel signaal" → valt in de FIFO-tie-break terug op pure oudste-eerst.
 */
export function verificationQueuePriority(signals: VerificationQueuePrioritySignals): number {
  let score = 0;
  if (signals.blocksActivePlacement > 0)
    score += VERIFICATION_PRIORITY_WEIGHT.blocksActivePlacement;
  // Expiry is één as met twee standen: een reeds verlopen bewijsstuk is niet óók "binnenkort verlopen",
  // dus tel het expiry-signaal één keer (verlopen wint).
  if (signals.alreadyExpired) score += VERIFICATION_PRIORITY_WEIGHT.alreadyExpired;
  else if (signals.expiringSoon) score += VERIFICATION_PRIORITY_WEIGHT.expiringSoon;
  // Wachttijd (stale) is een onafhankelijke as en telt altijd mee.
  if (signals.stale) score += VERIFICATION_PRIORITY_WEIGHT.stale;
  if (signals.openJobDemand >= CREDENTIAL_DEMAND_HIGH_MIN)
    score += VERIFICATION_PRIORITY_WEIGHT.demandHigh;
  else if (signals.openJobDemand > 0) score += VERIFICATION_PRIORITY_WEIGHT.demandSome;
  if (signals.resubmission) score += VERIFICATION_PRIORITY_WEIGHT.resubmission;
  return score;
}

/** Ordeningsvelden van een wachtrij-item: de score plus de FIFO-sleutel voor de tie-break. */
export interface VerificationQueueOrderKey {
  priority: number;
  submittedAt: Date | null;
  updatedAt: Date;
  id: string;
}

/**
 * Comparator voor de wachtrij: urgentst eerst, bij gelijke urgentie oudste inzending eerst (FIFO).
 * De FIFO-sleutel spiegelt de oude DB-ordening exact: `submittedAt` oplopend met legacy-nulls achteraan,
 * dan `updatedAt` oplopend, dan `id` voor een volledig stabiele (deterministische) volgorde.
 */
export function compareVerificationQueuePriority(
  a: VerificationQueueOrderKey,
  b: VerificationQueueOrderKey,
): number {
  if (a.priority !== b.priority) return b.priority - a.priority; // hogere score eerst
  // FIFO-tie-break: submittedAt oplopend, nulls achteraan.
  if (a.submittedAt && b.submittedAt) {
    const diff = a.submittedAt.getTime() - b.submittedAt.getTime();
    if (diff !== 0) return diff;
  } else if (a.submittedAt && !b.submittedAt) {
    return -1; // b is legacy (null) → achteraan
  } else if (!a.submittedAt && b.submittedAt) {
    return 1; // a is legacy (null) → achteraan
  }
  const updatedDiff = a.updatedAt.getTime() - b.updatedAt.getTime();
  if (updatedDiff !== 0) return updatedDiff;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Sorteer een wachtrij op urgentie zonder de invoer te muteren. `toKey` levert per item de score plus
 * de FIFO-sleutel; de stabiele comparator doet de rest.
 */
export function orderVerificationQueue<T>(
  items: ReadonlyArray<T>,
  toKey: (item: T) => VerificationQueueOrderKey,
): T[] {
  return items
    .map((item) => ({ item, key: toKey(item) }))
    .sort((a, b) => compareVerificationQueuePriority(a.key, b.key))
    .map((entry) => entry.item);
}
