// Re-engagement na afwijzing: een afgewezen reactie is een doodlopend spoor op díe opdracht, maar
// niet op de markt. In plaats van alleen een statische "reageer gerust op andere opdrachten"-hint
// verankeren we een concreet "soortgelijke open opdrachten"-blok aan de meest recente afwijzing —
// gevoed door dezelfde verklaarbare matchmotor als de rest van het platform (recommendations.ts).
// Deze module bevat alléén de pure beslissing (wélke afwijzing verankert het blok); het ophalen van
// de suggesties gebeurt in de pagina via de bestaande read-only matchfunctie.

import { type ApplicationStatus } from "@/lib/enums";

export interface ReengagementReaction {
  status: ApplicationStatus;
  /** Kwam er al een samenwerking uit deze reactie voort? Dan is er niets om opnieuw op te pakken. */
  hasCollaboration: boolean;
  jobId: string;
  jobTitle: string;
}

export interface ReengagementAnchor {
  jobId: string;
  jobTitle: string;
}

/**
 * Kies de reactie die het re-engagement-blok verankert: de meest recente **afgewezen** reactie
 * waar géén samenwerking uit voortkwam. De invoer wordt verondersteld nieuw→oud geordend (de
 * canonieke `createdAt desc`-volgorde van /reacties), dus de eerste treffer is de meest recente.
 *
 * Alleen `REJECTED` verankert: de opdrachtgever heeft de deur op díe opdracht dicht gedaan, dus
 * alternatieven zijn de logische volgende stap. Een `WITHDRAWN`-reactie trok de ZZP'er zelf terug
 * (kan hij zo weer oppakken) → geen ongevraagde nudge. Een reactie mét samenwerking is geen
 * afwijzing meer. Geeft `null` terug wanneer geen enkele afwijzing in aanmerking komt (dan toont de
 * pagina niets — rustig scherm).
 */
export function pickReengagementAnchor(
  reactions: readonly ReengagementReaction[],
): ReengagementAnchor | null {
  const hit = reactions.find((r) => r.status === "REJECTED" && !r.hasCollaboration);
  return hit ? { jobId: hit.jobId, jobTitle: hit.jobTitle } : null;
}
