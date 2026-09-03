// Re-engagement na een doodlopend spoor: een reactie kan op twee manieren stranden op díe opdracht,
// maar niet op de markt. (1) De opdrachtgever wijst af — de deur op die opdracht is dicht. (2) De
// opdracht gaat dood terwijl de reactie nog openstaat: hij sluit, of raakt vermoedelijk vervuld door
// een ander (`application-job-availability.ts`). In beide gevallen is "blijf hierop wachten" voorbij.
// In plaats van alleen een statische "reageer gerust op andere opdrachten"-hint verankeren we een
// concreet "soortgelijke open opdrachten"-blok aan het meest recente doodlopende spoor — gevoed door
// dezelfde verklaarbare matchmotor als de rest van het platform (recommendations.ts). Deze module
// bevat alléén de pure beslissing (wélke reactie verankert het blok, en waaróm het spoor doodliep);
// het ophalen van de suggesties gebeurt in de pagina via de bestaande read-only matchfunctie.

import { type ApplicationStatus } from "@/lib/enums";

/** Waarom het spoor op deze opdracht doodliep — bepaalt de duiding in de UI (nooit de suggesties). */
export type ReengagementReason = "REJECTED" | "JOB_ENDED";

export interface ReengagementReaction {
  status: ApplicationStatus;
  /** Kwam er al een samenwerking uit deze reactie voort? Dan is er niets om opnieuw op te pakken. */
  hasCollaboration: boolean;
  /**
   * Ging de onderliggende opdracht dood terwijl deze reactie nog openstond (gesloten of vermoedelijk
   * vervuld)? Server-side afgeleid uit `applicationJobAvailability(...) != null`; puur doorgegeven.
   */
  jobDead: boolean;
  jobId: string;
  jobTitle: string;
}

export interface ReengagementAnchor {
  jobId: string;
  jobTitle: string;
  reason: ReengagementReason;
}

// Alleen een nog-openstaande reactie kan door een dode opdracht stranden (spiegelt
// `application-job-availability.ts`). De availability-helper levert `jobDead` alleen voor deze
// statussen, maar we borgen het hier ook zelf zodat de pure beslissing niet leunt op de discipline
// van de aanroeper: een reeds besliste (REJECTED/ACCEPTED/WITHDRAWN) reactie verankert nooit als
// "opdracht liep dood".
const OPEN_STATUSES: ReadonlySet<ApplicationStatus> = new Set<ApplicationStatus>([
  "NEW",
  "VIEWED",
  "SHORTLIST",
]);

/**
 * Kies de reactie die het re-engagement-blok verankert: het meest recente **doodlopende spoor**
 * waar géén samenwerking uit voortkwam. De invoer wordt verondersteld nieuw→oud geordend (de
 * canonieke `createdAt desc`-volgorde van /reacties), dus de eerste treffer is de meest recente.
 *
 * Twee sporen verankeren, met de afwijzing als het scherpste signaal:
 * - `REJECTED` (geen samenwerking) → `reason: "REJECTED"`. De opdrachtgever deed de deur op díe
 *   opdracht dicht; alternatieven zijn de logische volgende stap.
 * - een nog-openstaande reactie op een dode opdracht (`jobDead`, geen samenwerking) →
 *   `reason: "JOB_ENDED"`. De opdracht sloot of raakte vervuld terwijl de ZZP'er nog wachtte — even
 *   doodlopend, maar zonder expliciete afwijzing (het "ghosted"-geval).
 *
 * Een `WITHDRAWN`-reactie trok de ZZP'er zelf terug (kan hij zo weer oppakken) → geen ongevraagde
 * nudge. Een reactie mét samenwerking is geen doodlopend spoor meer. Bij gelijke recentheid wint de
 * afwijzing niet apart — de invoervolgorde (nieuw→oud) beslist; de eerste treffer telt. Geeft `null`
 * terug wanneer geen enkel spoor in aanmerking komt (dan toont de pagina niets — rustig scherm).
 */
export function pickReengagementAnchor(
  reactions: readonly ReengagementReaction[],
): ReengagementAnchor | null {
  for (const r of reactions) {
    if (r.hasCollaboration) continue;
    if (r.status === "REJECTED") {
      return { jobId: r.jobId, jobTitle: r.jobTitle, reason: "REJECTED" };
    }
    // Een dode opdracht telt alleen zolang de reactie zelf nog openstond.
    if (r.jobDead && OPEN_STATUSES.has(r.status)) {
      return { jobId: r.jobId, jobTitle: r.jobTitle, reason: "JOB_ENDED" };
    }
  }
  return null;
}
