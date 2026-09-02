// Geplande opruiming van bewijsstukken die ná de beoordeling hadden moeten verdwijnen.
//
// De verificatiequeue verwijdert het VOG-bestand direct na de beslissing. Mislukt die opslag-actie
// (S3 tijdelijk onbereikbaar), dan gaat de beslissing bewust wél door en blijft `evidenceRemovedAt`
// leeg — het bestand staat er dan nog. Deze taak pakt precies die rijen op en probeert het opnieuw,
// zodat een storing niet stilzwijgend een strafrechtelijk gegeven achterlaat (AVG art. 5(1)(e)).
//
// Geen auth hier — de aanroeper (cron-route) autoriseert. Idempotent: een rij zonder bestand of met
// een al gezette `evidenceRemovedAt` valt buiten de selectie.

import { prisma } from "@/lib/db";
import { shouldRemoveEvidenceAfterReview } from "@/lib/credential-evidence-policy";
import { removeCredentialEvidence } from "@/lib/credential-evidence";
import { type CredentialType } from "@/lib/enums";

export interface EvidenceCleanupResult {
  /** Aantal bewijsstukken dat alsnog is verwijderd. */
  removed: number;
  /** Aantal dat opnieuw niet lukte — blijft openstaan voor de volgende run. */
  failed: number;
}

/** Defensieve cap, zoals de andere taakrunners: één tick blijft begrensd, de rest volgt vanzelf. */
const BATCH_SIZE = 200;

export async function runCredentialEvidenceCleanupTask(): Promise<EvidenceCleanupResult> {
  const rows = await prisma.credential.findMany({
    where: {
      // Beoordeeld (`evidenceSeenAt` wordt alleen bij een beslissing gezet), bewijsstuk nog aanwezig,
      // opruiming nog niet voltooid.
      evidenceSeenAt: { not: null },
      evidenceRemovedAt: null,
      documentId: { not: null },
    },
    select: { id: true, type: true, documentId: true },
    orderBy: { evidenceSeenAt: "asc" },
    take: BATCH_SIZE,
  });

  let removed = 0;
  let failed = 0;
  for (const row of rows) {
    // Beleid opnieuw toetsen: zet een operator de env-override op "file", dan stopt ook deze taak
    // met wissen (de override is de bewuste juridische uitzondering, niet iets wat we omzeilen).
    if (!shouldRemoveEvidenceAfterReview(row.type as CredentialType)) continue;
    const result = await removeCredentialEvidence({
      actorId: null, // systeemactie
      credentialId: row.id,
      documentId: row.documentId,
      source: "[bewijsstuk-opruiming]",
    });
    if (result.removed) removed += 1;
    else failed += 1;
  }

  return { removed, failed };
}
