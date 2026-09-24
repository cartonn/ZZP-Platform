// Uitvoering van het bewijsstuk-bewaarbeleid: het bestand achter een beoordeeld certificaat
// verwijderen en alleen "gezien + datum" laten staan (zie credential-evidence-policy.ts voor het
// waarom). Eén schrijfpunt, gedeeld door de verificatiequeue (direct na de beslissing) en de
// opruimtaak (die een eerder mislukte verwijdering opnieuw probeert).
//
// Order: claim the document durably, delete storage outside the transaction, then unlink.
// The claim is never released: even a timed-out storage request could still delete the bytes.
// Same-file resubmission must acquire the same document row before its status transition.
// Volgorde is bewust: eerst het bestand uit de opslag, pas daarna de DB-ontkoppeling. Mislukt de
// opslag-verwijdering, dan blijven `documentId` én de opslagsleutel staan zodat de opruimtaak het
// bestand terug kan vinden — precies wat je kwijt bent als je de rij eerst wist. De beslissing
// (VERIFIED/REJECTED) is dan al onherroepelijk geland; alleen `evidenceRemovedAt` blijft leeg.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { getStorage } from "@/lib/services/storage";
import { logStorageCleanupFailure } from "@/lib/observability/storage-failure";
import { logger } from "@/lib/observability/logger";
import { type Prisma } from "@prisma/client";
import { type CredentialType } from "@/lib/enums";
import {
  EVIDENCE_REMOVAL_REASON,
  shouldRemoveEvidenceAfterReview,
} from "@/lib/credential-evidence-policy";

export interface EvidenceRemovalResult {
  /** Bestand verwijderd én de credential ontkoppeld (`evidenceRemovedAt` gezet). */
  removed: boolean;
  /** Waarom er niets te doen was, of waarom het niet lukte. `null` bij succes. */
  skipped: "no-document" | "storage-failed" | "still-referenced" | null;
}

/**
 * Verwijdert het bewijsstuk van een beoordeeld certificaat: bestand uit de opslag, Document-record
 * weg, `documentId` ontkoppeld, `evidenceRemovedAt` gezet en een auditregel geschreven.
 *
 * Werpt nooit: een mislukte opslag-verwijdering mag de beslissing van de beoordelaar niet
 * terugdraaien. De fout wordt PII-veilig gelogd en `evidenceRemovedAt` blijft leeg, zodat de
 * opruimtaak (`runCredentialEvidenceCleanupTask`) het later opnieuw probeert.
 *
 * @param actorId      Beoordelaar (of `null` voor de geplande opruimtaak).
 * @param credentialId Het beoordeelde certificaat.
 * @param documentId   Het bewijsstuk dat de beoordelaar zag — de guard voorkomt dat een intussen
 *                     nieuw geüpload bewijsstuk per ongeluk wordt ontkoppeld.
 */
export async function removeCredentialEvidence(opts: {
  actorId: string | null;
  credentialId: string;
  documentId: string | null;
  source: string;
}): Promise<EvidenceRemovalResult> {
  const documentId = opts.documentId;
  if (!documentId) return { removed: false, skipped: "no-document" };

  // Both cleanup and same-file resubmission write this row first. On PostgreSQL the
  // UPDATE holds the row lock until commit; SQLite serializes the writers. Recheck
  // the credential AFTER acquiring it, so a resubmission that won is never erased.
  let doc: { storageKey: string } | null;
  try {
    doc = await prisma.$transaction(async (tx) => {
      const claim = await tx.document.updateMany({
        where: { id: documentId },
        data: { id: documentId },
      });
      if (!claim.count) return null;
      const credential = await tx.credential.findFirst({
        where: {
          id: opts.credentialId,
          documentId,
          evidenceSeenAt: { not: null },
          evidenceRemovedAt: null,
          status: { in: ["VERIFIED", "REJECTED", "EXPIRED"] },
        },
        select: { type: true },
      });
      if (!credential || !shouldRemoveEvidenceAfterReview(credential.type as CredentialType)) {
        throw new EvidenceClaimUnavailable("no-document");
      }
      const references = await tx.credential.count({
        where: { documentId, id: { not: opts.credentialId } },
      });
      if (references) throw new EvidenceClaimUnavailable("still-referenced");
      // Preserve the original start time on retries; never clear a committed claim.
      await tx.document.updateMany({
        where: { id: documentId, evidenceRemovalStartedAt: null },
        data: { evidenceRemovalStartedAt: new Date() },
      });
      return tx.document.findUnique({ where: { id: documentId }, select: { storageKey: true } });
    });
  } catch (error) {
    if (error instanceof EvidenceClaimUnavailable) {
      if (error.reason === "still-referenced") {
        logger.warn(
          `${opts.source} bewijsstuk niet verwijderd — nog gekoppeld aan een ander dossier`,
          {
            credentialId: opts.credentialId,
          },
        );
      }
      return { removed: false, skipped: error.reason };
    }
    throw error;
  }
  if (!doc) return { removed: false, skipped: "no-document" };

  try {
    await getStorage().delete(doc.storageKey);
  } catch (err) {
    // Gestructureerd loggen (nooit stil slagen): de beslissing gaat door, maar `evidenceRemovedAt`
    // blijft leeg zodat de opruimtaak dit certificaat opnieuw oppakt.
    logStorageCleanupFailure(opts.source, doc.storageKey, err);
    return { removed: false, skipped: "storage-failed" };
  }

  const now = new Date();
  const unlinked = await prisma.$transaction(async (tx) => {
    // Compound-guard: alleen ontkoppelen zolang de credential nog naar exact dít bewijsstuk wijst.
    // Uploadde de ZZP'er intussen een nieuw bewijsstuk (herindienen), dan matcht dit 0 rijen en
    // laten we die nieuwe koppeling met rust.
    const res = await tx.credential.updateMany({
      where: { id: opts.credentialId, documentId },
      data: { documentId: null, evidenceRemovedAt: now },
    });
    // Matcht 0 rijen → de credential wijst niet meer naar dít bewijsstuk: een gelijktijdige
    // herindiening of een parallelle opruimloop (queue + cron, of twee cron-ticks — geen lock) was
    // ons voor. Dan niets meer wissen en — cruciaal — GEEN CREDENTIAL_EVIDENCE_REMOVED-audit schrijven
    // voor een verwijdering die déze aanroep niet uitvoerde. Anders staat er een spookregel in het
    // audittrail (dubbele "verwijderd"-gebeurtenis) en telt de opruimtaak een niet-uitgevoerde
    // verwijdering mee (CLAUDE.md regel 5 — audit moet de werkelijkheid weerspiegelen).
    if (res.count === 0) return false;
    await tx.document.deleteMany({ where: { id: documentId } });
    await tx.auditLog.create({
      data: auditData({
        actorId: opts.actorId,
        action: "CREDENTIAL_EVIDENCE_REMOVED",
        entityType: "Credential",
        entityId: opts.credentialId,
        metadata: { reason: EVIDENCE_REMOVAL_REASON },
      }),
    });
    return true;
  });

  // De opslag-verwijdering is idempotent al gedaan; alleen de DB-ontkoppeling verloor de race. Meld
  // dit als "no-document" (er viel voor deze credential niets meer te ontkoppelen), niet als succes.
  if (!unlinked) return { removed: false, skipped: "no-document" };

  return { removed: true, skipped: null };
}

class EvidenceClaimUnavailable extends Error {
  constructor(readonly reason: "no-document" | "still-referenced") {
    super(reason);
  }
}

/** Serialize evidence reuse with cleanup, inside the credential transition transaction. */
export async function assertReusableCredentialEvidence(
  tx: Prisma.TransactionClient,
  documentId: string | null,
) {
  if (!documentId) return;
  const result = await tx.document.updateMany({
    where: { id: documentId, evidenceRemovalStartedAt: null },
    data: { evidenceRemovalStartedAt: null },
  });
  if (!result.count) throw new EvidenceReuseUnavailableError();
}

export class EvidenceReuseUnavailableError extends Error {
  constructor() {
    super("Dit bewijsstuk wordt verwijderd. Upload een nieuw bewijsstuk.");
  }
}
