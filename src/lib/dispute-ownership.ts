import type { PrismaClient } from "@prisma/client";

// Attributie van de LIVE dispuutreden op een samenwerking. Bewust los en injecteerbaar (structurele
// `db`-parameter, zoals account-export.ts) zodat het zonder database unit-testbaar is en door zowel de
// AVG-inzage-export als de AVG-erasure gedeeld kan worden.

const DISPUTE_OPENED = "DISPUTE_OPENED";
const DISPUTE_RESOLVED = "DISPUTE_RESOLVED";

/**
 * Geeft de samenwerkingen terug waarvan het OP DIT MOMENT actieve dispuut door `actorId` is geopend.
 *
 * Waarom dit niet gelijk is aan "alle DISPUTE_OPENED-events van de actor": `Collaboration.disputeReason`
 * is één muteerbaar veld. `resolveDispute` (admin) wist het; daarna kan de TEGENPARTIJ een nieuw dispuut
 * openen op dezelfde samenwerking, waardoor `disputeReason` nu de tekst van de tegenpartij bevat terwijl
 * er nog steeds een óud DISPUTE_OPENED-event van de actor bestaat. Wie de actor als eigenaar van die
 * live reden behandelt op basis van dat oude event, leest of wist dan de reden van een ander:
 *   - in de inzage-export lekt de live dispuutreden van de tegenpartij in het eigen-data-bestand van de
 *     actor (AVG art. 5(1)(f) confidentialiteit; cross-party PII-lek, OWASP A01);
 *   - in de erasure wordt het lopende dispuutbewijs van de tegenpartij vernietigd (integriteit).
 *
 * Daarom herspelen we het dispuut-eventlog per samenwerking (OPENED zet de huidige opener, RESOLVED
 * wist 'm) en geven we alleen de samenwerkingen terug waar de actor de opener van het huidige, nog-open
 * dispuut is. Dit spiegelt exact de disputedAt/disputeReason-toestandsmachine in
 * `src/lib/cascade/dispute-commands.ts`.
 *
 * NB: dit scopet uitsluitend de LIVE `disputeReason`-veldwaarde. De verbatim kopieën van de EIGEN reden
 * van de actor in de event-payload/audit-metadata blijven correct gescopet op `actorId` (die zijn en
 * blijven van de actor, ook na oplossing) en worden hier niet door geraakt.
 */
export async function collaborationsWithActiveDisputeOpenedBy(
  db: PrismaClient,
  actorId: string,
): Promise<string[]> {
  // Kandidaten: samenwerkingen waar de actor ooit een dispuut opende.
  const opened = await db.domainEvent.findMany({
    where: { type: DISPUTE_OPENED, actorId },
    select: { subjectId: true },
  });
  const candidateIds = [...new Set(opened.map((e) => e.subjectId))];
  if (candidateIds.length === 0) return [];

  // Álle open/opgelost-events van die kandidaten (van álle partijen), chronologisch, om de huidige
  // opener per samenwerking te bepalen. `occurredAt` is de domein-tijd; `id` als deterministische
  // tiebreak bij gelijke tijdstempels.
  const events = await db.domainEvent.findMany({
    where: {
      subjectId: { in: candidateIds },
      subjectType: "Collaboration",
      type: { in: [DISPUTE_OPENED, DISPUTE_RESOLVED] },
    },
    select: { subjectId: true, type: true, actorId: true },
    orderBy: [{ occurredAt: "asc" }, { id: "asc" }],
  });

  // Replay: het laatste event per samenwerking bepaalt de huidige toestand.
  const currentOpener = new Map<string, string | null>();
  for (const e of events) {
    currentOpener.set(e.subjectId, e.type === DISPUTE_OPENED ? e.actorId : null);
  }

  return candidateIds.filter((id) => currentOpener.get(id) === actorId);
}
