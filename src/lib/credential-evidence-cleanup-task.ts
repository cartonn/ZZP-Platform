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

/** Hard per-invocation bound on candidates, including policy skips and storage failures. */
const BATCH_SIZE = 200;
const CURSOR_ID = "singleton";

async function reserveCleanupPage() {
  return prisma.$transaction(async (tx) => {
    // A real write serializes reservations on PostgreSQL and SQLite. Keep this
    // transaction short: no storage I/O while holding the singleton row lock.
    const cursor = await tx.evidenceCleanupCursor.upsert({
      where: { id: CURSOR_ID },
      create: { id: CURSOR_ID },
      update: { id: CURSOR_ID },
    });
    const load = (after: string) =>
      tx.credential.findMany({
        where: {
          evidenceSeenAt: { not: null },
          evidenceRemovedAt: null,
          documentId: { not: null },
          id: { gt: after },
        },
        select: { id: true, type: true, documentId: true },
        orderBy: { id: "asc" },
        take: BATCH_SIZE,
      });
    let rows = await load(cursor.lastCredentialId);
    // At most two bounded queries. Use the existing primary-key index; the
    // continuation remains valid even if its credential has since been deleted.
    if (!rows.length && cursor.lastCredentialId) rows = await load("");
    await tx.evidenceCleanupCursor.update({
      where: { id: CURSOR_ID },
      data: { lastCredentialId: rows.at(-1)?.id ?? "" },
    });
    // Reserve before attempting storage. A crashed run skips its page only until
    // the next cycle, rather than pinning every subsequent run on that page.
    return rows;
  });
}

export async function runCredentialEvidenceCleanupTask(): Promise<EvidenceCleanupResult> {
  let removed = 0;
  let failed = 0;
  const rows = await reserveCleanupPage();
  for (const row of rows) {
    // Recheck the live override; reserving work never authorizes deleting a file.
    if (!shouldRemoveEvidenceAfterReview(row.type as CredentialType)) continue;
    const result = await removeCredentialEvidence({
      actorId: null,
      credentialId: row.id,
      documentId: row.documentId,
      source: "[bewijsstuk-opruiming]",
    });
    if (result.removed) removed += 1;
    else failed += 1;
  }
  return { removed, failed };
}
