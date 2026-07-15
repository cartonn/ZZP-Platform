// ZZP-zijdig tarief-passendheid-signaal voor de opdrachtenlijst: vergelijkt het eigen
// uurtarief van de ZZP'er (FreelancerProfile.hourlyRate) met het gepubliceerde budget van
// een opdracht (rateMin..rateMax). Beslis-hulp bij het triëren van de find-work-lijst:
// betaalt deze opdracht wat ik vraag? Los van de matchmotor (die het profiel-hourlyRate óók
// meeweegt, maar als één van vele factoren) én los van rate-fit.ts (dat de proposedRate van
// een reactie tegen het budget zet voor de opdrachtgever op /kandidaten).
//
// Puur en deterministisch: geen DB, geen tijd, muteert niets.

export type JobRateFitTone = "good" | "warning";

export interface JobRateFitChip {
  label: string;
  tone: JobRateFitTone;
}

/**
 * Bepaalt een tarief-passendheid-chip voor één opdracht t.o.v. het eigen uurtarief.
 *
 * Retourneert `null` (geen chip — de lijst blijft rustig) wanneer:
 * - het eigen tarief onbekend of niet-positief is;
 * - de opdracht geen enkele budgetgrens heeft;
 * - het eigen tarief binnen [rateMin, rateMax] valt (de neutrale/normale situatie).
 *
 * Anders:
 * - warning `"Onder je tarief"` — het plafond (rateMax) ligt onder je eigen tarief: deze
 *   opdracht betaalt minder dan je vraagt (mogelijk overslaan of onderhandelen).
 * - good `"Boven je tarief"` — de bodem (rateMin) ligt boven je eigen tarief: deze opdracht
 *   betaalt méér dan je vraagt (kans).
 *
 * Het plafond (warning) gaat vóór de bodem (good): een opdracht kan niet tegelijk onder én
 * boven je tarief liggen, maar bij een defensieve/omgekeerde grensvolgorde (rateMin > rateMax)
 * is de "betaalt minder"-waarschuwing het zwaarste, veiligste signaal.
 */
export function jobRateFitChip(
  hourlyRate: number | null | undefined,
  rateMin: number | null | undefined,
  rateMax: number | null | undefined,
): JobRateFitChip | null {
  if (hourlyRate == null || hourlyRate <= 0) return null;
  if (rateMin == null && rateMax == null) return null;
  if (rateMax != null && hourlyRate > rateMax) {
    return { label: "Onder je tarief", tone: "warning" };
  }
  if (rateMin != null && hourlyRate < rateMin) {
    return { label: "Boven je tarief", tone: "good" };
  }
  return null;
}
