// Event A — Contract getekend.

import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { computeCompliance } from "@/lib/matching";
import { complianceBlocksPlacement } from "@/lib/collaborations";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { type CredentialType, type CredentialStatus, type CollaborationStatus } from "@/lib/enums";
import { getMailSender } from "@/lib/services/mail-sender";
import { buildContractSignedEmail } from "@/lib/services/cascade-emails";
import { planContractSigned } from "@/lib/cascade/handlers";
import {
  CascadeError,
  assertParty,
  persistEventAndEffects,
  loadCollabMeta,
  collabLink,
} from "@/lib/cascade/commands-shared";

// --- Event A — Contract getekend -------------------------------------------
export async function signContract(actor: Actor, collaborationId: string): Promise<void> {
  const col = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    include: {
      company: { select: { userId: true } },
      freelancer: {
        select: {
          userId: true,
          credentials: { select: { type: true, status: true, expiresAt: true } },
        },
      },
      job: {
        select: {
          title: true,
          credentialRequirements: { where: { required: true }, select: { credentialType: true } },
        },
      },
    },
  });
  if (!col) throw new CascadeError("Samenwerking niet gevonden.");
  // Niet-partij krijgt exact dezelfde "… niet gevonden."-melding als een onbekend id (anti-oracle).
  assertParty(actor, col.freelancer.userId, col.company.userId, "Samenwerking niet gevonden.");

  // Dispuut-vries (CLAUDE.md: "dispuut bevriest de cascade"): een bevroren samenwerking mag haar
  // contractstatus niet vooruitbewegen (PROPOSED → ACTIVE). Symmetrisch met de rest van de
  // command-familie; de in-transactie-grendel wordt hieronder via `disputeGuardCollaborationId`
  // bedraad (TOCTOU-dicht tegen een dispuut dat ná deze lees maar vóór de commit wordt geopend).
  if (col.disputedAt)
    throw new CascadeError(
      "De samenwerking is bevroren wegens een open dispuut. Los het dispuut eerst op.",
    );

  // Inzetbaarheid-gate (ADR-0006, C-hybride): een samenwerking kan niet starten zonder dat de ZZP'er
  // aan de harde certificaateisen voldoet. Server-side waarheid (CLAUDE.md regel 1) — de UI verbergt de
  // teken-knop al, dit is de defense-in-depth. WARNING (in beoordeling/bijna verlopen) blokkeert niet.
  const requiredTypes = col.job.credentialRequirements.map(
    (r) => r.credentialType as CredentialType,
  );
  if (requiredTypes.length > 0) {
    const compliance = computeCompliance(
      requiredTypes,
      col.freelancer.credentials.map((c) => ({
        type: c.type as CredentialType,
        status: c.status as CredentialStatus,
        expiresAt: c.expiresAt,
      })),
    );
    if (complianceBlocksPlacement(compliance.status)) {
      const ontbreekt = [...compliance.missing, ...compliance.expired]
        .map((t) => CREDENTIAL_TYPE_LABEL[t])
        .join(", ");
      throw new CascadeError(
        `Deze samenwerking kan niet starten: een vereist certificaat ontbreekt of is verlopen (${ontbreekt}). Vul het aan via Certificaten en onderteken daarna opnieuw.`,
      );
    }
  }

  const effects = planContractSigned({
    collaborationId,
    status: col.status as CollaborationStatus,
    freelancerUserId: col.freelancer.userId,
    clientUserId: col.company.userId,
    jobTitle: col.job.title,
    actorId: actor.id,
  });

  await persistEventAndEffects(
    {
      type: "CONTRACT_SIGNED",
      actorRole: actor.role,
      actorId: actor.id,
      subjectType: "Collaboration",
      subjectId: collaborationId,
      correlationId: collaborationId,
      dedupeKey: `contract-signed-${collaborationId}`,
    },
    effects,
    {
      owners: { FREELANCER: col.freelancer.userId, CLIENT: col.company.userId },
      correlationId: collaborationId,
      // In-transactie dispuut-grendel: rolt de contract-ondertekening terug als er ná de pre-check
      // (net) een dispuut werd geopend — de deal blijft bevroren tot de admin het oplost.
      disputeGuardCollaborationId: collaborationId,
    },
  );

  // Best-effort e-mail naar beide partijen.
  try {
    const meta = await loadCollabMeta(collaborationId);
    if (meta) {
      const mail = getMailSender();
      const link = collabLink(collaborationId);
      await mail.send(
        buildContractSignedEmail({ recipient: meta.freelancer, jobTitle: meta.jobTitle, link }),
      );
      await mail.send(
        buildContractSignedEmail({ recipient: meta.client, jobTitle: meta.jobTitle, link }),
      );
    }
  } catch {}
}
