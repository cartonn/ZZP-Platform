// Aandacht-sortering voor de opdrachtgever-opdrachtlijst ("Mijn opdrachten"). De lijst stond op
// `updatedAt desc`; opdrachten die nú actie vragen dreven daardoor niet naar boven en de opdrachtgever
// moest elke kaart afscannen. Deze module rangschikt puur en deterministisch op de reeds server-side
// berekende per-opdracht-signalen (geen I/O), zodat de kaarten die actie vragen bovenaan komen —
// Linear/Vercel-patroon: toon eerst wat telt en wat actie vraagt. Bij gelijke rang blijft de bestaande
// `updatedAt desc`-volgorde behouden (stabiele sort), dus rustige/concept/gesloten opdrachten schuiven
// niet onnodig door.

/** De reeds elders berekende aandacht-signalen van één opdracht, teruggebracht tot wat de rang bepaalt. */
export interface ClientJobAttention {
  /** `jobFillUrgency`-toon: acuut (start ≤7d/verstreken, onvervuld) of soon (≤21d), of geen chip. */
  fillTone: "acute" | "soon" | null;
  /** `JobPipeline.needsAttention`: er staan nieuwe, nog niet bekeken reacties klaar. */
  newApplications: boolean;
  /** `summarizeVacancyPerformance.attention`: de opdracht loopt koud (te weinig respons-momentum). */
  vacancyAttention: boolean;
}

// Tier-gewichten. Acuut onbezet is de scherpste operationele klem (een dienst die morgen zonder iemand
// start) en staat als harde bovenste tier boven élke combinatie van de overige signalen
// (100 > 40 + 20 + 10). Daaronder wegen nieuwe kandidaten (de opdrachtgever is de flessenhals) zwaarder
// dan een naderende-maar-niet-acute start, en die weer zwaarder dan een koud lopende vacature (het minst
// tijdkritisch). De gewichten zijn optelbaar zodat een opdracht met meerdere signalen hoger uitkomt.
const WEIGHT_FILL_ACUTE = 100;
const WEIGHT_NEW_APPLICATIONS = 40;
const WEIGHT_FILL_SOON = 20;
const WEIGHT_VACANCY_ATTENTION = 10;

/**
 * Aandacht-rang van één opdracht: hoger = urgenter (drijft naar boven). Nul betekent "geen signaal" —
 * die opdrachten behouden onderling hun binnenkomende (`updatedAt desc`) volgorde.
 */
export function clientJobAttentionRank(a: ClientJobAttention): number {
  let rank = 0;
  if (a.fillTone === "acute") rank += WEIGHT_FILL_ACUTE;
  else if (a.fillTone === "soon") rank += WEIGHT_FILL_SOON;
  if (a.newApplications) rank += WEIGHT_NEW_APPLICATIONS;
  if (a.vacancyAttention) rank += WEIGHT_VACANCY_ATTENTION;
  return rank;
}

/**
 * Stabiele sort op aandacht-rang (aflopend). Behoudt de binnenkomende volgorde bij gelijke rang, zodat
 * de bestaande `updatedAt desc`-ordening intact blijft voor opdrachten zonder aandacht-signaal. Puur:
 * muteert de invoer niet.
 */
export function sortJobsByAttention<T>(items: readonly T[], rankOf: (item: T) => number): T[] {
  return items
    .map((item, index) => ({ item, index, rank: rankOf(item) }))
    .sort((a, b) => b.rank - a.rank || a.index - b.index)
    .map((entry) => entry.item);
}
