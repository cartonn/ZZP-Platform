import "server-only";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/db";
import { assertAuthenticated, type Actor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { buildModelAgreementContent, resolveAgreementType } from "@/lib/contract-agreement";
import { buildModelAgreementPdf } from "@/lib/contract-pdf";
import { recommendModelAgreement } from "@/lib/model-agreement";
import {
  SIGNING_CONSENT,
  SigningEvidenceErasedError,
  LegacySigningEvidenceError,
  hasLegacySigningGap,
  SIGNING_CONSENT_VERSION,
  SIGNING_METHOD_NOTE,
  signingInputSchema,
  signingParty,
  type SigningDocument,
} from "@/lib/signing-contract";
import { reauthRateLimiter } from "@/lib/rate-limit";
import { computeCompliance } from "@/lib/matching";
import { complianceBlocksPlacement } from "@/lib/collaborations";
import { type CredentialStatus, type CredentialType } from "@/lib/enums";
import { planContractSigned } from "@/lib/cascade/handlers";
import { applyCascadeEffects } from "@/lib/cascade/apply";
import { invalidateSignals } from "@/lib/signals/invalidate";
import { collabLink, loadCollabMeta } from "@/lib/cascade/commands-shared";
import { getMailSender } from "@/lib/services/mail-sender";
import { buildContractSignedEmail } from "@/lib/services/cascade-emails";

const signingInclude = {
  company: { select: { userId: true, name: true } },
  freelancer: {
    select: {
      userId: true,
      user: { select: { name: true } },
      credentials: { select: { type: true, status: true, expiresAt: true } },
    },
  },
  job: {
    select: {
      title: true,
      description: true,
      modelAgreementType: true,
      dbaDirectSupervision: true,
      dbaEmbedded: true,
      dbaFixedSchedule: true,
      dbaNoSubstitution: true,
      dbaExclusive: true,
      dbaWeakEntrepreneurship: true,
      dbaDurationMonths: true,
      credentialRequirements: { where: { required: true }, select: { credentialType: true } },
    },
  },
  signing: { include: { signatures: { orderBy: { signedAt: "asc" as const } } } },
} satisfies Prisma.CollaborationInclude;
type SigningCollaboration = Prisma.CollaborationGetPayload<{ include: typeof signingInclude }>;

export const signingHash = (value: string | Uint8Array) =>
  createHash("sha256").update(value).digest("hex");
const longDate = (date: Date | null) =>
  date?.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  });

export function buildSigningDocument(col: SigningCollaboration): SigningDocument {
  const recommendation = recommendModelAgreement({
    directSupervision: col.job.dbaDirectSupervision,
    embedded: col.job.dbaEmbedded,
    fixedSchedule: col.job.dbaFixedSchedule,
    noSubstitution: col.job.dbaNoSubstitution,
    exclusive: col.job.dbaExclusive,
    weakEntrepreneurship: col.job.dbaWeakEntrepreneurship,
    durationMonths: col.job.dbaDurationMonths,
  });
  const agreementType = resolveAgreementType(
    col.agreementType,
    col.job.modelAgreementType,
    recommendation.type,
  );
  const start = longDate(col.startDate),
    end = longDate(col.endDate);
  const periodLabel =
    start && end
      ? `van ${start} tot ${end}`
      : start
        ? `vanaf ${start}`
        : "voor de duur van de opdracht, in onderling overleg vast te stellen";
  const rateLabel =
    col.rate !== null ? `EUR ${col.rate} per uur` : "in onderling overleg vastgesteld";
  const freelancer = {
    userId: col.freelancer.userId,
    name: col.freelancer.user.name ?? "Opdrachtnemer",
  };
  const client = { userId: col.company.userId, name: col.company.name };
  return {
    version: 1,
    collaborationId: col.id,
    freelancer,
    client,
    jobTitle: col.job.title,
    rateLabel,
    periodLabel,
    content: buildModelAgreementContent({
      agreementType,
      jobTitle: col.job.title,
      jobDescription: col.job.description,
      freelancerName: freelancer.name,
      clientName: client.name,
      rateLabel,
      periodLabel,
    }),
    consent: SIGNING_CONSENT,
    consentVersion: SIGNING_CONSENT_VERSION,
    signatureMethod: SIGNING_METHOD_NOTE,
  };
}

function readDocument(col: SigningCollaboration): SigningDocument {
  if (col.signingEvidenceErasedAt) throw new SigningEvidenceErasedError();
  if (hasLegacySigningGap(col)) throw new LegacySigningEvidenceError();
  if (!col.signing) return buildSigningDocument(col);
  if (
    signingHash(col.signing.documentJson) !== col.signing.documentHash ||
    signingHash(col.signing.documentPdf) !== col.signing.pdfHash
  ) {
    throw new Error(
      "De vastgelegde documentversie kan niet worden bevestigd. Neem contact op met de beheerder.",
    );
  }
  const document = JSON.parse(col.signing.documentJson) as SigningDocument;
  if (
    document.version !== 1 ||
    document.collaborationId !== col.id ||
    document.freelancer.userId !== col.freelancer.userId ||
    document.client.userId !== col.company.userId
  ) {
    throw new Error("De partijen komen niet meer overeen met de vastgelegde overeenkomst.");
  }
  return document;
}

function canRead(
  actor: Actor,
  col: { company: { userId: string }; freelancer: { userId: string } },
) {
  return (
    actor.role === "ADMIN" ||
    (actor.role === "FREELANCER" && actor.id === col.freelancer.userId) ||
    (actor.role === "CLIENT" && actor.id === col.company.userId)
  );
}

/** Resolve existence and ownership before a page can commit its streaming loading state. */
export async function canAccessSigningPage(actor: Actor, id: string): Promise<boolean> {
  assertAuthenticated(actor);
  const col = await prisma.collaboration.findUnique({
    where: { id },
    select: {
      company: { select: { userId: true } },
      freelancer: { select: { userId: true } },
    },
  });
  return !!col && canRead(actor, col);
}

export async function loadSigningView(actor: Actor, id: string) {
  assertAuthenticated(actor);
  const col = await prisma.collaboration.findUnique({ where: { id }, include: signingInclude });
  if (!col || !canRead(actor, col)) return null;
  const document = readDocument(col);
  return {
    col,
    document,
    documentHash: col.signing?.documentHash ?? signingHash(JSON.stringify(document)),
    party: actor.role === "ADMIN" ? null : signingParty(actor.id, document),
  };
}

export async function buildSigningOriginal(document: SigningDocument, hash: string) {
  const bytes = await buildModelAgreementPdf({
    content: document.content,
    reference: `Handslag · inhoudskenmerk ${hash}`,
    signatories: [
      {
        role: "Opdrachtnemer",
        name: document.freelancer.name,
        status: "Ondertekeningen worden afzonderlijk vastgelegd in het bewijsdossier.",
      },
      {
        role: "Opdrachtgever",
        name: document.client.name,
        status: "Beide partijen ondertekenen dezelfde vastgelegde documentversie.",
      },
    ],
    generatedAtLabel: "",
    stableDate: new Date("2026-09-12T00:00:00.000Z"),
  });
  // Preserve the full Unicode source in the downloadable original, independently of PDF font coverage.
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  const stableDate = new Date("2026-09-12T00:00:00.000Z");
  await pdf.attach(Buffer.from(JSON.stringify(document), "utf8"), "overeenkomst.json", {
    mimeType: "application/json",
    description: "Vastgelegde tekstgegevens in oorspronkelijke schrijfwijze",
    creationDate: stableDate,
    modificationDate: stableDate,
  });
  return pdf.save();
}

/** Eén transactie voor document, eigen handtekening, audit en eventuele activatie. */
export async function recordContractSignature(
  actor: Actor,
  id: string,
  formData: FormData,
): Promise<void> {
  assertAuthenticated(actor);
  const view = await loadSigningView(actor, id);
  if (!view || !view.party || !["FREELANCER", "CLIENT"].includes(actor.role))
    throw new Error("Samenwerking niet gevonden.");
  const input = signingInputSchema.safeParse(
    Object.fromEntries(
      ["documentHash", "signerName", "password", "reviewed", "consent", "authority"].map((key) => [
        key,
        formData.get(key),
      ]),
    ),
  );
  if (!input.success)
    throw new Error(input.error.issues[0]?.message ?? "Controleer je bevestiging.");
  if (input.data.documentHash !== view.documentHash)
    throw new Error("De documentversie is gewijzigd. Lees de overeenkomst opnieuw.");
  if (view.col.signing?.signatures.some((s) => s.party === view.party && s.actorId === actor.id))
    return;
  if (!["PROPOSED", "ACTIVE"].includes(view.col.status) || view.col.disputedAt)
    throw new Error("Ondertekenen is gesloten: deze samenwerking is beëindigd of betwist.");
  if (!(await reauthRateLimiter.check(actor.id)).allowed)
    throw new Error("Te veel pogingen. Wacht een paar minuten en probeer het opnieuw.");
  const user = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { passwordHash: true, passwordChangedAt: true },
  });
  if (!user?.passwordHash || !(await bcrypt.compare(input.data.password, user.passwordHash)))
    throw new Error("Je wachtwoord klopt niet. Je handtekening is niet opgeslagen.");
  const original =
    view.col.signing?.documentPdf ?? (await buildSigningOriginal(view.document, view.documentHash));
  const now = new Date();
  let activated = false;
  await prisma.$transaction(
    async (tx) => {
      // Serializable + conditionele schrijfgrendel: status-/partij-/wachtwoordwijzigingen
      // en gelijktijdige handtekeningen kunnen geen half of dubbel bewijs opleveren.
      const freshUser = await tx.user.findFirst({
        where: {
          id: actor.id,
          status: "ACTIVE",
          role: actor.role,
          mustChangePassword: false,
          anonymizedAt: null,
          deletionRequestedAt: null,
          passwordHash: user.passwordHash,
          passwordChangedAt: user.passwordChangedAt,
        },
        select: { id: true, tenant: { select: { status: true } } },
      });
      if (!freshUser || (freshUser.tenant && freshUser.tenant.status !== "ACTIVE"))
        throw new Error("Je account is gewijzigd. Log opnieuw in voordat je ondertekent.");
      const otherPartyId =
        actor.id === view.document.freelancer.userId
          ? view.document.client.userId
          : view.document.freelancer.userId;
      const otherParty = await tx.user.findFirst({
        where: {
          id: otherPartyId,
          role: actor.id === view.document.freelancer.userId ? "CLIENT" : "FREELANCER",
          status: "ACTIVE",
          anonymizedAt: null,
          deletionRequestedAt: null,
        },
        select: { id: true, tenant: { select: { status: true } } },
      });
      if (!otherParty || (otherParty.tenant && otherParty.tenant.status !== "ACTIVE"))
        throw new Error(
          "De andere partij kan momenteel geen overeenkomst aangaan. Ondertekenen is gepauzeerd.",
        );
      const locked = await tx.collaboration.updateMany({
        where: {
          id,
          status: { in: ["PROPOSED", "ACTIVE"] },
          disputedAt: null,
          signingEvidenceErasedAt: null,
          updatedAt: view.col.updatedAt,
          freelancer: { userId: view.document.freelancer.userId },
          company: { userId: view.document.client.userId },
        },
        data: { updatedAt: now },
      });
      if (locked.count !== 1)
        throw new Error("De samenwerking is intussen gewijzigd. Open de overeenkomst opnieuw.");
      const col = await tx.collaboration.findUniqueOrThrow({
        where: { id },
        include: signingInclude,
      });
      const document = readDocument(col);
      const hash = col.signing?.documentHash ?? signingHash(JSON.stringify(document));
      if (hash !== input.data.documentHash)
        throw new Error("De afspraken zijn gewijzigd. Lees de nieuwe versie opnieuw.");
      const party = signingParty(actor.id, document);
      if (!party) throw new Error("Je kunt niet namens deze partij ondertekenen.");
      if (col.signing?.signatures.some((s) => s.party === party)) return;
      if (!col.signing)
        await tx.contractSigning.create({
          data: {
            collaborationId: id,
            createdAt: now,
            documentJson: JSON.stringify(document),
            documentHash: hash,
            documentPdf: Buffer.from(original),
            pdfHash: signingHash(original),
          },
        });
      await tx.contractSignature.create({
        data: {
          collaborationId: id,
          actorId: actor.id,
          party,
          signerName: input.data.signerName,
          consentVersion: document.consentVersion,
          authenticationMethod: "SESSION_AND_PASSWORD",
          signedAt: now,
        },
      });
      await tx.collaboration.update({
        where: { id },
        data: {
          ...(party === "FREELANCER"
            ? { agreementFreelancerSignedAt: col.agreementFreelancerSignedAt ?? now }
            : { agreementClientSignedAt: col.agreementClientSignedAt ?? now }),
          agreementType: document.content.type,
        },
      });
      await tx.auditLog.create({
        data: auditData({
          actorId: actor.id,
          action: "CONTRACT_SIGNATURE_RECORDED",
          entityType: "Collaboration",
          entityId: id,
          metadata: {
            party,
            documentHash: hash,
            pdfHash: signingHash(original),
            consentVersion: document.consentVersion,
            authenticationMethod: "SESSION_AND_PASSWORD",
          },
        }),
      });
      const signatures = await tx.contractSignature.findMany({
        where: { collaborationId: id },
        take: 2,
        select: { party: true, actorId: true },
      });
      const complete =
        signatures.some(
          (s) => s.party === "FREELANCER" && s.actorId === document.freelancer.userId,
        ) && signatures.some((s) => s.party === "CLIENT" && s.actorId === document.client.userId);
      if (complete && col.status === "PROPOSED") {
        const compliance = computeCompliance(
          col.job.credentialRequirements.map((r) => r.credentialType as CredentialType),
          col.freelancer.credentials.map((c) => ({
            type: c.type as CredentialType,
            status: c.status as CredentialStatus,
            expiresAt: c.expiresAt,
          })),
        );
        if (complianceBlocksPlacement(compliance.status))
          throw new Error(
            "Een vereist bewijsstuk ontbreekt of is verlopen. Laat het eerst beoordelen en onderteken daarna opnieuw.",
          );
        const event = await tx.domainEvent.create({
          data: {
            type: "CONTRACT_SIGNED",
            actorRole: actor.role,
            actorId: actor.id,
            subjectType: "Collaboration",
            subjectId: id,
            correlationId: id,
            dedupeKey: `contract-signed-${id}`,
            payload: JSON.stringify({ documentHash: hash }),
          },
        });
        await tx.eventHandlerRun.create({ data: { eventId: event.id, handler: "cascade" } });
        await applyCascadeEffects(
          tx,
          planContractSigned({
            collaborationId: id,
            status: "PROPOSED",
            freelancerUserId: document.freelancer.userId,
            clientUserId: document.client.userId,
            jobTitle: document.jobTitle,
            actorId: actor.id,
          }),
          {
            owners: { FREELANCER: document.freelancer.userId, CLIENT: document.client.userId },
            correlationId: id,
            eventId: event.id,
            occurredAt: now,
          },
        );
        activated = true;
      } else {
        await tx.notification.create({
          data: {
            userId: party === "FREELANCER" ? document.client.userId : document.freelancer.userId,
            type: "CONTRACT_SIGNATURE_RECORDED",
            title: "Handtekening vastgelegd",
            body: complete
              ? "Beide partijen hebben de overeenkomst ondertekend."
              : "Je medecontractant heeft ondertekend. Bekijk de overeenkomst en zet jouw handtekening.",
            link: `/samenwerkingen/${id}/ondertekenen`,
          },
        });
      }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  // A post-commit cache/mail problem must never claim that a persisted signature failed.
  try {
    await reauthRateLimiter.reset(actor.id);
  } catch {
    /* A retry remains subject to the existing limit. */
  }
  await invalidateSignals([view.document.freelancer.userId, view.document.client.userId]);
  if (activated) {
    try {
      const meta = await loadCollabMeta(id);
      if (meta) {
        const mail = getMailSender();
        await Promise.allSettled(
          [meta.freelancer, meta.client].map((recipient) =>
            mail.send(
              buildContractSignedEmail({
                recipient,
                jobTitle: meta.jobTitle,
                link: collabLink(id),
              }),
            ),
          ),
        );
      }
    } catch {
      /* The persisted in-app notifications remain available. */
    }
  }
}
