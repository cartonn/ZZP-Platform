"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/authz";
import { toSafeActionError } from "@/lib/safe-action-error";
import { auditData } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import { getIdentityVerifier } from "@/lib/services/identity-verifier";
import {
  mockVerificationBlocked,
  MOCK_VERIFICATION_BLOCKED_MESSAGE,
} from "@/lib/services/verification-policy";
import { prisma } from "@/lib/db";

export type IdentityState = { ok?: true; error?: string } | undefined;

/** Identiteitsverificatie (iDIN/eIDAS, achter de service-grens). Bij succes wordt de geverifieerde
 *  juridische naam vastgelegd — basis voor het vertrouwensniveau en naamcontrole bij credentials. */
export async function verifyIdentity(
  _prev: IdentityState,
  formData: FormData,
): Promise<IdentityState> {
  const actor = await requireActor();
  const user = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { name: true, identityVerifiedAt: true },
  });
  if (user?.identityVerifiedAt) return { error: "Je identiteit is al geverifieerd." };

  const providedName = String(formData.get("legalName") ?? "").trim();
  if (!providedName) return { error: "Vul je juridische naam in (zoals bij je bank/DigiD)." };

  let result;
  try {
    result = await getIdentityVerifier().verify({ accountName: user?.name ?? "", providedName });
  } catch (e) {
    return { error: toSafeActionError(e, "Verificatie mislukt.") };
  }
  if (!result.verified) return { error: result.message };

  const meta = await requestMeta();
  // Fail-closed poort (security-review 2026-07-07, KRITIEK): een demo-identiteitsverificatie
  // (source "MOCK") vergelijkt slechts de opgegeven naam met de zelf-gekozen accountnaam en mag op
  // echte productie-data geen identiteit als geverifieerd vastleggen (basis voor het vertrouwensniveau
  // + naamcontrole bij credentials). We leggen niets vast, auditen de geweigerde poging en verwijzen
  // naar de echte iDIN/eIDAS-koppeling. Buiten productie / bij SEED_DEMO / met opt-in nooit bereikt.
  if (mockVerificationBlocked(result.source)) {
    await prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "IDENTITY_VERIFY_BLOCKED",
        entityType: "User",
        entityId: actor.id,
        metadata: { reason: "mock-verifier-op-productie" },
        ...meta,
      }),
    });
    return { error: MOCK_VERIFICATION_BLOCKED_MESSAGE };
  }
  await prisma.$transaction([
    prisma.user.update({
      where: { id: actor.id },
      data: { identityVerifiedAt: new Date(), verifiedLegalName: result.verifiedName },
    }),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "IDENTITY_VERIFIED",
        entityType: "User",
        entityId: actor.id,
        metadata: { source: result.source },
        ...meta,
      }),
    }),
  ]);
  revalidatePath("/account");
  return { ok: true };
}

/** AVG: gebruiker vraagt verwijdering aan. Account blijft actief tot beheer het afhandelt
 *  (i.v.m. fiscale/contractuele bewaarplicht); aanvraag is intrekbaar. */
export async function requestAccountDeletion(): Promise<void> {
  const actor = await requireActor();
  const meta = await requestMeta();
  // unbounded-allow: admin-veiligheidscheck; geen lijst-view
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });

  await prisma.$transaction([
    prisma.user.update({ where: { id: actor.id }, data: { deletionRequestedAt: new Date() } }),
    ...admins.map((a) =>
      prisma.notification.create({
        data: {
          userId: a.id,
          type: "ACCOUNT_DELETION_REQUESTED",
          title: "Verwijderverzoek",
          body: "Een gebruiker heeft accountverwijdering aangevraagd.",
          link: "/admin/gebruikersbeheer",
        },
      }),
    ),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "ACCOUNT_DELETION_REQUESTED",
        entityType: "User",
        entityId: actor.id,
        ...meta,
      }),
    }),
  ]);
  revalidatePath("/account");
}

export async function cancelDeletionRequest(): Promise<void> {
  const actor = await requireActor();
  const meta = await requestMeta();
  await prisma.$transaction([
    prisma.user.update({ where: { id: actor.id }, data: { deletionRequestedAt: null } }),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "ACCOUNT_DELETION_CANCELLED",
        entityType: "User",
        entityId: actor.id,
        ...meta,
      }),
    }),
  ]);
  revalidatePath("/account");
}
