"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole, AuthorizationError } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { generateTempPassword } from "@/lib/onboarding/password";
import { createTenantWithOwner } from "@/lib/franchise/create-tenant";
import { statusForActivation, type ActivationDecision } from "@/lib/franchise/activation";
import { buildActivationEmail, buildRejectionEmail } from "@/lib/franchise/activation-email";
import { getMailSender, isMailDeliveryConfigured } from "@/lib/services/mail-sender";
import { logMailFailure } from "@/lib/observability/mail-failure";

const schema = z.object({
  tenantName: z.string().trim().min(2, "Bemiddeling-naam is te kort.").max(120),
  franchiserName: z.string().trim().min(2, "Naam is te kort.").max(120),
  franchiserEmail: z.string().trim().toLowerCase().email("Ongeldig e-mailadres."),
});

export type FranchiseState =
  | { ok: true; email: string; tempPassword: string; tenantName: string }
  | { error: string; fieldErrors?: Record<string, string> }
  | undefined;

/** Maakt een Franchiser-account + bijbehorende tenant (franchise). Alleen voor platform-admins. */
export async function createFranchise(
  _prev: FranchiseState,
  formData: FormData,
): Promise<FranchiseState> {
  let actor;
  try {
    actor = await requireRole("ADMIN");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const parsed = schema.safeParse({
    tenantName: formData.get("tenantName"),
    franchiserName: formData.get("franchiserName"),
    franchiserEmail: formData.get("franchiserEmail"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0];
      if (typeof k === "string" && !fieldErrors[k]) fieldErrors[k] = issue.message;
    }
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }
  const { tenantName, franchiserName, franchiserEmail } = parsed.data;

  if (await prisma.user.findUnique({ where: { email: franchiserEmail }, select: { id: true } })) {
    return { error: "Er bestaat al een account met dit e-mailadres.", fieldErrors: { franchiserEmail: "Al in gebruik." } }; // prettier-ignore
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  // Gedeelde aanmaak met de zelfaanmelding (/register): één transactie voor account + tenant +
  // koppeling + audit. Een door de admin aangemaakte bemiddeling is direct ACTIVE.
  await createTenantWithOwner({
    tenantName,
    ownerName: franchiserName,
    ownerEmail: franchiserEmail,
    passwordHash,
    status: "ACTIVE",
    mustChangePassword: true,
    auditAction: "FRANCHISE_CREATED",
    actorId: actor.id,
    auditMetadata: { owner: franchiserEmail },
  });

  revalidatePath("/admin/franchises");
  return { ok: true, email: franchiserEmail, tempPassword, tenantName };
}

// --- Activatiepoort: een zelf-aangemeld bureau goedkeuren of afwijzen -----------------------

const decisionSchema = z.object({
  tenantId: z.string().trim().min(1),
  decision: z.enum(["ACTIVATE", "REJECT"]),
  // Reden is alleen bij een afwijzing verplicht; dat dwingt statusForActivation server-side af.
  reason: z.string().trim().max(500).optional(),
});

export type ActivationState = { ok?: true; message?: string; error?: string } | undefined;

/**
 * Beoordeelt een wachtende aanmelding (mutatieketen: auth → rol → Zod → statusovergang → actie →
 * audit → notificatie). Alleen een platform-admin beslist; de overgang loopt via de expliciete
 * TENANT_TRANSITIONS-map, dus een al beoordeelde aanmelding kan niet nogmaals worden gezet.
 */
export async function decideActivation(
  _prev: ActivationState,
  formData: FormData,
): Promise<ActivationState> {
  let actor;
  try {
    actor = await requireRole("ADMIN");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }

  const parsed = decisionSchema.safeParse({
    tenantId: formData.get("tenantId"),
    decision: formData.get("decision"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) return { error: "Controleer de ingevoerde gegevens." };
  const { tenantId, reason } = parsed.data;
  const decision: ActivationDecision = parsed.data.decision;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, status: true, owner: { select: { id: true, name: true, email: true } } }, // prettier-ignore
  });
  if (!tenant) return { error: "Deze aanmelding bestaat niet (meer)." };

  let next;
  try {
    next = statusForActivation(tenant.status, decision, reason);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Ongeldige beslissing." };
  }

  // Atomair: status + reden + in-app notificatie + auditregel. `updateMany` met de verwachte
  // huidige status maakt de beslissing race-veilig (twee admins tegelijk → één wint).
  const applied = await prisma.$transaction(async (tx) => {
    const res = await tx.tenant.updateMany({
      where: { id: tenantId, status: "PENDING" },
      data: { status: next, activationNote: next === "REJECTED" ? (reason ?? null) : null },
    });
    if (res.count === 0) return false;
    await tx.notification.create({
      data: {
        userId: tenant.owner.id,
        type: "ACCOUNT_STATUS",
        title: next === "ACTIVE" ? "Bureau geactiveerd" : "Aanmelding afgewezen",
        body:
          next === "ACTIVE"
            ? `De aanmelding van ${tenant.name} is goedgekeurd. Je werkplek staat klaar.`
            : `De aanmelding van ${tenant.name} is afgewezen: ${reason}`,
        link: next === "ACTIVE" ? "/franchise/diensten" : "/aanmelding",
      },
    });
    await tx.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: next === "ACTIVE" ? "FRANCHISE_ACTIVATED" : "FRANCHISE_REJECTED",
        entityType: "Tenant",
        entityId: tenantId,
        metadata: { from: tenant.status, to: next, ...(next === "REJECTED" ? { reason } : {}) },
      }),
    });
    return true;
  });
  if (!applied) return { error: "Deze aanmelding is al beoordeeld." };

  // Eén e-mail per beslissing, best-effort buiten de transactie: een haperend mailkanaal mag de
  // beslissing nooit terugdraaien.
  if (isMailDeliveryConfigured()) {
    const loginUrl = await franchiseLoginUrl();
    const message =
      next === "ACTIVE"
        ? buildActivationEmail({
            contactName: tenant.owner.name,
            contactEmail: tenant.owner.email,
            tenantName: tenant.name,
            loginUrl,
          })
        : buildRejectionEmail({
            contactName: tenant.owner.name,
            contactEmail: tenant.owner.email,
            tenantName: tenant.name,
            loginUrl,
            reason: reason ?? "",
          });
    getMailSender()
      .send(message)
      .catch((err: unknown) => logMailFailure("[franchise-activation]", err));
  }

  revalidatePath("/admin/franchises");
  return {
    ok: true,
    message:
      next === "ACTIVE"
        ? `${tenant.name} is geactiveerd.`
        : `De aanmelding van ${tenant.name} is afgewezen.`,
  };
}

async function franchiseLoginUrl(): Promise<string> {
  try {
    const { publicOrigin } = await import("@/lib/public-url");
    return `${await publicOrigin()}/login`;
  } catch {
    return "/login";
  }
}
