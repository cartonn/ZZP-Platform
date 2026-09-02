// Uitvoering van het bewijsstuk-bewaarbeleid: het bestand achter een beoordeeld certificaat
// verwijderen en alleen "gezien + datum" laten staan (zie credential-evidence-policy.ts voor het
// waarom). Eén schrijfpunt, gedeeld door de verificatiequeue (direct na de beslissing) en de
// opruimtaak (die een eerder mislukte verwijdering opnieuw probeert).
//
// Volgorde is bewust: eerst het bestand uit de opslag, pas daarna de DB-ontkoppeling. Mislukt de
// opslag-verwijdering, dan blijven `documentId` én de opslagsleutel staan zodat de opruimtaak het
// bestand terug kan vinden — precies wat je kwijt bent als je de rij eerst wist. De beslissing
// (VERIFIED/REJECTED) is dan al onherroepelijk geland; alleen `evidenceRemovedAt` blijft leeg.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { getStorage } from "@/lib/services/storage";
import { logStorageCleanupFailure } from "@/lib/observability/storage-failure";
import { logger } from "@/lib/observability/logger";
import { EVIDENCE_REMOVAL_REASON } from "@/lib/credential-evidence-policy";

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

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { storageKey: true },
  });
  if (!doc) return { removed: false, skipped: "no-document" }; // al opgeruimd

  // Documenten worden per upload aangemaakt, dus een gedeeld bewijsstuk bestaat in de praktijk niet.
  // Mocht een tweede certificaat er tóch naar verwijzen, dan wissen we niets: het bestand is dan nog
  // in gebruik en de opruiming is geen dataminimalisatie maar dataverlies voor die andere rij.
  const otherReferences = await prisma.credential.count({
    where: { documentId, id: { not: opts.credentialId } },
  });
  if (otherReferences > 0) {
    logger.warn(`${opts.source} bewijsstuk niet verwijderd — nog gekoppeld aan een ander dossier`, {
      credentialId: opts.credentialId,
    });
    return { removed: false, skipped: "still-referenced" };
  }

  try {
    await getStorage().delete(doc.storageKey);
  } catch (err) {
    // Gestructureerd loggen (nooit stil slagen): de beslissing gaat door, maar `evidenceRemovedAt`
    // blijft leeg zodat de opruimtaak dit certificaat opnieuw oppakt.
    logStorageCleanupFailure(opts.source, doc.storageKey, err);
    return { removed: false, skipped: "storage-failed" };
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    // Compound-guard: alleen ontkoppelen zolang de credential nog naar exact dít bewijsstuk wijst.
    // Uploadde de ZZP'er intussen een nieuw bewijsstuk (herindienen), dan matcht dit 0 rijen en
    // laten we die nieuwe koppeling met rust.
    await tx.credential.updateMany({
      where: { id: opts.credentialId, documentId },
      data: { documentId: null, evidenceRemovedAt: now },
    });
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
  });

  return { removed: true, skipped: null };
}
